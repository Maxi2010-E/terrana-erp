import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string; redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  const initialError =
    params.error === "account_disabled"
      ? "Your account has been disabled. Contact an administrator."
      : params.error === "auth_callback_failed"
        ? "Authentication failed. Please try again."
        : null;

  const initialMessage =
    params.message === "password_updated"
      ? "Password updated. Sign in with your new password."
      : null;

  return (
    <LoginForm
      initialError={initialError}
      initialMessage={initialMessage}
      redirectTo={params.redirect ?? "/dashboard"}
    />
  );
}
