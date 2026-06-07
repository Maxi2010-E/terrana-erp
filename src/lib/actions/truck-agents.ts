"use server";

import { revalidatePath } from "next/cache";

import {
  requireLogisticsRead,
  requireLogisticsWrite,
} from "@/lib/auth/require-role";
import { PAGE_SIZE } from "@/lib/employees/constants";
import type { TruckAgent, TruckAgentListRow } from "@/lib/logistics/types";
import { createClient } from "@/lib/supabase/server";

export type TruckAgentFormState = {
  error?: string;
  success?: boolean;
  agentId?: string;
};

type AgentInput = {
  agent_name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
};

function parseAgentInput(formData: FormData): AgentInput {
  return {
    agent_name: String(formData.get("agent_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    address: String(formData.get("address") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  };
}

function validateAgentInput(input: AgentInput): string | null {
  if (!input.agent_name) {
    return "Agent name is required.";
  }
  return null;
}

function toAgentRow(input: AgentInput) {
  return {
    agent_name: input.agent_name,
    phone: input.phone ?? null,
    email: input.email ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null,
  };
}

export async function getTruckAgentsList(page: number, query: string) {
  await requireLogisticsRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("truck_agents")
    .select("id, agent_name, phone, email", { count: "exact" })
    .order("agent_name", { ascending: true })
    .range(from, to);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `agent_name.ilike.${term},phone.ilike.${term},email.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  return { rows: (data ?? []) as TruckAgentListRow[], total: count ?? 0 };
}

export async function getTruckAgentById(id: string) {
  await requireLogisticsRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("truck_agents")
    .select(
      "id, agent_name, phone, email, address, notes, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as TruckAgent | null;
}

export async function getTruckAgentsForSelect() {
  await requireLogisticsRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("truck_agents")
    .select("id, agent_name, phone")
    .order("agent_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createTruckAgent(
  _prev: TruckAgentFormState,
  formData: FormData,
): Promise<TruckAgentFormState> {
  await requireLogisticsWrite();

  const input = parseAgentInput(formData);
  const validationError = validateAgentInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("truck_agents")
    .insert(toAgentRow(input))
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create truck agent." };
  }

  revalidatePath("/logistics");
  return { success: true, agentId: data.id };
}

export async function updateTruckAgent(
  agentId: string,
  _prev: TruckAgentFormState,
  formData: FormData,
): Promise<TruckAgentFormState> {
  await requireLogisticsWrite();

  const input = parseAgentInput(formData);
  const validationError = validateAgentInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("truck_agents")
    .update(toAgentRow(input))
    .eq("id", agentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/logistics");
  revalidatePath(`/logistics/truck-agents/${agentId}`);
  return { success: true, agentId };
}
