"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Users,
  Building2,
  Building,
  LogOut,
  Stethoscope,
  Settings,
  ClipboardList,
  Receipt,
  FileText,
  Wallet,
  HandCoins,
  CalendarDays,
  Clock,
  LayoutDashboard,
  CircleHelp,
  Landmark,
  PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const allNavItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
  },
  {
    href: "/dashboard/patients",
    label: "Patients",
    icon: Users,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
  },
  {
    href: "/dashboard/appointments",
    label: "Appointments",
    icon: CalendarDays,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
  },
  {
    href: "/dashboard/availability",
    label: "Availability",
    icon: Clock,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
  },
  {
    href: "/dashboard/treatments",
    label: "Treatments",
    icon: ClipboardList,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
  },
  {
    href: "/dashboard/patient_billing",
    label: "Patient Billing",
    icon: Receipt,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
  },
  {
    href: "/dashboard/surveys",
    label: "Surveys",
    icon: FileText,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
  },
  { href: "/dashboard/agents", label: "Agents", icon: Building2, roles: ["ADMIN"] },
  {
    href: "/dashboard/agent_billing",
    label: "Agent Billing",
    icon: Wallet,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/commission-payment",
    label: "Commission Payments",
    icon: HandCoins,
    roles: ["ADMIN"],
  },
  { href: "/dashboard/clinics", label: "Clinics", icon: Building, roles: ["ADMIN"] },
  {
    href: "/dashboard/deposit-receivers",
    label: "Deposit Receivers",
    icon: Landmark,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/cashflow",
    label: "Cashflow",
    icon: PiggyBank,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/settings/users",
    label: "Users",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/help",
    label: "Help",
    icon: CircleHelp,
    roles: ["ADMIN", "DOCTOR", "STAFF"],
  },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AdminSidebarProps = {
  onNavigate?: () => void;
  showSignOut?: boolean;
  className?: string;
};

export function AdminSidebar({
  onNavigate,
  showSignOut = true,
  className,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "STAFF";

  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card",
        className
      )}
    >
      <div className="flex items-center gap-2 px-6 py-5">
        <Stethoscope className="size-5 text-primary" />
        <span className="font-semibold">Clinic Admin</span>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive = isNavActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {showSignOut && (
        <div className="space-y-2 p-4">
          {session?.user?.name && (
            <p className="truncate px-1 text-xs text-muted-foreground">
              {session.user.name} · {role}
            </p>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      )}
    </aside>
  );
}
