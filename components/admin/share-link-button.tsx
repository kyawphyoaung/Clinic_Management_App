"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ShareLinkButtonProps = {
  shareToken: string;
};

export function ShareLinkButton({ shareToken }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/shared/agent/${shareToken}`;
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
      {copied ? "Copied!" : "Share Link"}
      <Link2 className="size-3 opacity-50" />
    </Button>
  );
}
