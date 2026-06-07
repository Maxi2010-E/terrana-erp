import { redirect } from "next/navigation";

import { buildLogisticsHubRedirect } from "@/lib/logistics/redirect";

type ShipmentsRedirectProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function ShipmentsPage({
  searchParams,
}: ShipmentsRedirectProps) {
  const params = await searchParams;
  redirect(
    buildLogisticsHubRedirect("shipments", {
      page: params.page,
      q: params.q,
      status: params.status,
      message: params.message,
    }),
  );
}
