import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getSessionUser } from "@/lib/auth/get-session";
import type { AppRole } from "@/lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser, appUser } = await getSessionUser();

  if (!authUser) {
    redirect("/login");
  }

  const role: AppRole = appUser?.role ?? "super_admin";

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <AppSidebar role={role} />
      <div className="flex min-h-full flex-1 flex-col">
        <AppHeader email={authUser.email} role={role} />
        <main className="flex-1 overflow-auto bg-background p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
