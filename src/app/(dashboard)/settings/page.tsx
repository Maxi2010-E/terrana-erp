import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { requireRole } from "@/lib/auth/require-role";

export default async function SettingsPage() {
  await requireRole(["super_admin", "admin"]);

  return (
    <div className="space-y-6">
      <ModulePlaceholder
        title="Settings"
        description="Company settings and system configuration. Full settings UI expands in later phases."
      />
      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
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
