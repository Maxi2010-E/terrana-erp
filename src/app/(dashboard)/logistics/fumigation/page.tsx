import { redirect } from "next/navigation";

import { buildLogisticsHubRedirect } from "@/lib/logistics/redirect";

type FumigationRedirectProps = {
  searchParams: Promise<{ page?: string; q?: string; message?: string }>;
};

export default async function FumigationPage({
  searchParams,
}: FumigationRedirectProps) {
  const params = await searchParams;
  redirect(
    buildLogisticsHubRedirect("fumigation", {
      page: params.page,
      q: params.q,
      message: params.message,
    }),
  );
}
