import { SettingsOptionLink } from "@/components/settings/settings-option-link";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/require-role";
import { settingsOptionsForRole } from "@/lib/settings/options";

export default async function SettingsPage() {
  const { role } = await requireAuth();
  const options = settingsOptionsForRole(role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Account and company configuration — options depend on your role."
      />

      <ul className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <li key={option.href}>
            <SettingsOptionLink {...option} />
          </li>
        ))}
      </ul>
    </div>
  );
}
