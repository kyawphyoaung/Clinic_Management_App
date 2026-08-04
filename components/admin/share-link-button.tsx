"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ShareLinkButtonProps = {
  partnerId: string | null;
};

export function ShareLinkButton({ partnerId }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  if (!partnerId) {
    return <span className="text-xs text-muted-foreground">Pending approval</span>;
  }

  async function handleCopy() {
    const url = `${window.location.origin}/register?ref=${partnerId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <Check className="size-4 text-green-500" />
      ) : (
        <Copy className="size-4" />
      )}
      {copied ? "Copied!" : "Referral Link"}
      <Link2 className="size-3 opacity-50" />
    </Button>
  );
}
