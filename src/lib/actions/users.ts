"use server";

import { revalidatePath } from "next/cache";

import { requireHrAdmin, requireSuperAdmin } from "@/lib/auth/require-role";
import { PAGE_SIZE } from "@/lib/employees/constants";
import type { UserEligibleEmployeeOption } from "@/lib/employees/types";
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
  const { role: actorRole } = await requireHrAdmin();

  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "warehouse_manager") as AppRole;

  if (!employeeId || !password) {
    return { error: "Employee and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (!APP_ROLES.includes(role)) {
    return { error: "Invalid role selected." };
  }

  if (role === "super_admin" && actorRole !== "super_admin") {
    return { error: "Only a super admin can create super admin accounts." };
  }

  const supabase = await createClient();

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, status, employee_type, email")
    .eq("id", employeeId)
    .maybeSingle();

  if (employeeError || !employee) {
    return { error: "Employee not found." };
  }

  if (employee.status !== "active") {
    return { error: "Only active employees can become users." };
  }

  if (employee.employee_type !== "administrative") {
    return { error: "Only administrative employees can have login accounts." };
  }

  const email = String(employee.email ?? "").trim();
  if (!email) {
    return {
      error: "This employee has no email on file. Add it in HR first.",
    };
  }

  const admin = createAdminClient();

  const { data: existingUser, error: existingUserError } = await admin
    .from("users")
    .select("id")
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (existingUserError) {
    return { error: existingUserError.message };
  }

  if (existingUser) {
    return { error: "This employee already has a user account." };
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Could not create auth user." };
  }

  const { error: profileError } = await admin
    .from("users")
    .update({
      email,
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
  await requireHrAdmin();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("users")
    .select(
      `
      id,
      email,
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
    builder = builder.or(`email.ilike.${term},role.ilike.${term}`);
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  return { rows: data ?? [], total: count ?? 0 };
}

export async function getEmployeesWithoutUsers(): Promise<
  UserEligibleEmployeeOption[]
> {
  await requireHrAdmin();

  const supabase = await createClient();
  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select(
      "id, employee_code, first_name, last_name, department, employee_type, email",
    )
    .eq("status", "active")
    .eq("employee_type", "administrative")
    .not("email", "is", null)
    .neq("email", "")
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

  return (employees ?? [])
    .filter((employee) => !linkedIds.has(employee.id))
    .map(({ employee_type: _type, ...employee }) => employee);
}

export async function updateUserStatus(userId: string, status: string) {
  const { authUser, role: actorRole } = await requireHrAdmin();

  if (!["active", "disabled"].includes(status)) {
    throw new Error("Invalid status.");
  }

  if (userId === authUser?.id) {
    throw new Error("You cannot change your own account status.");
  }

  const supabase = await createClient();

  const { data: target, error: lookupError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (lookupError || !target) {
    throw new Error("User not found.");
  }

  if (target.role === "super_admin") {
    throw new Error("Super admin accounts cannot be disabled.");
  }

  if (target.role === "admin" && actorRole !== "super_admin") {
    throw new Error("Only a super admin can change admin account status.");
  }

  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/users");
}

export async function updateUserRole(userId: string, role: string) {
  const { authUser } = await requireSuperAdmin();

  if (!APP_ROLES.includes(role as AppRole)) {
    throw new Error("Invalid role selected.");
  }

  if (!authUser || userId === authUser.id) {
    throw new Error("You cannot change your own role.");
  }

  const supabase = await createClient();

  const { data: target, error: lookupError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (lookupError || !target) {
    throw new Error("User not found.");
  }

  if (target.role === role) {
    return;
  }

  if (target.role === "super_admin" && role !== "super_admin") {
    const { count, error: countError } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");

    if (countError) {
      throw new Error(countError.message);
    }

    if ((count ?? 0) <= 1) {
      throw new Error("Cannot change the role of the only super admin.");
    }
  }

  const { error } = await supabase
    .from("users")
    .update({ role: role as AppRole })
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
    .select("id, email, role")
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
