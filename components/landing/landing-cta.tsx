import Link from "next/link";
import { cn } from "@/lib/utils";

type LandingCtaProps = {
  href: string;
  children: React.ReactNode;
  variant?: "gold" | "outline-light" | "outline-dark";
  className?: string;
};

export function LandingCta({
  href,
  children,
  variant = "gold",
  className,
}: LandingCtaProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center px-7 py-3 text-sm font-medium tracking-wide transition-all duration-300",
        variant === "gold" &&
          "bg-[var(--landing-gold)] text-[var(--landing-navy)] shadow-[0_8px_24px_-12px_rgba(201,168,76,0.7)] hover:-translate-y-0.5 hover:bg-[var(--landing-gold-soft)]",
        variant === "outline-light" &&
          "border border-[var(--landing-gold)]/60 text-[var(--landing-cream)] hover:border-[var(--landing-gold)] hover:bg-[var(--landing-gold)]/10",
        variant === "outline-dark" &&
          "border border-[var(--landing-navy)]/20 text-[var(--landing-navy)] hover:border-[var(--landing-gold)] hover:text-[var(--landing-navy)]",
        className
      )}
    >
      {children}
    </Link>
  );
}
