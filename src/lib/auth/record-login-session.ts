import type { SupabaseClient } from "@supabase/supabase-js";

import { officeLocalDate } from "@/lib/office/date";
import type {
  GeofenceRequirement,
  RecordLoginAttendanceResult,
} from "@/lib/office/types";

type RpcLoginResult = {
  ok?: boolean;
  code?: string;
  location_valid?: boolean;
  distance_meters?: number | null;
  allowed_meters?: number;
};

export async function getGeofenceRequirement(
  supabase: SupabaseClient,
): Promise<GeofenceRequirement> {
  const { data, error } = await supabase.rpc("get_geofence_requirement");

  if (error || !data || typeof data !== "object") {
    return { required: false, facilityName: "Terrana facility" };
  }

  const payload = data as { required?: boolean; facility_name?: string };
  return {
    required: Boolean(payload.required),
    facilityName: payload.facility_name ?? "Terrana facility",
  };
}

export async function recordLoginSession(
  supabase: SupabaseClient,
  coords?: { latitude: number; longitude: number } | null,
): Promise<RecordLoginAttendanceResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: "not_authenticated" };
  }

  const loginTime = new Date().toISOString();

  const { data, error } = await supabase.rpc("record_login_attendance", {
    login_time: loginTime,
    login_lat: coords?.latitude ?? null,
    login_lng: coords?.longitude ?? null,
  });

  if (error) {
    return {
      ok: false,
      code: "rpc_failed",
      message: error.message,
    };
  }

  const result = (data ?? {}) as RpcLoginResult;

  if (!result.ok) {
    const code = result.code ?? "rpc_failed";
    if (code === "outside_geofence") {
      return {
        ok: false,
        code: "outside_geofence",
        distanceMeters:
          typeof result.distance_meters === "number"
            ? result.distance_meters
            : undefined,
        allowedMeters:
          typeof result.allowed_meters === "number"
            ? result.allowed_meters
            : undefined,
      };
    }
    if (code === "location_required") {
      return { ok: false, code: "location_required" };
    }
    if (code === "account_inactive") {
      return { ok: false, code: "account_inactive" };
    }
    return { ok: false, code: "not_authenticated" };
  }

  return {
    ok: true,
    locationValid: Boolean(result.location_valid ?? true),
    distanceMeters:
      typeof result.distance_meters === "number" ? result.distance_meters : null,
  };
}

/** @deprecated Use recordLoginSession via RPC — kept for OAuth fallback without geo. */
export async function recordLoginSessionLegacy(
  supabase: SupabaseClient,
): Promise<{ ok: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false };
  }

  const now = new Date();
  const attendanceDate = officeLocalDate(now);

  await supabase.from("attendance").insert({
    user_id: user.id,
    login_time: now.toISOString(),
    attendance_date: attendanceDate,
    location_valid: false,
  });

  await supabase.rpc("update_own_last_login", {
    login_time: now.toISOString(),
  });

  return { ok: true };
}

export function loginAttendanceErrorMessage(
  result: Extract<RecordLoginAttendanceResult, { ok: false }>,
): string {
  switch (result.code) {
    case "location_required":
      return "Location is required to sign in at the Terrana facility. Allow location access and try again.";
    case "outside_geofence": {
      const distance =
        typeof result.distanceMeters === "number"
          ? `${Math.round(result.distanceMeters)}m`
          : "too far";
      const allowed =
        typeof result.allowedMeters === "number"
          ? `${result.allowedMeters}m`
          : "the facility boundary";
      return `You are outside the facility (${distance} away; limit ${allowed}). Sign in on-site to mark attendance.`;
    }
    case "account_inactive":
      return "Your account has been disabled. Contact an administrator.";
    case "rpc_failed":
      return result.message ?? "Could not record attendance. Try again.";
    default:
      return "Sign in failed. Try again.";
  }
}
