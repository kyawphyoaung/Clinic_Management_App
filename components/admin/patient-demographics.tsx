"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SectionField = {
  label: string;
  value: string;
  encryptedKey?: string;
};

type PatientDemographicsProps = {
  patientId: string;
  sections: { title: string; fields: SectionField[] }[];
  signatureAvailable: boolean;
};

export function PatientDemographics({
  patientId,
  sections,
  signatureAvailable,
}: PatientDemographicsProps) {
  const [viewAll, setViewAll] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  const visibleSections = viewAll ? sections : sections.slice(0, 1);

  async function revealField(field: string) {
    setLoadingField(field);
    const res = await fetch(
      `/api/patients/${patientId}/decrypt?field=${encodeURIComponent(field)}`,
      { cache: "no-store" }
    );
    const body = (await res.json()) as { value?: string };
    setLoadingField(null);
    if (res.ok) {
      setRevealed((prev) => ({ ...prev, [field]: body.value ?? "—" }));
    }
  }

  async function openSignature() {
    const res = await fetch(`/api/patients/${patientId}/signature`, {
      cache: "no-store",
    });
    const body = (await res.json()) as { url?: string };
    if (res.ok && body.url) {
      setSignatureUrl(body.url);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Demographics</CardTitle>
          {sections.length > 1 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setViewAll((v) => !v)}>
              {viewAll ? "Show Less" : "View All"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {visibleSections.map((section) => (
            <details key={section.title} open className="rounded-md border border-border/60">
              <summary className="cursor-pointer px-3 py-2 font-medium text-primary">
                {section.title}
              </summary>
              <div className="space-y-2 px-3 pb-3">
                {section.fields.map((field) => (
                  <div
                    key={`${section.title}-${field.label}`}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="text-muted-foreground">{field.label}</span>
                    {field.encryptedKey ? (
                      <div className="flex items-center gap-2">
                        <span className="text-right">
                          {revealed[field.encryptedKey] ?? "[Encrypted]"}
                        </span>
                        {!revealed[field.encryptedKey] && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={loadingField === field.encryptedKey}
                            onClick={() => revealField(field.encryptedKey!)}
                          >
                            {loadingField === field.encryptedKey ? "Loading..." : "View"}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-right">{field.value || "—"}</span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          ))}

          {viewAll && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Signature Image</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!signatureAvailable}
                onClick={openSignature}
              >
                View Signature
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {signatureUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-2xl rounded-lg border border-border bg-card p-4">
            <button
              type="button"
              onClick={() => setSignatureUrl(null)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              aria-label="Close signature"
            >
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureUrl}
              alt="Patient signature"
              className="max-h-[70vh] w-full rounded object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
