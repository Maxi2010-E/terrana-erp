import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/account/change-password-form";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/require-role";

export default async function SettingsPasswordPage() {
  const { authUser, role } = await requireAuth();

  if (role === "super_admin") {
    redirect("/settings");
  }

  if (!authUser?.email) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change password"
        description="Update your login password."
        actions={
          <LinkButton variant="outline" href="/settings">
            Back to settings
          </LinkButton>
        }
      />

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Your password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm email={authUser.email} />
        </CardContent>
      </Card>
    </div>
  );
}
