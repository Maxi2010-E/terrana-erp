import { notFound } from "next/navigation";

import { ResetUserPasswordForm } from "@/components/users/reset-user-password-form";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getUserForPasswordReset,
  resetUserPassword,
} from "@/lib/actions/users";
import { requireHrAdmin } from "@/lib/auth/require-role";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";

type ResetUserPasswordPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResetUserPasswordPage({
  params,
}: ResetUserPasswordPageProps) {
  await requireHrAdmin();
  const { id } = await params;
  const user = await getUserForPasswordReset(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset password
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.username ?? user.email} ·{" "}
            {ROLE_LABELS[user.role as AppRole] ?? user.role}
          </p>
        </div>
        <LinkButton variant="outline" href="/users">
          Back to list
        </LinkButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New login password</CardTitle>
        </CardHeader>
        <CardContent>
          <ResetUserPasswordForm
            action={resetUserPassword}
            userId={user.id}
            email={user.email}
          />
        </CardContent>
      </Card>
    </div>
  );
}
