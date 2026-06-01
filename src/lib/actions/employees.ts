"use server";

import { revalidatePath } from "next/cache";

import { requireHrAdmin } from "@/lib/auth/require-role";
import type {
  EmployeeDepartment,
  EmployeeStatus,
  EmployeeType,
} from "@/lib/employees/constants";
import { PAGE_SIZE } from "@/lib/employees/constants";
import { createClient } from "@/lib/supabase/server";

export type EmployeeFormState = {
  error?: string;
  success?: boolean;
};

type EmployeeInput = {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  hire_date: string;
  status: EmployeeStatus;
  employee_type: EmployeeType;
  department: EmployeeDepartment;
  job_title: string;
  monthly_salary: string;
  guarantor_name?: string;
  guarantor_phone?: string;
  guarantor_address?: string;
};

function parseEmployeeInput(formData: FormData): EmployeeInput {
  return {
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    address: String(formData.get("address") ?? "").trim() || undefined,
    hire_date: String(formData.get("hire_date") ?? "").trim(),
    status: String(formData.get("status") ?? "active") as EmployeeStatus,
    employee_type: String(
      formData.get("employee_type") ?? "administrative",
    ) as EmployeeType,
    department: String(
      formData.get("department") ?? "administration",
    ) as EmployeeDepartment,
    job_title: String(formData.get("job_title") ?? "").trim(),
    monthly_salary: String(formData.get("monthly_salary") ?? "0").trim(),
    guarantor_name: String(formData.get("guarantor_name") ?? "").trim() || undefined,
    guarantor_phone:
      String(formData.get("guarantor_phone") ?? "").trim() || undefined,
    guarantor_address:
      String(formData.get("guarantor_address") ?? "").trim() || undefined,
  };
}

function validateEmployeeInput(input: EmployeeInput): string | null {
  if (!input.first_name || !input.last_name) {
    return "First name and last name are required.";
  }
  if (!input.job_title) {
    return "Job title is required.";
  }
  if (!input.hire_date) {
    return "Hire date is required.";
  }
  if (Number.isNaN(Number(input.monthly_salary))) {
    return "Monthly salary must be a valid number.";
  }
  return null;
}

function toEmployeeRow(input: EmployeeInput) {
  return {
    first_name: input.first_name,
    last_name: input.last_name,
    phone: input.phone ?? null,
    email: input.email ?? null,
    address: input.address ?? null,
    hire_date: input.hire_date,
    status: input.status,
    employee_type: input.employee_type,
    department: input.department,
    job_title: input.job_title,
    monthly_salary: Number(input.monthly_salary),
    guarantor_name: input.guarantor_name ?? null,
    guarantor_phone: input.guarantor_phone ?? null,
    guarantor_address: input.guarantor_address ?? null,
  };
}

export async function createEmployee(
  _prev: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  await requireHrAdmin();

  const input = parseEmployeeInput(formData);
  const validationError = validateEmployeeInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("employees").insert(toEmployeeRow(input));

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/hr/employees");
  return { success: true };
}

export async function updateEmployee(
  employeeId: string,
  _prev: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  await requireHrAdmin();

  const input = parseEmployeeInput(formData);
  const validationError = validateEmployeeInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update(toEmployeeRow(input))
    .eq("id", employeeId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/hr/employees");
  revalidatePath(`/hr/employees/${employeeId}/edit`);
  return { success: true };
}

export async function getEmployeesList(page: number, query: string) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("employees")
    .select(
      "id, employee_code, first_name, last_name, department, job_title, status, hire_date, phone",
      { count: "exact" },
    )
    .order("hire_date", { ascending: false })
    .range(from, to);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `employee_code.ilike.${term},first_name.ilike.${term},last_name.ilike.${term},phone.ilike.${term},job_title.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  return { rows: data ?? [], total: count ?? 0 };
}

export async function getEmployeeById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
