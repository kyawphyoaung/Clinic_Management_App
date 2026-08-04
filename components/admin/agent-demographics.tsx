"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SectionField = {
  label: string;
  value: string;
  encryptedKey?: string;
};

type AgentDemographicsProps = {
  agentId: string;
  sections: { title: string; fields: SectionField[] }[];
};

export function AgentDemographics({ agentId, sections }: AgentDemographicsProps) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [loadingField, setLoadingField] = useState<string | null>(null);

  async function revealField(field: string) {
    setLoadingField(field);
    const res = await fetch(
      `/api/agents/${agentId}/decrypt?field=${encodeURIComponent(field)}`,
      { cache: "no-store" }
    );
    const body = (await res.json()) as { value?: string };
    setLoadingField(null);
    if (res.ok) {
      setRevealed((prev) => ({ ...prev, [field]: body.value ?? "—" }));
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide Registered Information" : "View Registered Information"}
      </Button>

      {open && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registered Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {sections.map((section) => (
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
