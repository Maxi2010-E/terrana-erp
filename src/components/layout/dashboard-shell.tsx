import type { ReactNode } from "react";

type DashboardShellProps = {
  sidebar: ReactNode;
  mobileNav: ReactNode;
  children: ReactNode;
};

/**
 * Dashboard chrome — structure + scroll in terrana-dashboard-shell.css ([data-layout]).
 * Keep Tailwind out of viewport/sidebar visibility to avoid cascade bugs.
 */
export function DashboardShell({
  sidebar,
  mobileNav,
  children,
}: DashboardShellProps) {
  return (
    <div data-layout="dashboard-shell">
      <aside aria-label="Main navigation" data-layout="dashboard-sidebar">
        {sidebar}
      </aside>

      <div data-layout="dashboard-main">
        <div data-layout="dashboard-mobile-nav">{mobileNav}</div>
        <div data-layout="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
