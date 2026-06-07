import { FacilityGeofenceForm } from "@/components/settings/facility-geofence-form";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { getFacilityGeofenceSettings } from "@/lib/actions/office";
import { requireRole } from "@/lib/auth/require-role";

export default async function SettingsGeofencePage() {
  await requireRole(["super_admin"]);
  const geofence = await getFacilityGeofenceSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance geofence"
        description="Employees must be within this radius to clock in at the facility."
        actions={
          <LinkButton variant="outline" href="/settings">
            Back to settings
          </LinkButton>
        }
      />

      <FacilityGeofenceForm settings={geofence} />
    </div>
  );
}
