"use server";

import { revalidatePath } from "next/cache";

import {
  requireLogisticsRead,
  requireLogisticsWrite,
} from "@/lib/auth/require-role";
import { PAGE_SIZE } from "@/lib/employees/constants";
import type {
  FumigationChamber,
  FumigationChamberListRow,
} from "@/lib/logistics/types";
import { createClient } from "@/lib/supabase/server";

export type FumigationChamberFormState = {
  error?: string;
  success?: boolean;
  chamberId?: string;
};

type ChamberInput = {
  facility_name: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  registration_number?: string;
  notes?: string;
};

function parseChamberInput(formData: FormData): ChamberInput {
  return {
    facility_name: String(formData.get("facility_name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim() || undefined,
    contact_person:
      String(formData.get("contact_person") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    registration_number:
      String(formData.get("registration_number") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  };
}

function validateChamberInput(input: ChamberInput): string | null {
  if (!input.facility_name) {
    return "Facility name is required.";
  }
  return null;
}

function toChamberRow(input: ChamberInput) {
  return {
    facility_name: input.facility_name,
    address: input.address ?? null,
    contact_person: input.contact_person ?? null,
    phone: input.phone ?? null,
    registration_number: input.registration_number ?? null,
    notes: input.notes ?? null,
  };
}

export async function getFumigationChambersList(page: number, query: string) {
  await requireLogisticsRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("fumigation_chambers")
    .select(
      "id, facility_name, contact_person, phone, registration_number",
      { count: "exact" },
    )
    .order("facility_name", { ascending: true })
    .range(from, to);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `facility_name.ilike.${term},registration_number.ilike.${term},phone.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  return { rows: (data ?? []) as FumigationChamberListRow[], total: count ?? 0 };
}

export async function getFumigationChamberById(id: string) {
  await requireLogisticsRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fumigation_chambers")
    .select(
      "id, facility_name, address, contact_person, phone, registration_number, notes, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as FumigationChamber | null;
}

export async function createFumigationChamber(
  _prev: FumigationChamberFormState,
  formData: FormData,
): Promise<FumigationChamberFormState> {
  await requireLogisticsWrite();

  const input = parseChamberInput(formData);
  const validationError = validateChamberInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fumigation_chambers")
    .insert(toChamberRow(input))
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create fumigation chamber." };
  }

  revalidatePath("/logistics");
  revalidatePath("/logistics/fumigation");
  return { success: true, chamberId: data.id };
}

export async function updateFumigationChamber(
  chamberId: string,
  _prev: FumigationChamberFormState,
  formData: FormData,
): Promise<FumigationChamberFormState> {
  await requireLogisticsWrite();

  const input = parseChamberInput(formData);
  const validationError = validateChamberInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("fumigation_chambers")
    .update(toChamberRow(input))
    .eq("id", chamberId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/logistics");
  revalidatePath("/logistics/fumigation");
  revalidatePath(`/logistics/fumigation/${chamberId}`);
  return { success: true, chamberId };
}
