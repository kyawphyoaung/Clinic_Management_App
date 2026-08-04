import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ResponsiveListProps = {
  /** Desktop table (shown at lg+) */
  table: ReactNode;
  /** Mobile card stack (shown below lg) */
  cards: ReactNode;
  className?: string;
};

/** Renders a table on lg+ and a card stack below lg. No horizontal scroll. */
export function ResponsiveList({ table, cards, className }: ResponsiveListProps) {
  return (
    <div className={cn(className)}>
      <div className="hidden lg:block">{table}</div>
      <div className="lg:hidden">{cards}</div>
    </div>
  );
}

type MobileFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function MobileField({ label, children, className }: MobileFieldProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      <span className="font-medium text-foreground">{label}: </span>
      {children}
    </p>
  );
}
