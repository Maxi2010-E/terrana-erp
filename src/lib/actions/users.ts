"use server";

import { revalidatePath } from "next/cache";

import { requireHrAdmin } from "@/lib/auth/require-role";
import { PAGE_SIZE } from "@/lib/employees/constants";
import { APP_ROLES, type AppRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UserFormState = {
  error?: string;
  success?: boolean;
};

export async function createAppUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireHrAdmin();

  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "accounts") as AppRole;

  if (!employeeId || !username || !email || !password) {
    return { error: "Employee, username, email, and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (!APP_ROLES.includes(role)) {
    return { error: "Invalid role selected." };
  }

  const supabase = await createClient();

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, status")
    .eq("id", employeeId)
    .maybeSingle();

  if (employeeError || !employee) {
    return { error: "Employee not found." };
  }

  if (employee.status !== "active") {
    return { error: "Only active employees can become users." };
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (existingUser) {
    return { error: "This employee already has a user account." };
  }

  const admin = createAdminClient();
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Could not create auth user." };
  }

  const { error: profileError } = await admin
    .from("users")
    .update({
      email,
      username,
      role,
      status: "active",
      employee_id: employeeId,
    })
    .eq("id", authData.user.id);

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function getUsersList(page: number, query: string) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("users")
    .select(
      `
      id,
      email,
      username,
      role,
      status,
      last_login,
      employee_id,
      employees (
        employee_code,
        first_name,
        last_name
      )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `email.ilike.${term},username.ilike.${term},role.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  return { rows: data ?? [], total: count ?? 0 };
}

export async function getEmployeesWithoutUsers() {
  const supabase = await createClient();
  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select("id, employee_code, first_name, last_name, department")
    .eq("status", "active")
    .order("last_name");

  if (employeesError) {
    throw new Error(employeesError.message);
  }

  const { data: linkedUsers, error: usersError } = await supabase
    .from("users")
    .select("employee_id")
    .not("employee_id", "is", null);

  if (usersError) {
    throw new Error(usersError.message);
  }

  const linkedIds = new Set(
    (linkedUsers ?? []).map((row) => row.employee_id as string),
  );

  return (employees ?? []).filter((employee) => !linkedIds.has(employee.id));
}

export async function updateUserStatus(userId: string, status: string) {
  await requireHrAdmin();

  if (!["active", "disabled"].includes(status)) {
    throw new Error("Invalid status.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/users");
}

export async function getUserForPasswordReset(userId: string) {
  const { role: actorRole } = await requireHrAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, username, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.role === "super_admin" && actorRole !== "super_admin") {
    return null;
  }

  return data;
}

export async function resetUserPassword(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const { role: actorRole } = await requireHrAdmin();

  const userId = String(formData.get("user_id") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!userId || !password) {
    return { error: "User and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data: appUser, error: lookupError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (lookupError || !appUser) {
    return { error: "User not found." };
  }

  if (appUser.role === "super_admin" && actorRole !== "super_admin") {
    return { error: "Only a super admin can reset super admin passwords." };
  }

  const admin = createAdminClient();
  const { error: resetError } = await admin.auth.admin.updateUserById(userId, {
    password,
  });

  if (resetError) {
    return { error: resetError.message };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${userId}/reset-password`);
  return { success: true };
}
