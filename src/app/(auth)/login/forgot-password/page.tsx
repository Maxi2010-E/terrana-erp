import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <ForgotPasswordForm
      key={params.error ?? "default"}
      initialError={
        params.error === "link_expired"
          ? "Your reset link has expired. Request a new one below."
          : null
      }
    />
  );
}
