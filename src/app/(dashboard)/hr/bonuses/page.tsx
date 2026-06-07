import { redirect } from "next/navigation";

import { buildHrHubRedirect } from "@/lib/hr/redirect";

type BonusesRedirectProps = {
  searchParams: Promise<{ month?: string; q?: string }>;
};

export default async function BonusesPage({ searchParams }: BonusesRedirectProps) {
  const params = await searchParams;
  redirect(
    buildHrHubRedirect("bonuses", {
      month: params.month,
      q: params.q,
    }),
  );
}
