import type { getSessionUser } from "@/lib/auth/get-session";

type SessionWithUser = Awaited<ReturnType<typeof getSessionUser>>;

export function requireActorUserId(session: SessionWithUser): string {
  const userId = session.appUser?.id ?? session.authUser?.id;

  if (!userId) {
    throw new Error("Could not determine current user.");
  }

  return userId;
}
