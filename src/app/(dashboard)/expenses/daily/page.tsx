import { redirect } from "next/navigation";

import { buildExpensesHubRedirect } from "@/lib/expenses/redirect";

type DailyExpensesRedirectProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    message?: string;
    create?: string;
  }>;
};

export default async function DailyExpensesPage({
  searchParams,
}: DailyExpensesRedirectProps) {
  const params = await searchParams;
  redirect(
    buildExpensesHubRedirect("daily", {
      page: params.page,
      q: params.q,
      message: params.message,
      create: params.create,
    }),
  );
}
