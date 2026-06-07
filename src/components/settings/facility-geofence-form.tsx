"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateFacilityGeofenceSettings } from "@/lib/actions/office";
import type { FacilityGeofenceSettings } from "@/lib/office/types";

type FacilityGeofenceFormProps = {
  settings: FacilityGeofenceSettings;
};

export function FacilityGeofenceForm({ settings }: FacilityGeofenceFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Facility geofence (attendance)</CardTitle>
        <CardDescription>
          When enabled, users must sign in within the radius of your facility for
          attendance to count as Present. Set coordinates from Google Maps (right-click
          → copy latitude/longitude).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          action={(formData) => {
            setError(null);
            setSaved(false);
            startTransition(async () => {
              try {
                await updateFacilityGeofenceSettings(formData);
                setSaved(true);
              } catch (saveError) {
                setError(
                  saveError instanceof Error
                    ? saveError.message
                    : "Could not save settings.",
                );
              }
            });
          }}
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="geofence_enabled"
              defaultChecked={settings.geofenceEnabled}
              disabled={isPending}
            />
            Require on-site location for valid attendance
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-muted-foreground">Facility name</span>
              <input
                name="facility_name"
                defaultValue={settings.facilityName}
                className="h-10 w-full rounded-xl border border-input bg-background px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Latitude</span>
              <input
                name="facility_latitude"
                type="number"
                step="any"
                defaultValue={settings.facilityLatitude ?? ""}
                placeholder="e.g. 6.5244"
                className="h-10 w-full rounded-xl border border-input bg-background px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Longitude</span>
              <input
                name="facility_longitude"
                type="number"
                step="any"
                defaultValue={settings.facilityLongitude ?? ""}
                placeholder="e.g. 3.3792"
                className="h-10 w-full rounded-xl border border-input bg-background px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Radius (metres)</span>
              <input
                name="facility_radius_meters"
                type="number"
                min={50}
                max={5000}
                defaultValue={settings.facilityRadiusMeters}
                className="h-10 w-full rounded-xl border border-input bg-background px-3"
              />
            </label>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">
              Facility geofence saved.
            </p>
          ) : null}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save geofence"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
