"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CopyRegistrationLinkProps = {
  partnerId: string;
};

export function CopyRegistrationLink({ partnerId }: CopyRegistrationLinkProps) {
  const [url, setUrl] = useState(`/register?ref=${partnerId}`);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/register?ref=${partnerId}`);
  }, [partnerId]);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[color:var(--partner-gold)]">
        Patient Registration Link
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input readOnly value={url} className="font-mono text-xs" />
        <Button type="button" variant="outline" onClick={handleCopy}>
          {copied ? "Copied" : "Copy to Clipboard"}
        </Button>
      </div>
    </div>
  );
}
