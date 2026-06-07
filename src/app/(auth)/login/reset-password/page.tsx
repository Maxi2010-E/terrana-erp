import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getSessionUser } from "@/lib/auth/get-session";

export default async function ResetPasswordPage() {
  const { authUser } = await getSessionUser();

  if (!authUser) {
    redirect("/login/forgot-password?error=link_expired");
  }

  return <ResetPasswordForm />;
}
