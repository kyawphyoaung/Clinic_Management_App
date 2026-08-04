import type { FormField, FormSection } from "@/lib/constants/form-types";

export const SECTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function getSectionLetter(index: number): string {
  return SECTION_LETTERS[index] ?? String(index + 1);
}

/** Normalize config field name: strip trailing `[]`. */
export function normalizeFieldName(name: string): string {
  return name.replace(/\[\]$/, "");
}

export function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}

export function configNameToPrismaKey(name: string): string {
  return snakeToCamel(normalizeFieldName(name));
}

export function isInputField(field: FormField): boolean {
  return field.type !== "heading";
}

export function getSectionInputFields(section: FormSection): FormField[] {
  return section.fields.filter(isInputField);
}

export function getConditionalFieldName(field: FormField): string | undefined {
  return field.conditional?.field;
}

export function isFieldVisible(
  field: FormField,
  values: Record<string, unknown>
): boolean {
  if (!field.conditional) return true;

  const { field: condField, value: expected } = field.conditional;
  const actual = values[condField] ?? values[normalizeFieldName(condField)];

  if (Array.isArray(actual)) {
    return actual.includes(String(expected));
  }

  if (typeof expected === "boolean") {
    return Boolean(actual) === expected;
  }

  return String(actual ?? "") === String(expected);
}

export function getVisibleFields(
  sections: FormSection[],
  values: Record<string, unknown>
): FormField[] {
  return sections
    .flatMap((section) => section.fields)
    .filter((field) => isInputField(field) && isFieldVisible(field, values));
}

export function getVisibleSectionFields(
  section: FormSection,
  values: Record<string, unknown>
): FormField[] {
  return getSectionInputFields(section).filter((field) =>
    isFieldVisible(field, values)
  );
}

export function getFieldNamesForSection(
  section: FormSection,
  values: Record<string, unknown>
): string[] {
  return getVisibleSectionFields(section, values).map((field) => field.name);
}

export function isSectionComplete(
  section: FormSection,
  values: Record<string, unknown>,
  errors: Record<string, unknown>
): boolean {
  const fields = getVisibleSectionFields(section, values);
  if (fields.length === 0) return false;

  const hasErrors = fields.some(
    (field) =>
      errors[field.name] || errors[normalizeFieldName(field.name)]
  );

  if (hasErrors) return false;

  const allOptionalCheckboxes = fields.every(
    (field) =>
      !field.required &&
      (field.type === "checkbox" || field.type === "checkbox-group")
  );

  if (allOptionalCheckboxes) {
    return fields.some((field) =>
      isFieldFilled(
        field,
        values[normalizeFieldName(field.name)] ?? values[field.name]
      )
    );
  }

  return fields.every((field) => {
    if (!field.required) return true;
    return isFieldFilled(
      field,
      values[normalizeFieldName(field.name)] ?? values[field.name]
    );
  });
}

export function isFieldFilled(field: FormField, value: unknown): boolean {
  if (field.type === "checkbox") {
    return value === true;
  }

  if (field.type === "checkbox-group" || field.type === "radio") {
    if (field.value) {
      if (Array.isArray(value)) return value.includes(field.value);
      return value === field.value || value === true;
    }
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }

  if (field.type === "signature") {
    return typeof value === "string" && value.length > 0;
  }

  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);

  return Boolean(value);
}

/** Map form values keyed by config field names to Prisma create/update shape. */
export function mapFormValuesToPatientData(
  values: Record<string, unknown>,
  sections: FormSection[]
): Record<string, unknown> {
  const prismaData: Record<string, unknown> = {};
  const visibleFields = getVisibleFields(sections, values);

  for (const field of visibleFields) {
    const key = configNameToPrismaKey(field.name);
    const raw =
      values[normalizeFieldName(field.name)] ?? values[field.name];

    if (field.type === "heading") continue;

    if (field.type === "checkbox") {
      prismaData[key] = raw === true;
      continue;
    }

    // Boolean-style flags: unique name + value "true" (e.g. has_medical_reports)
    if (field.type === "checkbox-group" && field.value === "true") {
      prismaData[key] = Array.isArray(raw)
        ? raw.includes("true")
        : raw === "true" || raw === true;
      continue;
    }

    // Shared-name multi-select checkbox-group (e.g. medical_services with per-option value)
    if (field.type === "checkbox-group" && field.value) {
      if (!(key in prismaData)) {
        prismaData[key] = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
      }
      continue;
    }

    if (field.type === "checkbox-group") {
      prismaData[key] = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
      continue;
    }

    if (field.type === "radio") {
      prismaData[key] = Array.isArray(raw)
        ? raw[0] != null
          ? String(raw[0])
          : null
        : raw === "" || raw === undefined || raw === null
          ? null
          : String(raw);
      continue;
    }

    if (field.type === "date") {
      prismaData[key] = raw ? new Date(String(raw)) : null;
      continue;
    }

    if (field.type === "number") {
      prismaData[key] =
        raw === "" || raw === null || raw === undefined
          ? null
          : Number(raw);
      continue;
    }

    if (field.type === "signature") {
      continue;
    }

    prismaData[key] = raw === "" ? null : raw;
  }

  return prismaData;
}

export function mapFormValuesToAgentData(
  values: Record<string, unknown>,
  sections: FormSection[]
): Record<string, unknown> {
  return mapFormValuesToPatientData(values, sections);
}

export function getAgreementFieldNames(sections: FormSection[]): string[] {
  return sections
    .flatMap((s) => s.fields)
    .filter((f) => (f.agreementFiles?.length ?? 0) > 0)
    .map((f) => f.name);
}
