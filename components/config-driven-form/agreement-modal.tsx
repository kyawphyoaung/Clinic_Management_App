"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, X } from "lucide-react";
import { recordAgreementConsent } from "@/lib/actions/consent";
import {
  agreementDisplayTitle,
  parseAgreementFilePath,
} from "@/lib/utils/agreement-files";
import { Button } from "@/components/ui/button";

type AgreementModalProps = {
  open: boolean;
  files: string[];
  formType: "patient" | "agent";
  masterSignaturePath?: string | null;
  onClose: () => void;
  onComplete: (consentLogIds: string[]) => void;
};

export function AgreementModal({
  open,
  files,
  formType,
  masterSignaturePath,
  onClose,
  onComplete,
}: AgreementModalProps) {
  const [index, setIndex] = useState(0);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [consentLogIds, setConsentLogIds] = useState<string[]>([]);

  const currentFile = files[index];
  const parsed = currentFile ? parseAgreementFilePath(currentFile) : null;
  const isLast = index === files.length - 1;

  useEffect(() => {
    if (!open) {
      setIndex(0);
      setConsentLogIds([]);
      setContent("");
      return;
    }

    if (!currentFile) return;

    setLoading(true);
    fetch(currentFile)
      .then((res) => res.text())
      .then(setContent)
      .catch(() => setContent("*Unable to load agreement.*"))
      .finally(() => setLoading(false));
  }, [open, currentFile]);

  if (!open || !currentFile || !parsed) return null;

  async function handleAgree() {
    setSubmitting(true);

    const result = await recordAgreementConsent({
      documentPath: currentFile,
      source: "DIGITAL",
      consentedAt: new Date().toISOString(),
      signatureImageUrl: masterSignaturePath ?? undefined,
      formType,
    });

    setSubmitting(false);

    if (!result.success) return;

    const updated = [...consentLogIds, result.consentLogId];

    if (isLast) {
      onComplete(updated);
      onClose();
      return;
    }

    setConsentLogIds(updated);
    setIndex((i) => i + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-amber-500/30 bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-serif text-lg text-amber-200/90">
            {agreementDisplayTitle(parsed.documentType)} ({index + 1} /{" "}
            {files.length})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 prose prose-invert prose-sm max-w-none">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-amber-400" />
            </div>
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
        </div>

        <div className="border-t border-border px-5 py-4">
          <Button
            type="button"
            className="w-full bg-amber-600/90 hover:bg-amber-500 text-white"
            disabled={loading || submitting}
            onClick={handleAgree}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isLast ? "I Agree & Close" : "I Agree & Next →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
