import { redirect } from "next/navigation";

import { buildHrHubRedirect } from "@/lib/hr/redirect";

type LeaveRedirectProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function LeavePage({ searchParams }: LeaveRedirectProps) {
  const params = await searchParams;
  redirect(buildHrHubRedirect("leave", { q: params.q }));
}
