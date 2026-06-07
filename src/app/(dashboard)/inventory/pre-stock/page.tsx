import { redirect } from "next/navigation";

import { buildInventoryHubRedirect } from "@/lib/inventory/redirect";

type PreStockRedirectProps = {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
};

export default async function PreStockPage({ searchParams }: PreStockRedirectProps) {
  const params = await searchParams;
  redirect(
    buildInventoryHubRedirect("pre_stock", {
      page: params.page,
      q: params.q,
      status: params.status,
    }),
  );
}
