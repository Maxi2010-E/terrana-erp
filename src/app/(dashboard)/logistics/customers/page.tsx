import { redirect } from "next/navigation";

import { buildLogisticsHubRedirect } from "@/lib/logistics/redirect";

type CustomersRedirectProps = {
  searchParams: Promise<{ page?: string; q?: string; message?: string }>;
};

export default async function CustomersPage({
  searchParams,
}: CustomersRedirectProps) {
  const params = await searchParams;
  redirect(
    buildLogisticsHubRedirect("customers", {
      page: params.page,
      q: params.q,
      message: params.message,
    }),
  );
}
