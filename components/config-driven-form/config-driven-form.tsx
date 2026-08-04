"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import type { FormField, FormSection, SupportedLanguage } from "@/lib/constants/form-types";
import { getDefaultValues } from "@/lib/constants/form-types";
import { normalizeFieldName } from "@/lib/utils/config-driven-form";
import { buildSectionSchema } from "@/lib/validations/registration";
import { FormLanguageSelector } from "@/components/config-driven-form/form-language-selector";
import { SectionTabBar } from "@/components/config-driven-form/section-tab-bar";
import { SectionFields } from "@/components/config-driven-form/field-renderer";
import { AgreementModal } from "@/components/config-driven-form/agreement-modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type RegistrationSubmitPayload = {
  values: Record<string, unknown>;
  signatureData: string;
  consentLogIds: string[];
  language: SupportedLanguage;
  staff?: {
    signatureDate?: string;
    paperSignatureData?: string;
    physicalLocation?: string;
    staffDeclaration?: boolean;
  };
};

type ConfigDrivenFormProps = {
  sections: FormSection[];
  formType: "patient" | "agent";
  mode?: "public" | "staff";
  title: string;
  description?: string;
  defaultOverrides?: Record<string, unknown>;
  readOnlyOverrides?: Record<string, boolean>;
  onSubmit: (
    payload: RegistrationSubmitPayload
  ) => Promise<{ success: boolean; displayId?: string; agentId?: string; error?: string }>;
};

