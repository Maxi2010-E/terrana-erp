import { redirect } from "next/navigation";

import { buildHrHubRedirect } from "@/lib/hr/redirect";

type EmployeesRedirectProps = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function EmployeesPage({
  searchParams,
}: EmployeesRedirectProps) {
  const params = await searchParams;
  redirect(
    buildHrHubRedirect("employees", {
      page: params.page,
      q: params.q,
    }),
  );
}
