"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type LandingCopyButtonProps = {
  value: string;
  className?: string;
};

export function LandingCopyButton({ value, className }: LandingCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-2 text-left text-sm text-[var(--landing-cream)]/85 transition-colors hover:text-[var(--landing-gold-soft)]",
        className
      )}
      aria-label={copied ? "Copied" : `Copy ${value}`}
    >
      <span className="break-all">{value}</span>
      {copied ? (
        <Check className="size-3.5 shrink-0 text-[var(--landing-gold)]" aria-hidden />
      ) : (
        <Copy className="size-3.5 shrink-0 opacity-70" aria-hidden />
      )}
    </button>
  );
}
