"use server";

import { revalidatePath } from "next/cache";

import { requireHrAdmin } from "@/lib/auth/require-role";
import type {
  EmployeeDepartment,
  EmployeeStatus,
  EmployeeType,
} from "@/lib/employees/constants";
import { PAGE_SIZE } from "@/lib/employees/constants";
import {
  EMPLOYEE_DOCUMENT_BY_TYPE,
  EMPLOYEE_DOCUMENTS_BUCKET,
  type EmployeeDocumentType,
  documentExtensionFromMime,
  employeeDocumentStoragePath,
  validateEmployeeDocumentFile,
} from "@/lib/employees/documents";
import {
  EMPLOYEE_PHOTOS_BUCKET,
  employeePhotoStoragePath,
  validateEmployeePhotoFile,
} from "@/lib/employees/photo";
import { EMPLOYEE_PHOTO_OUTPUT_TYPE } from "@/lib/employees/process-photo";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EmployeeFormState = {
  error?: string;
  success?: boolean;
};

export type EmployeePhotoFormState = {
  error?: string;
  success?: boolean;
};

export type EmployeeDocumentFormState = {
  error?: string;
  success?: boolean;
};

const EMPLOYEE_PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 60;
const EMPLOYEE_DOCUMENT_SIGNED_URL_TTL_SECONDS = 60 * 60;

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

  const { data: employeeCode, error: codeError } = await supabase.rpc(
    "generate_employee_code",
  );

  if (codeError || !employeeCode) {
    return {
      error:
        codeError?.message ??
        "Could not generate employee ID. Run migration 00002 in Supabase.",
    };
  }

  const { error } = await supabase.from("employees").insert({
    ...toEmployeeRow(input),
    employee_code: employeeCode,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/hr");
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

  revalidatePath("/hr");
  revalidatePath("/hr/employees");
  revalidatePath(`/hr/employees/${employeeId}`);
  revalidatePath(`/hr/employees/${employeeId}/edit`);
  return { success: true };
}

export async function getEmployeesList(page: number, query: string) {
  await requireHrAdmin();

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
  await requireHrAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, employee_code, first_name, last_name, phone, email, address, hire_date, status, employee_type, department, job_title, monthly_salary, guarantor_name, guarantor_phone, guarantor_address, photo_url, cv_url, employment_letter_url, id_document_url, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEmployeePhotoSignedUrl(
  photoPath: string | null | undefined,
): Promise<string | null> {
  if (!photoPath) {
    return null;
  }

  await requireHrAdmin();

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(EMPLOYEE_PHOTOS_BUCKET)
    .createSignedUrl(photoPath, EMPLOYEE_PHOTO_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function uploadEmployeePhoto(
  employeeId: string,
  _prev: EmployeePhotoFormState,
  formData: FormData,
): Promise<EmployeePhotoFormState> {
  await requireHrAdmin();

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }

  const validationError = validateEmployeePhotoFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const storagePath = employeePhotoStoragePath(employeeId, "jpg");
  const admin = createAdminClient();
  const supabase = await createClient();

  const { error: uploadError } = await admin.storage
    .from(EMPLOYEE_PHOTOS_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type || EMPLOYEE_PHOTO_OUTPUT_TYPE,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: updateError } = await supabase
    .from("employees")
    .update({ photo_url: storagePath })
    .eq("id", employeeId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/hr");
  revalidatePath("/hr/employees");
  revalidatePath(`/hr/employees/${employeeId}`);
  revalidatePath(`/hr/employees/${employeeId}/edit`);
  return { success: true };
}

export async function removeEmployeePhoto(
  employeeId: string,
  _prev: EmployeePhotoFormState = {},
  _formData?: FormData,
): Promise<EmployeePhotoFormState> {
  await requireHrAdmin();

  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: employee, error: fetchError } = await supabase
    .from("employees")
    .select("photo_url")
    .eq("id", employeeId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (employee?.photo_url) {
    const { error: removeError } = await admin.storage
      .from(EMPLOYEE_PHOTOS_BUCKET)
      .remove([employee.photo_url]);

    if (removeError) {
      return { error: removeError.message };
    }
  }

  const { error: updateError } = await supabase
    .from("employees")
    .update({ photo_url: null })
    .eq("id", employeeId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/hr");
  revalidatePath("/hr/employees");
  revalidatePath(`/hr/employees/${employeeId}`);
  revalidatePath(`/hr/employees/${employeeId}/edit`);
  return { success: true };
}

export async function getEmployeeDocumentSignedUrl(
  storagePath: string | null | undefined,
): Promise<string | null> {
  if (!storagePath) {
    return null;
  }

  await requireHrAdmin();

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(EMPLOYEE_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, EMPLOYEE_DOCUMENT_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function getEmployeeDocumentSignedUrls(employee: {
  cv_url: string | null;
  employment_letter_url: string | null;
  id_document_url: string | null;
}) {
  const [cvUrl, employmentLetterUrl, idCardUrl] = await Promise.all([
    getEmployeeDocumentSignedUrl(employee.cv_url),
    getEmployeeDocumentSignedUrl(employee.employment_letter_url),
    getEmployeeDocumentSignedUrl(employee.id_document_url),
  ]);

  return {
    cv: cvUrl,
    employment_letter: employmentLetterUrl,
    id_card: idCardUrl,
  };
}

export async function uploadEmployeeDocument(
  employeeId: string,
  documentType: EmployeeDocumentType,
  _prev: EmployeeDocumentFormState,
  formData: FormData,
): Promise<EmployeeDocumentFormState> {
  await requireHrAdmin();

  const config = EMPLOYEE_DOCUMENT_BY_TYPE[documentType];
  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0) {
    return { error: `Choose a file to upload for ${config.label}.` };
  }

  const validationError = validateEmployeeDocumentFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const extension = documentExtensionFromMime(file.type);
  if (!extension) {
    return { error: "Unsupported document type." };
  }

  const storagePath = employeeDocumentStoragePath(
    employeeId,
    config.storageName,
    extension,
  );
  const admin = createAdminClient();
  const supabase = await createClient();

  const { error: uploadError } = await admin.storage
    .from(EMPLOYEE_DOCUMENTS_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: updateError } = await supabase
    .from("employees")
    .update({ [config.column]: storagePath })
    .eq("id", employeeId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/hr");
  revalidatePath("/hr/employees");
  revalidatePath(`/hr/employees/${employeeId}`);
  revalidatePath(`/hr/employees/${employeeId}/edit`);
  return { success: true };
}

export async function removeEmployeeDocument(
  employeeId: string,
  documentType: EmployeeDocumentType,
  _prev: EmployeeDocumentFormState = {},
  _formData?: FormData,
): Promise<EmployeeDocumentFormState> {
  await requireHrAdmin();

  const config = EMPLOYEE_DOCUMENT_BY_TYPE[documentType];
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: employee, error: fetchError } = await supabase
    .from("employees")
    .select("cv_url, employment_letter_url, id_document_url")
    .eq("id", employeeId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  const storagePath = employee?.[config.column];
  if (storagePath) {
    const { error: removeError } = await admin.storage
      .from(EMPLOYEE_DOCUMENTS_BUCKET)
      .remove([storagePath]);

    if (removeError) {
      return { error: removeError.message };
    }
  }

  const { error: updateError } = await supabase
    .from("employees")
    .update({ [config.column]: null })
    .eq("id", employeeId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/hr");
  revalidatePath("/hr/employees");
  revalidatePath(`/hr/employees/${employeeId}`);
  revalidatePath(`/hr/employees/${employeeId}/edit`);
  return { success: true };
}
