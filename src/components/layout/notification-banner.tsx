import {
  notificationBannerClassName,
  type NotificationUrgency,
} from "@/lib/notifications/urgency";
import { cn } from "@/lib/utils";

export function NotificationBanner({
  urgency,
  children,
  className,
}: {
  urgency: NotificationUrgency;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(notificationBannerClassName(urgency), className)}
      role="status"
    >
      {children}
    </p>
  );
}
