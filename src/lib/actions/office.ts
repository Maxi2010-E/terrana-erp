"use server";

import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/auth/require-role";
import { GENERAL_BOARD_PAGE_SIZE, PRIVATE_THREAD_PAGE_SIZE } from "@/lib/office/constants";
import { officeLocalDate } from "@/lib/office/date";
import type {
  AttendanceRosterSummary,
  FacilityGeofenceSettings,
  GeneralBoardMessageRow,
  OfficeTaskRow,
  OfficeUserOption,
  PrivateConversationRow,
  PrivateMessageRow,
} from "@/lib/office/types";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import {
  nameFromMap,
  resolveUserDisplayNames,
} from "@/lib/users/resolve-user-names";

function trimBody(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error("Message cannot be empty.");
  }
  if (trimmed.length > max) {
    throw new Error(`Message is too long (max ${max} characters).`);
  }
  return trimmed;
}

export async function getDailyAttendanceRoster(
  dateInput?: string,
): Promise<AttendanceRosterSummary> {
  await requireRole(["super_admin", "admin"]);

  const date = dateInput && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
    ? dateInput
    : officeLocalDate();

  const supabase = await createClient();

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("status", "active")
    .order("email", { ascending: true });

  if (usersError) {
    throw new Error(usersError.message);
  }

  const { data: attendanceRows, error: attendanceError } = await supabase
    .from("attendance")
    .select(
      "user_id, login_time, location_valid, distance_from_facility_meters",
    )
    .eq("attendance_date", date)
    .eq("location_valid", true)
    .order("login_time", { ascending: true });

  if (attendanceError) {
    throw new Error(attendanceError.message);
  }

  const firstLoginByUser = new Map<
    string,
    {
      loginTime: string;
      locationValid: boolean;
      distanceMeters: number | null;
    }
  >();

  for (const row of attendanceRows ?? []) {
    if (!firstLoginByUser.has(row.user_id)) {
      firstLoginByUser.set(row.user_id, {
        loginTime: row.login_time,
        locationValid: row.location_valid,
        distanceMeters: row.distance_from_facility_meters,
      });
    }
  }

  const rows = (users ?? []).map((user) => {
    const hit = firstLoginByUser.get(user.id);
    return {
      userId: user.id,
      email: user.email,
      role: ROLE_LABELS[user.role as AppRole] ?? user.role,
      present: Boolean(hit),
      firstLoginTime: hit?.loginTime ?? null,
      locationValid: hit?.locationValid ?? null,
      distanceMeters: hit?.distanceMeters ?? null,
    };
  });

  return {
    date,
    total: rows.length,
    presentCount: rows.filter((row) => row.present).length,
    rows,
  };
}

export async function listGeneralBoardMessages(): Promise<GeneralBoardMessageRow[]> {
  await requireAuth();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_board_messages")
    .select("id, body, author_id, created_at")
    .order("created_at", { ascending: false })
    .limit(GENERAL_BOARD_PAGE_SIZE);

  if (error) {
    throw new Error(error.message);
  }

  const nameByUserId = await resolveUserDisplayNames(
    (data ?? []).map((row) => row.author_id),
  );

  return (data ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    authorId: row.author_id,
    authorName: nameFromMap(nameByUserId, row.author_id) ?? row.author_id,
    createdAt: row.created_at,
  }));
}

export async function postGeneralBoardMessage(formData: FormData) {
  const { authUser } = await requireAuth();
  if (!authUser) {
    throw new Error("Not signed in.");
  }

  const body = trimBody(String(formData.get("body") ?? ""), 2000);
  const supabase = await createClient();

  const { error } = await supabase.from("company_board_messages").insert({
    body,
    author_id: authUser.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/office");
}

export async function deleteGeneralBoardMessage(messageId: string) {
  await requireRole(["super_admin", "admin"]);

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_board_messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/office");
}

export async function listOfficeUserOptions(): Promise<OfficeUserOption[]> {
  const { authUser } = await requireAuth();
  if (!authUser) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("status", "active")
    .neq("id", authUser.id)
    .order("email", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const nameByUserId = await resolveUserDisplayNames(
    (data ?? []).map((row) => row.id),
  );

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    displayName: nameFromMap(nameByUserId, row.id) ?? row.email,
  }));
}

