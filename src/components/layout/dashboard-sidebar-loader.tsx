import { cache } from "react";

import {
  AppSidebarDesktop,
  AppSidebarMobile,
  type AppSidebarProps,
} from "@/components/layout/app-sidebar";
import { getCachedSidebarNotificationBundle } from "@/lib/layout/cached-sidebar-notifications";
import type { AppRole } from "@/lib/roles";

type DashboardSidebarLoaderProps = {
  userId: string;
  role: AppRole;
  firstName: string;
  photoUrl: string | null;
  displayName: string;
};

const loadSidebarProps = cache(
  async ({
    userId,
    role,
    firstName,
    photoUrl,
    displayName,
  }: DashboardSidebarLoaderProps): Promise<AppSidebarProps> => {
    const {
      procurementNotifications,
      processingNotifications,
      paymentNotifications,
      dailyExpenseNotifications,
      operationalExpenseNotifications,
      payrollHrNotifications,
      preStockNotifications,
      exportLotAssignmentNotifications,
    } = await getCachedSidebarNotificationBundle(userId, role);

    return {
      role,
      firstName,
      photoUrl,
      displayName,
      procurementNotifications,
      processingNotifications,
      paymentNotifications,
      dailyExpenseNotifications,
      operationalExpenseNotifications,
      payrollHrNotifications,
      preStockNotifications,
      exportLotAssignmentNotifications,
    };
  },
);

export async function DashboardSidebarLoader(
  props: DashboardSidebarLoaderProps,
) {
  const sidebarProps = await loadSidebarProps(props);
  return <AppSidebarDesktop {...sidebarProps} />;
}

export async function DashboardMobileNavLoader(
  props: DashboardSidebarLoaderProps,
) {
  const sidebarProps = await loadSidebarProps(props);
  return <AppSidebarMobile {...sidebarProps} />;
}
