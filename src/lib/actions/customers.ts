"use server";

import { revalidatePath } from "next/cache";

import {
  requireLogisticsRead,
  requireLogisticsWrite,
} from "@/lib/auth/require-role";
import { PAGE_SIZE } from "@/lib/employees/constants";
import {
  CUSTOMER_STATUSES,
  FUMIGATION_REQUIREMENTS,
  type CustomerStatus,
  type FumigationRequirement,
} from "@/lib/logistics/constants";
import type {
  Customer,
  CustomerListRow,
  CustomerShipmentRow,
} from "@/lib/logistics/types";
import { createClient } from "@/lib/supabase/server";

export type CustomerFormState = {
  error?: string;
  success?: boolean;
  customerId?: string;
};

type CustomerInput = {
  customer_name: string;
  country: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  fumigation_requirement: FumigationRequirement;
  notes?: string;
};

function parseCustomerInput(formData: FormData): CustomerInput {
  const requirement = String(
    formData.get("fumigation_requirement") ?? "",
  ).trim();

  return {
    customer_name: String(formData.get("customer_name") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim(),
    contact_person:
      String(formData.get("contact_person") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    fumigation_requirement: FUMIGATION_REQUIREMENTS.includes(
      requirement as FumigationRequirement,
    )
      ? (requirement as FumigationRequirement)
      : "requires_fumigation",
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  };
}

function validateCustomerInput(input: CustomerInput): string | null {
  if (!input.customer_name) {
    return "Customer name is required.";
  }
  if (!input.country) {
    return "Country is required.";
  }
  return null;
}

function toCustomerRow(input: CustomerInput) {
  return {
    customer_name: input.customer_name,
    country: input.country,
    contact_person: input.contact_person ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    fumigation_requirement: input.fumigation_requirement,
    notes: input.notes ?? null,
  };
}

export async function getCustomersList(page: number, query: string) {
  await requireLogisticsRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("customers")
    .select(
      "id, customer_code, customer_name, country, fumigation_requirement, status, phone",
      { count: "exact" },
    )
    .order("customer_name", { ascending: true })
    .range(from, to);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `customer_code.ilike.${term},customer_name.ilike.${term},country.ilike.${term},phone.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  return { rows: (data ?? []) as CustomerListRow[], total: count ?? 0 };
}

export async function getCustomerById(id: string) {
  await requireLogisticsRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, customer_code, customer_name, country, contact_person, phone, email, fumigation_requirement, status, notes, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Customer | null;
}

export async function getActiveCustomersForSelect() {
  await requireLogisticsRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, customer_code, customer_name, country")
    .eq("status", "active")
    .order("customer_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getShipmentsByCustomerId(
  customerId: string,
): Promise<CustomerShipmentRow[]> {
  await requireLogisticsRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("id, shipment_number, container_number, loading_date, status, total_kg")
    .eq("customer_id", customerId)
    .order("loading_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    shipment_number: row.shipment_number,
    container_number: row.container_number,
    loading_date: row.loading_date,
    status: row.status,
    total_kg: Number(row.total_kg),
  }));
}

export async function createCustomer(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  await requireLogisticsWrite();

  const input = parseCustomerInput(formData);
  const validationError = validateCustomerInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data: customerCode, error: codeError } = await supabase.rpc(
    "generate_customer_code",
  );

  if (codeError || !customerCode) {
    return {
      error:
        codeError?.message ??
        "Could not generate customer ID. Run migration 00034 in Supabase.",
    };
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      ...toCustomerRow(input),
      customer_code: customerCode,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create customer." };
  }

  revalidatePath("/logistics");
  revalidatePath("/logistics/customers");
  return { success: true, customerId: data.id };
}

export async function updateCustomer(
  customerId: string,
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  await requireLogisticsWrite();

  const input = parseCustomerInput(formData);
  const validationError = validateCustomerInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update(toCustomerRow(input))
    .eq("id", customerId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/logistics");
  revalidatePath("/logistics/customers");
  revalidatePath(`/logistics/customers/${customerId}`);
  return { success: true, customerId };
}

export async function toggleCustomerStatusForm(formData: FormData) {
  const customerId = String(formData.get("customer_id") ?? "").trim();
  const nextStatus = String(formData.get("next_status") ?? "").trim();
  await updateCustomerStatus(customerId, nextStatus);
}

export async function updateCustomerStatus(customerId: string, status: string) {
  await requireLogisticsWrite();

  if (!CUSTOMER_STATUSES.includes(status as CustomerStatus)) {
    throw new Error("Invalid status.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ status: status as CustomerStatus })
    .eq("id", customerId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/logistics");
  revalidatePath("/logistics/customers");
  revalidatePath(`/logistics/customers/${customerId}`);
}
