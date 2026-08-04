"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LandingCta } from "@/components/landing/landing-cta";
import { LANDING, LANDING_NAV } from "@/lib/landing";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled || open
          ? "bg-[var(--landing-cream)]/90 shadow-[0_8px_30px_-18px_rgba(15,15,26,0.45)] backdrop-blur-md"
          : "bg-[var(--landing-cream)]/70 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-8">
        <Link
          href="#home"
          className="relative flex h-9 w-[140px] shrink-0 items-center sm:h-10 sm:w-[160px]"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/images/main_logo.svg"
            alt={LANDING.brand}
            fill
            className="object-contain object-left"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LANDING_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm tracking-wide text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-navy)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <LandingCta href={LANDING.registerHref} className="px-5 py-2.5 text-sm tracking-wide">
            Register Now
          </LandingCta>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center text-[var(--landing-navy)] md:hidden"
          aria-expanded={open}
          aria-controls="landing-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        id="landing-mobile-nav"
        className={cn(
          "border-t border-[var(--landing-navy)]/8 bg-[var(--landing-cream)] md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4" aria-label="Mobile">
          {LANDING_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-2 py-3 text-base text-[var(--landing-ink)]"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2">
            <LandingCta
              href={LANDING.registerHref}
              className="w-full text-sm tracking-wide"
            >
              Register Now
            </LandingCta>
          </div>
        </nav>
      </div>
    </header>
  );
}
