import type { AppRole } from "@/lib/roles";

export type SettingsOption = {
  href: string;
  title: string;
  description: string;
};

export function settingsOptionsForRole(role: AppRole): SettingsOption[] {
  if (role === "super_admin") {
    return [
      {
        href: "/settings/geofence",
        title: "Attendance geofence",
        description: "Set the facility radius used for attendance clock-in.",
      },
    ];
  }

  return [
    {
      href: "/settings/password",
      title: "Change password",
      description: "Set your own login password — no email link required.",
    },
  ];
}
