import { redirect } from "next/navigation";

import { buildExpensesHubRedirect } from "@/lib/expenses/redirect";

type OperationalExpensesRedirectProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    message?: string;
    create?: string;
    type?: string;
    status?: string;
  }>;
};

export default async function OperationalExpensesPage({
  searchParams,
}: OperationalExpensesRedirectProps) {
  const params = await searchParams;
  redirect(
    buildExpensesHubRedirect("operational", {
      page: params.page,
      q: params.q,
      message: params.message,
      create: params.create,
      type: params.type,
      status: params.status,
    }),
  );
}
