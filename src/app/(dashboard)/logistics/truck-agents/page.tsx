import { redirect } from "next/navigation";

import { buildLogisticsHubRedirect } from "@/lib/logistics/redirect";

type TruckAgentsRedirectProps = {
  searchParams: Promise<{ page?: string; q?: string; message?: string }>;
};

export default async function TruckAgentsPage({
  searchParams,
}: TruckAgentsRedirectProps) {
  const params = await searchParams;
  redirect(
    buildLogisticsHubRedirect("truck-agents", {
      page: params.page,
      q: params.q,
      message: params.message,
    }),
  );
}
