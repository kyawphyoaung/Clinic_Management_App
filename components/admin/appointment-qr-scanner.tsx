"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupAppointmentByPublicId } from "@/lib/actions/appointments";

export function AppointmentQrScanner() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const elId = "appointment-qr-reader";
    const scanner = new Html5Qrcode(elId);
    scannerRef.current = scanner;
    handlingRef.current = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          if (handlingRef.current) return;
          handlingRef.current = true;
          void handleLookup(decoded.trim());
        },
        () => {}
      )
      .catch(() => {
        setError("Camera permission denied or unavailable. Use manual entry.");
      });

    return () => {
      scanner
        .stop()
        .catch(() => {})
        .finally(() => {
          scanner.clear();
          scannerRef.current = null;
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleLookup(publicId: string) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await lookupAppointmentByPublicId(publicId);
      if (!result.success) {
        setError(result.error);
        handlingRef.current = false;
        return;
      }
      setInfo(
        `${result.patientName ?? "Patient"} · ${result.publicId} · ${result.status}`
      );
      setOpen(false);
      router.push(`/dashboard/appointments/${result.id}`);
    });
  }

  return (
    <>
      <Button
        type="button"
        className="bg-amber-600 text-white hover:bg-amber-700"
        onClick={() => {
          setError(null);
          setInfo(null);
          setOpen(true);
        }}
      >
        <QrCode className="size-4" />
        Scan QR
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-5 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-semibold">Scan appointment QR</h3>
            <div
              id="appointment-qr-reader"
              className="overflow-hidden rounded-md border border-border"
            />
            <div className="space-y-2 border-t border-border pt-3">
              <Label>Manual Appointment ID</Label>
              <div className="flex gap-2">
                <Input
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value.toUpperCase())}
                  placeholder="4-char ID"
                  maxLength={8}
                />
                <Button
                  type="button"
                  disabled={isPending || !manualId.trim()}
                  onClick={() => handleLookup(manualId.trim())}
                >
                  Search
                </Button>
              </div>
            </div>
            {error && (
              <p className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-md bg-emerald-500/15 px-3 py-2 text-sm text-emerald-700">
                {info}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
