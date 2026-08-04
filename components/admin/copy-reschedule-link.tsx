"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  token: string;
};

export function CopyRescheduleLink({ token }: Props) {
  const [copied, setCopied] = useState(false);
  const path = `/appointments/reschedule/${token}`;

  async function copy() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={path} className="font-mono text-xs" />
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
