import { redirect } from "next/navigation";

import { buildInventoryHubRedirect } from "@/lib/inventory/redirect";

type WarehouseLotsRedirectProps = {
  searchParams: Promise<{ page?: string; q?: string; message?: string }>;
};

export default async function WarehouseLotsPage({
  searchParams,
}: WarehouseLotsRedirectProps) {
  const params = await searchParams;
  const message =
    params.message === "created"
      ? "lot_created"
      : params.message === "updated"
        ? "lot_updated"
        : params.message;
  redirect(
    buildInventoryHubRedirect("warehouse_lots", {
      page: params.page,
      q: params.q,
      message,
    }),
  );
}
