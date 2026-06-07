import { cache } from "react";

import { getSessionUser } from "@/lib/auth/get-session";
import type { AppRole } from "@/lib/roles";

export type NotificationActor = {
  userId: string;
  role: AppRole;
};

/** Reuses cached session — avoids duplicate auth + profile queries in sidebar badges. */
export const getNotificationActor = cache(
  async (): Promise<NotificationActor | null> => {
    const { authUser, appUser } = await getSessionUser();
    if (!authUser || !appUser) {
      return null;
    }

    return { userId: authUser.id, role: appUser.role };
  },
);
