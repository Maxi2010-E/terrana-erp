import { redirect } from "next/navigation";

import { buildHrHubRedirect } from "@/lib/hr/redirect";

type AdvancesRedirectProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdvancesPage({ searchParams }: AdvancesRedirectProps) {
  const params = await searchParams;
  redirect(buildHrHubRedirect("advances", { q: params.q }));
}
