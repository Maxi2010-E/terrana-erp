"use server";

import { revalidatePath } from "next/cache";

import {
  requireSupplierAdmin,
  requireSupplierRead,
} from "@/lib/auth/require-role";
import { PAGE_SIZE } from "@/lib/employees/constants";
import type { SupplierStatus } from "@/lib/suppliers/constants";
import { SUPPLIER_STATUSES } from "@/lib/suppliers/constants";
import { createClient } from "@/lib/supabase/server";

export type SupplierFormState = {
  error?: string;
  success?: boolean;
  supplierId?: string;
};

export type BankAccountFormState = {
  error?: string;
  success?: boolean;
};

type SupplierInput = {
  supplier_name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
};

function parseSupplierInput(formData: FormData): SupplierInput {
  return {
    supplier_name: String(formData.get("supplier_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    address: String(formData.get("address") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  };
}

function validateSupplierInput(input: SupplierInput): string | null {
  if (!input.supplier_name) {
    return "Supplier name is required.";
  }
  return null;
}

function toSupplierRow(input: SupplierInput) {
  return {
    supplier_name: input.supplier_name,
    phone: input.phone ?? null,
    email: input.email ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null,
  };
}

export async function getSuppliersList(page: number, query: string) {
  await requireSupplierRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("suppliers")
    .select(
      "id, supplier_code, supplier_name, phone, status",
      { count: "exact" },
    )
    .order("supplier_name", { ascending: true })
    .range(from, to);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `supplier_code.ilike.${term},supplier_name.ilike.${term},phone.ilike.${term},email.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  return { rows: data ?? [], total: count ?? 0 };
}

export async function getSupplierById(id: string) {
  await requireSupplierRead();

  const supabase = await createClient();

  const [{ data: supplier, error: supplierError }, { data: bankAccounts, error: banksError }] =
    await Promise.all([
      supabase
        .from("suppliers")
        .select(
          "id, supplier_code, supplier_name, phone, email, address, status, notes, created_at, updated_at",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("supplier_bank_accounts")
        .select(
          "id, supplier_id, bank_name, account_number, account_name, is_primary, created_at, updated_at",
        )
        .eq("supplier_id", id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true }),
    ]);

  if (supplierError) {
    throw new Error(supplierError.message);
  }

  if (banksError) {
    throw new Error(banksError.message);
  }

  return { supplier, bankAccounts: bankAccounts ?? [] };
}

export async function createSupplier(
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  await requireSupplierAdmin();

  const input = parseSupplierInput(formData);
  const validationError = validateSupplierInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();

  const { data: supplierCode, error: codeError } = await supabase.rpc(
    "generate_supplier_code",
  );

  if (codeError || !supplierCode) {
    return {
      error:
        codeError?.message ??
        "Could not generate supplier ID. Run migration 00006 in Supabase.",
    };
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      ...toSupplierRow(input),
      supplier_code: supplierCode,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create supplier." };
  }

  revalidatePath("/suppliers");
  return { success: true, supplierId: data.id };
}

export async function updateSupplier(
  supplierId: string,
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  await requireSupplierAdmin();

  const input = parseSupplierInput(formData);
  const validationError = validateSupplierInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update(toSupplierRow(input))
    .eq("id", supplierId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${supplierId}`);
  return { success: true, supplierId };
}

export async function updateSupplierStatus(
  supplierId: string,
  status: string,
) {
  await requireSupplierAdmin();

  if (!SUPPLIER_STATUSES.includes(status as SupplierStatus)) {
    throw new Error("Invalid status.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update({ status: status as SupplierStatus })
    .eq("id", supplierId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${supplierId}`);
}

export async function addBankAccount(
  supplierId: string,
  _prev: BankAccountFormState,
  formData: FormData,
): Promise<BankAccountFormState> {
  await requireSupplierAdmin();

  const bankName = String(formData.get("bank_name") ?? "").trim();
  const accountNumber = String(formData.get("account_number") ?? "").trim();
  const accountName = String(formData.get("account_name") ?? "").trim();
  const isPrimary = formData.get("is_primary") === "on";

  if (!bankName || !accountNumber || !accountName) {
    return { error: "Bank name, account number, and account name are required." };
  }

  const supabase = await createClient();

  if (isPrimary) {
    await supabase
      .from("supplier_bank_accounts")
      .update({ is_primary: false })
      .eq("supplier_id", supplierId);
  }

  const { error } = await supabase.from("supplier_bank_accounts").insert({
    supplier_id: supplierId,
    bank_name: bankName,
    account_number: accountNumber,
    account_name: accountName,
    is_primary: isPrimary,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This account number is already used by another supplier." };
    }
    return { error: error.message };
  }

  revalidatePath(`/suppliers/${supplierId}`);
  return { success: true };
}

export async function deleteBankAccount(
  supplierId: string,
  bankAccountId: string,
) {
  await requireSupplierAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("supplier_bank_accounts")
    .delete()
    .eq("id", bankAccountId)
    .eq("supplier_id", supplierId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/suppliers/${supplierId}`);
}

export async function setPrimaryBankAccount(
  supplierId: string,
  bankAccountId: string,
) {
  await requireSupplierAdmin();

  const supabase = await createClient();

  const { error: clearError } = await supabase
    .from("supplier_bank_accounts")
    .update({ is_primary: false })
    .eq("supplier_id", supplierId);

  if (clearError) {
    throw new Error(clearError.message);
  }

  const { error } = await supabase
    .from("supplier_bank_accounts")
    .update({ is_primary: true })
    .eq("id", bankAccountId)
    .eq("supplier_id", supplierId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/suppliers/${supplierId}`);
}
