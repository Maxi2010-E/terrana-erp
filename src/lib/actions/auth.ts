"use server";

import { recordLoginAttendance } from "@/lib/actions/attendance";

/** Records attendance after a successful client sign-in. Must not redirect. */
export async function recordLoginSessionAction(): Promise<void> {
  await recordLoginAttendance();
}
