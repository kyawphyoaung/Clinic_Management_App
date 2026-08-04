export type SupportedLanguage = "en" | "mm" | "zh";

export interface FormField {
  name: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "date"
    | "month"
    | "select"
    | "checkbox-group"
    | "checkbox"
    | "radio"
    | "textarea"
    | "heading"
    | "number"
    | "signature"
    | "url"
    | "file";
  label: Record<SupportedLanguage, string>;
  placeholder?: Record<SupportedLanguage, string>;
  required?: boolean;
  options?: Array<{
    value: string;
    label: Record<SupportedLanguage, string>;
  }>;
  conditional?: {
    field: string;
    value: string | boolean;
  };
  colSpan?: number;
  value?: string;
  compressWidth?: number;
  compressQuality?: number;
  useMasterSignature?: boolean;
  agreementFiles?: string[];
  readOnly?: boolean;
  accept?: string;
  maxFileSize?: number;
}

export interface FormSection {
  id: string;
  title: Record<SupportedLanguage, string>;
  description?: Record<SupportedLanguage, string>;
  fields: FormField[];
}

export function getAllFields(sections: FormSection[]): FormField[] {
  return sections.flatMap((section) => section.fields);
}

export function getSectionById(
  sections: FormSection[],
  id: string
): FormSection | undefined {
  return sections.find((section) => section.id === id);
}

export function getFieldsWithAgreement(sections: FormSection[]): FormField[] {
  return getAllFields(sections).filter(
    (field) => (field.agreementFiles?.length ?? 0) > 0
  );
}

export function getConsentFields(sections: FormSection[]): FormField[] {
  return getAllFields(sections).filter(
    (field) =>
      field.type === "checkbox" && (field.agreementFiles?.length ?? 0) > 0
  );
}

export function getSignatureField(
  sections: FormSection[]
): FormField | undefined {
  return getAllFields(sections).find((field) => field.type === "signature");
}

export function getMasterSignatureField(
  sections: FormSection[]
): FormField | undefined {
  return getAllFields(sections).find(
    (field) => field.name === "use_master_signature"
  );
}

export function getDefaultValues(sections: FormSection[]) {
  const defaults: Record<string, unknown> = {};

  for (const field of getAllFields(sections)) {
    const name = field.name.replace(/\[\]$/, "");
    if (field.type === "checkbox-group" || field.type === "radio") {
      defaults[name] = [];
    } else if (field.type === "checkbox") {
      defaults[name] = false;
    } else if (field.type === "date" || field.type === "month") {
      defaults[name] = "";
    } else if (field.type === "signature") {
      defaults[name] = null;
    } else if (field.type === "number") {
      defaults[name] = "";
    } else {
      defaults[name] = "";
    }
  }

  return defaults;
}
