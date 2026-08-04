"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyRegistrationLinkButtonProps = {
  path: string;
  label: string;
  successMessage: string;
};

export function CopyRegistrationLinkButton({
  path,
  label,
  successMessage,
}: CopyRegistrationLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleCopy} type="button">
        {copied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Copy className="size-4" />
        )}
        {copied ? "Copied!" : label}
        <Link2 className="size-3 opacity-50" />
      </Button>
      {copied && (
        <p className="text-xs text-green-400" role="status">
          {successMessage}
        </p>
      )}
    </div>
  );
}
