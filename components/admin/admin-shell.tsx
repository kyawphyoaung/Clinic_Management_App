"use client";

import { useEffect, useState } from "react";
import { Menu, UserRound, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setProfileOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initials =
    session?.user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {/* Desktop sidebar */}
      <div className="sticky top-0 hidden h-screen shrink-0 self-start md:block">
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] transform transition-transform duration-200",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <AdminSidebar
            className="w-full border-r-0 shadow-xl"
            showSignOut={false}
            onNavigate={() => setDrawerOpen(false)}
          />
          <button
            type="button"
            className="absolute right-2 top-3 rounded-md p-2 text-muted-foreground hover:bg-muted"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-3 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-10 shrink-0 p-0"
            aria-label="Open menu"
            onClick={() => {
              setProfileOpen(false);
              setDrawerOpen(true);
            }}
          >
            <Menu className="size-5" />
          </Button>
          <p className="truncate px-2 text-center text-sm font-semibold">
            Clinic Management App
          </p>
          <div className="relative shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-10 rounded-full p-0"
              aria-label="Account menu"
              onClick={() => {
                setDrawerOpen(false);
                setProfileOpen((v) => !v);
              }}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {initials || <UserRound className="size-4" />}
              </span>
            </Button>
            {profileOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40"
                  aria-label="Close account menu"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-card p-3 shadow-lg">
                  <p className="truncate text-sm font-medium">
                    {session?.user?.name ?? "Account"}
                  </p>
                  {session?.user?.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  )}
                  {session?.user?.role && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {session.user.role}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Logout
                  </Button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