export function ConfigDrivenForm({
  sections,
  formType,
  mode = "public",
  title,
  description,
  defaultOverrides,
  readOnlyOverrides,
  onSubmit,
}: ConfigDrivenFormProps) {
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [activeIndex, setActiveIndex] = useState(0);
  const [navError, setNavError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [agreementField, setAgreementField] = useState<FormField | null>(null);
  const [staffPaperSignature, setStaffPaperSignature] = useState<string | null>(null);
  const [staffPhysicalLocation, setStaffPhysicalLocation] = useState("");
  const [staffDeclaration, setStaffDeclaration] = useState(false);
  const [staffSignatureDate, setStaffSignatureDate] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  });

  useEffect(() => {
    if (!navError) return;
    const timer = setTimeout(() => setNavError(null), 6000);
    return () => clearTimeout(timer);
  }, [navError]);

  useEffect(() => {
    if (!submitError) return;
    const timer = setTimeout(() => setSubmitError(null), 6000);
    return () => clearTimeout(timer);
  }, [submitError]);

  const defaults = useMemo(
    () => ({ ...getDefaultValues(sections), ...defaultOverrides }),
    [sections, defaultOverrides]
  );

  const form = useForm<Record<string, unknown>>({
    defaultValues: defaults,
    mode: "onChange",
  });

  const values = form.watch();
  const errors = form.formState.errors;
  const activeSection = sections[activeIndex];
  const isLastSection = activeIndex === sections.length - 1;

  const consentLogIds = useMemo(() => {
    const ids: string[] = [];
    for (const section of sections) {
      for (const field of section.fields) {
        const name = normalizeFieldName(field.name);
        const key = `__consent_logs_${name}`;
        const fieldIds = values[key];
        if (Array.isArray(fieldIds)) {
          ids.push(...fieldIds.map(String));
        }
      }
    }
    return ids;
  }, [sections, values]);

  const masterSignature =
    values.use_master_signature === true
      ? (values.signature_data as string | undefined)
      : undefined;

  const validateSection = useCallback(
    (index: number) => {
      const section = sections[index];
      const schema = buildSectionSchema(section, values);
      const result = schema.safeParse(values);

      if (!result.success) {
        for (const issue of result.error.issues) {
          const fieldName = String(issue.path[0] ?? "");
          if (fieldName) {
            form.setError(fieldName, { message: issue.message });
          }
        }
        return false;
      }
      return true;
    },
    [form, sections, values]
  );

  function navigateTo(index: number) {
    setNavError(null);

    if (index < activeIndex) {
      setActiveIndex(index);
      return;
    }

    if (index > activeIndex && !validateSection(activeIndex)) {
      setNavError(
        "Please complete all required fields in this section before proceeding."
      );
      return;
    }

    setActiveIndex(index);
  }

  function handleNext() {
    navigateTo(activeIndex + 1);
  }

  function handleAgreementComplete(field: FormField, ids: string[]) {
    const name = normalizeFieldName(field.name);
    form.setValue(`__consent_logs_${name}`, ids);
    form.setValue(name, true);
    setAgreementField(null);
  }

  async function handleSubmit() {
    setSubmitError(null);
    setSuccessMessage(null);

    for (let i = 0; i < sections.length; i++) {
      if (!validateSection(i)) {
        setActiveIndex(i);
        setNavError(
          "Please complete all required fields before submitting."
        );
        return;
      }
    }

    if (mode === "staff") {
      if (!staffSignatureDate) {
        setSubmitError("Date of signature is required.");
        return;
      }
      if (!staffPhysicalLocation.trim()) {
        setSubmitError("Physical location is required.");
        return;
      }
      if (!staffPaperSignature) {
        setSubmitError("Paper signature image is required.");
        return;
      }
      if (!staffDeclaration) {
        setSubmitError("Staff declaration is required.");
        return;
      }
    }

    const signatureData = String(values.signature_data ?? "");
    if (!signatureData && mode !== "staff") {
      setSubmitError("Signature is required.");
      return;
    }

    setIsSubmitting(true);

    const result = await onSubmit({
      values,
      signatureData: signatureData || staffPaperSignature || "",
      consentLogIds,
      language,
      staff:
        mode === "staff"
          ? {
              signatureDate: staffSignatureDate,
              paperSignatureData: staffPaperSignature ?? undefined,
              physicalLocation: staffPhysicalLocation,
              staffDeclaration,
            }
          : undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(
        result.displayId
          ? `Registration successful. Your Display ID is ${result.displayId}.`
          : "Application submitted successfully."
      );
      return;
    }

    setSubmitError(result.error ?? "Submission failed.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-amber-100/95">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <FormLanguageSelector language={language} onChange={setLanguage} />
      </div>

      <SectionTabBar
        sections={sections}
        activeIndex={activeIndex}
        values={values}
        errors={errors}
        onTabClick={navigateTo}
      />

      {navError && (
        <Alert className="border-destructive/50">
          <AlertDescription className="text-destructive">{navError}</AlertDescription>
        </Alert>
      )}

      {successMessage ? (
        <Card className="border-green-500/30">
          <CardContent className="py-8 text-center">
            <p className="text-lg text-green-400">{successMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-amber-100/90">
              {activeSection.title[language]}
            </CardTitle>
            {activeSection.description && (
              <CardDescription>{activeSection.description[language]}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <SectionFields
              section={activeSection}
              language={language}
              values={values}
              errors={errors}
              onChange={(name, value) => {
                const key = normalizeFieldName(name);
                form.setValue(key, value, { shouldValidate: true });
                form.clearErrors(key);
              }}
              onAgreementCheckboxClick={(field) => setAgreementField(field)}
              readOnlyOverrides={readOnlyOverrides}
            />

            {mode === "staff" && isLastSection && (
              <div className="space-y-4 border-t border-border pt-4">
                <h3 className="font-serif text-base text-amber-200/80">
                  Staff Digitization
                </h3>
                <div className="space-y-2">
                  <Label>Date of Signature</Label>
                  <Input
                    type="date"
                    value={staffSignatureDate}
                    onChange={(e) => setStaffSignatureDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Physical Location</Label>
                  <Input
                    value={staffPhysicalLocation}
                    onChange={(e) => setStaffPhysicalLocation(e.target.value)}
                    placeholder="Clinic location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Paper Signature Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      compressImageFile(file)
                        .then((dataUrl) => setStaffPaperSignature(dataUrl))
                        .catch(() =>
                          setSubmitError(
                            "Unable to process image. Please upload a different file."
                          )
                        );
                    }}
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-amber-400"
                    checked={staffDeclaration}
                    onChange={(e) => setStaffDeclaration(e.target.checked)}
                  />
                  <span className="text-sm">
                    I confirm that I have witnessed the applicant sign the original
                    paper document.
                  </span>
                </label>
              </div>
            )}

            {submitError && (
              <Alert className="border-destructive/50">
                <AlertDescription className="text-destructive">
                  {submitError}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={activeIndex === 0}
                onClick={() => navigateTo(activeIndex - 1)}
              >
                Previous
              </Button>

              {isLastSection ? (
                <Button
                  type="button"
                  className="w-full bg-amber-600/90 hover:bg-amber-500 sm:w-auto"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Submit
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full bg-amber-600/90 hover:bg-amber-500 sm:w-auto"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {agreementField && agreementField.agreementFiles && (
        <AgreementModal
          open
          files={agreementField.agreementFiles}
          formType={formType}
          masterSignaturePath={masterSignature ?? null}
          onClose={() => setAgreementField(null)}
          onComplete={(ids) => handleAgreementComplete(agreementField, ids)}
        />
      )}
    </div>
  );
}

async function compressImageFile(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imageUrl;
    });

    const targetWidth = 600;
    const ratio = targetWidth / img.width;
    const width = Math.min(targetWidth, img.width);
    const height = Math.round(img.height * (img.width > targetWidth ? ratio : 1));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.drawImage(img, 0, 0, width, height);
    const minQuality = 0.6;
    const maxQuality = 0.7;

    let quality = maxQuality;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > 140_000 && quality > minQuality) {
      quality -= 0.05;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