export async function listPrivateConversations(): Promise<PrivateConversationRow[]> {
  const { authUser } = await requireAuth();
  if (!authUser) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("private_messages")
    .select("id, sender_id, recipient_id, body, read_at, created_at")
    .or(`sender_id.eq.${authUser.id},recipient_id.eq.${authUser.id}`)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  const conversationMap = new Map<
    string,
    {
      lastMessageBody: string;
      lastMessageAt: string;
      unreadCount: number;
    }
  >();

  for (const row of data ?? []) {
    const otherUserId =
      row.sender_id === authUser.id ? row.recipient_id : row.sender_id;

    if (conversationMap.has(otherUserId)) {
      const existing = conversationMap.get(otherUserId)!;
      if (row.recipient_id === authUser.id && !row.read_at) {
        existing.unreadCount += 1;
      }
      continue;
    }

    conversationMap.set(otherUserId, {
      lastMessageBody: row.body,
      lastMessageAt: row.created_at,
      unreadCount:
        row.recipient_id === authUser.id && !row.read_at ? 1 : 0,
    });
  }

  const otherIds = [...conversationMap.keys()];
  const { data: users } = await supabase
    .from("users")
    .select("id, email")
    .in("id", otherIds);

  const emailById = new Map((users ?? []).map((u) => [u.id, u.email]));
  const nameByUserId = await resolveUserDisplayNames(otherIds);

  return otherIds.map((otherUserId) => {
    const meta = conversationMap.get(otherUserId)!;
    return {
      otherUserId,
      otherUserEmail: emailById.get(otherUserId) ?? otherUserId,
      otherUserName:
        nameFromMap(nameByUserId, otherUserId) ??
        emailById.get(otherUserId) ??
        otherUserId,
      lastMessageBody: meta.lastMessageBody,
      lastMessageAt: meta.lastMessageAt,
      unreadCount: meta.unreadCount,
    };
  });
}

export async function listPrivateMessages(
  withUserId: string,
): Promise<PrivateMessageRow[]> {
  const { authUser } = await requireAuth();
  if (!authUser) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("private_messages")
    .select("id, sender_id, recipient_id, body, read_at, created_at")
    .or(
      `and(sender_id.eq.${authUser.id},recipient_id.eq.${withUserId}),and(sender_id.eq.${withUserId},recipient_id.eq.${authUser.id})`,
    )
    .order("created_at", { ascending: true })
    .limit(PRIVATE_THREAD_PAGE_SIZE);

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("private_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", authUser.id)
    .eq("sender_id", withUserId)
    .is("read_at", null);

  return (data ?? []).map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
    isMine: row.sender_id === authUser.id,
  }));
}

