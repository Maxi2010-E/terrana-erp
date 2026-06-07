import { redirect } from "next/navigation";

import { buildInventoryHubRedirect } from "@/lib/inventory/redirect";

type ExportInventoryRedirectProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    message?: string;
    mix?: string;
    graded_from?: string;
    graded_to?: string;
  }>;
};

export default async function ExportInventoryPage({
  searchParams,
}: ExportInventoryRedirectProps) {
  const params = await searchParams;
  const message =
    params.message === "created" ? "created" : params.message;
  redirect(
    buildInventoryHubRedirect("export", {
      page: params.page,
      q: params.q,
      message,
      mix: params.mix,
      graded_from: params.graded_from,
      graded_to: params.graded_to,
    }),
  );
}
