import { redirect } from "next/navigation";

import { buildHrHubRedirect } from "@/lib/hr/redirect";

type PayrollRedirectProps = {
  searchParams: Promise<{ month?: string; q?: string }>;
};

export default async function PayrollPage({ searchParams }: PayrollRedirectProps) {
  const params = await searchParams;
  redirect(
    buildHrHubRedirect("payroll", {
      month: params.month,
      q: params.q,
    }),
  );
}