export async function sendPrivateMessage(formData: FormData) {
  const { authUser } = await requireAuth();
  if (!authUser) {
    throw new Error("Not signed in.");
  }

  const recipientId = String(formData.get("recipient_id") ?? "").trim();
  const body = trimBody(String(formData.get("body") ?? ""), 2000);

  if (!recipientId) {
    throw new Error("Pick who to message.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("private_messages").insert({
    sender_id: authUser.id,
    recipient_id: recipientId,
    body,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/office");
}

export async function listOpenBoardTasks(): Promise<OfficeTaskRow[]> {
  await requireAuth();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_daily_tasks")
    .select(
      "id, title, notes, status, original_date, created_by, created_at, completed_by, completed_at",
    )
    .eq("status", "open")
    .order("original_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return mapTaskRows(data ?? []);
}

export async function listCompletedBoardTasksToday(): Promise<OfficeTaskRow[]> {
  await requireAuth();

  const today = officeLocalDate();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_daily_tasks")
    .select(
      "id, title, notes, status, original_date, created_by, created_at, completed_by, completed_at",
    )
    .eq("status", "done")
    .gte("completed_at", `${today}T00:00:00`)
    .order("completed_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return mapTaskRows(data ?? []);
}

async function mapTaskRows(
  rows: Array<{
    id: string;
    title: string;
    notes: string | null;
    status: "open" | "done";
    original_date: string;
    created_by: string;
    created_at: string;
    completed_by: string | null;
    completed_at: string | null;
  }>,
): Promise<OfficeTaskRow[]> {
  const nameByUserId = await resolveUserDisplayNames(
    rows.flatMap((row) => [row.created_by, row.completed_by]),
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    notes: row.notes,
    status: row.status,
    originalDate: row.original_date,
    createdBy: row.created_by,
    createdByName: nameFromMap(nameByUserId, row.created_by) ?? row.created_by,
    createdAt: row.created_at,
    completedBy: row.completed_by,
    completedByName: nameFromMap(nameByUserId, row.completed_by),
    completedAt: row.completed_at,
  }));
}

export async function createBoardTask(formData: FormData) {
  const { authUser } = await requireRole(["super_admin", "admin"]);
  if (!authUser) {
    throw new Error("Not signed in.");
  }

  const title = trimBody(String(formData.get("title") ?? ""), 200);
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw.slice(0, 1000) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("company_daily_tasks").insert({
    title,
    notes,
    original_date: officeLocalDate(),
    created_by: authUser.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/office");
}

export async function completeBoardTask(taskId: string) {
  const { authUser } = await requireRole(["super_admin", "admin"]);
  if (!authUser) {
    throw new Error("Not signed in.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_daily_tasks")
    .update({
      status: "done",
      completed_by: authUser.id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("status", "open");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/office");
}

export async function getFacilityGeofenceSettings(): Promise<FacilityGeofenceSettings> {
  await requireRole(["super_admin"]);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select(
      "geofence_enabled, facility_name, facility_latitude, facility_longitude, facility_radius_meters",
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    geofenceEnabled: data?.geofence_enabled ?? false,
    facilityName: data?.facility_name ?? "Terrana facility",
    facilityLatitude: data?.facility_latitude ?? null,
    facilityLongitude: data?.facility_longitude ?? null,
    facilityRadiusMeters: data?.facility_radius_meters ?? 200,
  };
}

export async function updateFacilityGeofenceSettings(formData: FormData) {
  await requireRole(["super_admin"]);

  const geofenceEnabled = formData.get("geofence_enabled") === "on";
  const facilityName =
    String(formData.get("facility_name") ?? "").trim() || "Terrana facility";
  const latRaw = String(formData.get("facility_latitude") ?? "").trim();
  const lngRaw = String(formData.get("facility_longitude") ?? "").trim();
  const radiusRaw = Number.parseInt(
    String(formData.get("facility_radius_meters") ?? "200"),
    10,
  );

  const facilityLatitude = latRaw.length > 0 ? Number.parseFloat(latRaw) : null;
  const facilityLongitude = lngRaw.length > 0 ? Number.parseFloat(lngRaw) : null;
  const facilityRadiusMeters = Number.isFinite(radiusRaw)
    ? Math.min(Math.max(radiusRaw, 50), 5000)
    : 200;

  if (geofenceEnabled) {
    if (
      facilityLatitude == null ||
      facilityLongitude == null ||
      Number.isNaN(facilityLatitude) ||
      Number.isNaN(facilityLongitude)
    ) {
      throw new Error("Set facility latitude and longitude before enabling geofence.");
    }
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("company_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!row?.id) {
    throw new Error("Company settings row missing.");
  }

  const { error } = await supabase
    .from("company_settings")
    .update({
      geofence_enabled: geofenceEnabled,
      facility_name: facilityName,
      facility_latitude: facilityLatitude,
      facility_longitude: facilityLongitude,
      facility_radius_meters: facilityRadiusMeters,
    })
    .eq("id", row.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/settings");
  revalidatePath("/login");
}

export async function getPrivateUnreadCount(): Promise<number> {
  const { authUser } = await requireAuth();
  if (!authUser) {
    return 0;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("private_messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", authUser.id)
    .is("read_at", null);

  if (error) {
    return 0;
  }

  return count ?? 0;
}
