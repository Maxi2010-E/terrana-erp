"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateUserRole } from "@/lib/actions/users";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/roles";

const selectClassName =
  "h-8 min-w-[10rem] rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

type UserRoleSelectProps = {
  userId: string;
  currentRole: AppRole;
};

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextRole = event.target.value as AppRole;
    const previousRole = role;

    setRole(nextRole);
    setError(null);

    startTransition(async () => {
      try {
        await updateUserRole(userId, nextRole);
        router.refresh();
      } catch (err) {
        setRole(previousRole);
        setError(err instanceof Error ? err.message : "Could not update role.");
      }
    });
  }

  return (
    <div className="space-y-1">
      <select
        value={role}
        onChange={handleChange}
        disabled={pending}
        className={selectClassName}
        aria-label="User role"
      >
        {APP_ROLES.map((option) => (
          <option key={option} value={option}>
            {ROLE_LABELS[option]}
          </option>
        ))}
      </select>
      {pending ? (
        <p className="text-xs text-muted-foreground">Saving…</p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
