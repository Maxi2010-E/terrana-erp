import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";

export default async function SettingsCompanyPage() {
  await requireRole(["super_admin"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company"
        description="Default company values used across Terrana ERP."
        actions={
          <LinkButton variant="outline" href="/settings">
            Back to settings
          </LinkButton>
        }
      />

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Company profile</CardTitle>
          <CardDescription>Default values from Phase 0 migration</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Terrana Africa Limited</p>
          <p>Currency: NGN</p>
        </CardContent>
      </Card>
    </div>
  );
}
