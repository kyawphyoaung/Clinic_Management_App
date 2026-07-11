"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Users,
  UserPlus,
  Building2,
  LogOut,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard/patients", label: "Patients", icon: Users },
  { href: "/dashboard/patients/new", label: "Register Patient", icon: UserPlus },
  { href: "/dashboard/agents", label: "Agents", icon: Building2 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 px-6 py-5">
        <Stethoscope className="size-5 text-primary" />
        <span className="font-semibold">Clinic Admin</span>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard/patients" &&
              pathname.startsWith("/dashboard/patients/") &&
              pathname !== "/dashboard/patients/new");

          return (
            <Link
              key={item.href}
              href={item.href}
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
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
