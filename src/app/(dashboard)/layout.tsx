import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  DashboardMobileNavLoader,
  DashboardSidebarLoader,
} from "@/components/layout/dashboard-sidebar-loader";
import { PayrollDueBannerSlot } from "@/components/layout/payroll-due-banner-slot";
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
  const loaderProps = {
    userId: appUser.id,
    role,
    email: authUser.email,
  };

  const [sidebar, mobileNav, payrollBanner] = await Promise.all([
    DashboardSidebarLoader(loaderProps),
    DashboardMobileNavLoader(loaderProps),
    PayrollDueBannerSlot({ role }),
  ]);

  return (
    <DashboardShell sidebar={sidebar} mobileNav={mobileNav}>
      <AppHeader />
      {payrollBanner}
      <main
        data-layout="dashboard-page-scroll"
        className="p-4 lg:p-8"
      >
        {children}
      </main>
    </DashboardShell>
  );
}
