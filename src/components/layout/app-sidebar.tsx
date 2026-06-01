"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_ITEMS, filterNavByRole, type NavItem } from "@/lib/navigation";
import type { AppRole } from "@/lib/roles";
import { terranaColors } from "@/lib/theme";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  role: AppRole;
};

const sidebarStyle = {
  backgroundColor: terranaColors.sidebar,
  color: terranaColors.sidebarForeground,
  borderColor: terranaColors.sidebarBorder,
} as const;

function NavLinks({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        if (item.children?.length) {
          return (
            <div key={item.title} className="space-y-1">
              <p
                className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: terranaColors.sidebarMuted }}
              >
                {item.title}
              </p>
              <NavLinks items={item.children} pathname={pathname} />
            </div>
          );
        }

        if (!item.href) {
          return null;
        }

        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
              !isActive && "hover:bg-[#3a3d44]",
            )}
            style={
              isActive
                ? {
                    backgroundColor: terranaColors.brand,
                    color: terranaColors.brandForeground,
                  }
                : undefined
            }
          >
            <span className="flex items-center gap-2">
              <item.icon className="size-4 shrink-0" />
              {item.title}
            </span>
            {item.phase ? (
              <Badge
                variant="outline"
                className="border-current/20 bg-black/10 text-[10px]"
              >
                P{item.phase}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({
  role,
  pathname,
}: {
  role: AppRole;
  pathname: string;
}) {
  const navItems = filterNavByRole(NAV_ITEMS, role);

  return (
    <div className="flex h-full flex-col">
      <div
        className="border-b px-4 py-5"
        style={{ borderColor: terranaColors.sidebarBorder }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
            style={{
              backgroundColor: terranaColors.brand,
              color: terranaColors.brandForeground,
            }}
          >
            T
          </div>
          <div>
            <p className="text-base font-semibold">Terrana ERP</p>
            <p style={{ color: terranaColors.sidebarMuted }} className="text-xs">
              Operations platform
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <NavLinks items={navItems} pathname={pathname} />
      </div>
    </div>
  );
}

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside
        className="hidden w-64 shrink-0 border-r md:block"
        style={sidebarStyle}
      >
        <SidebarInner role={role} pathname={pathname} />
      </aside>

      <div className="border-b p-3 md:hidden" style={sidebarStyle}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="border-white/20 bg-white/10 text-inherit hover:bg-white/15"
              />
            }
          >
            <Menu className="size-4" />
            Menu
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 border-r p-0"
            style={sidebarStyle}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div onClick={() => setOpen(false)}>
              <SidebarInner role={role} pathname={pathname} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
