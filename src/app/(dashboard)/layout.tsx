import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getProcessingQueueNotifications } from "@/lib/actions/processing";
import { getProcurementNotifications } from "@/lib/actions/procurement";
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

  if (!appUser) {
    redirect("/login?error=profile_missing");
  }

  const role: AppRole = appUser.role;
  const procurementNotifications = await getProcurementNotifications();
  const processingNotifications = await getProcessingQueueNotifications();

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <AppSidebar
        role={role}
        email={authUser.email}
        procurementNotifications={procurementNotifications}
        processingNotifications={processingNotifications}
      />
      <div className="flex min-h-full flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-auto bg-background p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
