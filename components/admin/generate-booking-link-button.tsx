"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensurePatientBookingToken } from "@/lib/actions/appointments";

type Props = {
  patientId: string;
};

export function GenerateBookingLinkButton({ patientId }: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const token = await ensurePatientBookingToken(patientId);
      const url = `${window.location.origin}/book/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Failed to generate link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={handleClick}
      >
        {copied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Copy className="size-4" />
        )}
        {copied ? "Copied!" : busy ? "Generating…" : "Generate Booking Link"}
        <Link2 className="size-3 opacity-50" />
      </Button>
      {copied && (
        <p className="text-xs text-green-400">Booking link copied to clipboard!</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
