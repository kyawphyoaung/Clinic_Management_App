"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { QUESTIONNAIRES } from "@/lib/constants/questionnaires";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type PatientSurveyGeneratorProps = {
  patientId: string;
};

export function PatientSurveyGenerator({ patientId }: PatientSurveyGeneratorProps) {
  const forms = useMemo(
    () =>
      Object.values(QUESTIONNAIRES).map((form) => ({
        id: form.id,
        label: form.title.en,
      })),
    []
  );
  const [formId, setFormId] = useState(forms[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!formId) return;
    const link = `${window.location.origin}/survey/${formId}?patientId=${patientId}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <p className="text-xs text-muted-foreground">Survey Links</p>
          <Select value={formId} onChange={(e) => setFormId(e.target.value)}>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="button" onClick={handleGenerate}>
          {copied ? <Check className="size-4 text-green-400" /> : <Copy className="size-4" />}
          {copied ? "Copied to Clipboard" : "Generate"}
        </Button>
      </div>
    </div>
  );
}
