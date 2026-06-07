import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signEmployeePhotoPath } from "@/lib/employees/signed-photo-url";
import { normalizeAppRole, type AppRole } from "@/lib/roles";

export type AppUser = {
  id: string;
  email: string;
  role: AppRole;
  status: string;
  displayName: string;
  firstName: string;
  photoUrl: string | null;
};

type EmployeeProfile = {
  first_name: string;
  last_name: string;
  photo_url: string | null;
};

function resolveFullName(
  employee: EmployeeProfile | null | undefined,
): string {
  if (!employee) {
    return "";
  }

  const first = employee.first_name?.trim() ?? "";
  const last = employee.last_name?.trim() ?? "";
  return `${first} ${last}`.trim();
}

function resolveFirstName(
  employee: EmployeeProfile | null | undefined,
): string {
  const firstName = employee?.first_name?.trim();
  return firstName || "User";
}

/** Cached per request — one Supabase auth + profile read per page render. */
export const getSessionUser = cache(async (): Promise<{
  authUser: { id: string; email?: string } | null;
  appUser: AppUser | null;
}> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authUser: null, appUser: null };
  }

  const { data: appUserRow } = await supabase
    .from("users")
    .select(
      "id, email, role, status, employee_id, employees ( first_name, last_name, photo_url )",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (appUserRow?.status === "disabled") {
    await supabase.auth.signOut();
    redirect("/login?error=account_disabled");
  }

  const employeeData = appUserRow?.employees;
  let employee = Array.isArray(employeeData) ? employeeData[0] : employeeData;

  if (!employee && appUserRow?.employee_id) {
    const { data: linkedEmployee } = await supabase
      .from("employees")
      .select("first_name, last_name, photo_url")
      .eq("id", appUserRow.employee_id)
      .maybeSingle();
    employee = linkedEmployee ?? undefined;
  }

  const fullName = resolveFullName(employee);
  const photoUrl = await signEmployeePhotoPath(employee?.photo_url);

  return {
    authUser: { id: user.id, email: user.email },
    appUser: appUserRow
      ? {
          id: appUserRow.id,
          email: appUserRow.email,
          role: normalizeAppRole(appUserRow.role),
          status: appUserRow.status,
          displayName: fullName,
          firstName: resolveFirstName(employee),
          photoUrl,
        }
      : null,
  };
});
