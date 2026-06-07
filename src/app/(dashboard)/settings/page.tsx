import { PageHeader } from "@/components/layout/page-header";
import { FacilityGeofenceForm } from "@/components/settings/facility-geofence-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFacilityGeofenceSettings } from "@/lib/actions/office";
import { requireRole } from "@/lib/auth/require-role";

export default async function SettingsPage() {
  await requireRole(["super_admin", "admin"]);
  const geofence = await getFacilityGeofenceSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Company configuration and attendance geofence."
      />

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Company</CardTitle>
          <CardDescription>Default values from Phase 0 migration</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Terrana Africa Limited</p>
          <p>Currency: NGN</p>
        </CardContent>
      </Card>

      <FacilityGeofenceForm settings={geofence} />
    </div>
  );
}
