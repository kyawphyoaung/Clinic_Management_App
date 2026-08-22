import { z } from "zod";
import type { FormField, FormSection } from "@/lib/constants/form-types";
import {
  getVisibleFields,
  getVisibleSectionFields,
  isFieldVisible,
  normalizeFieldName,
} from "@/lib/utils/config-driven-form";

function zodForField(field: FormField): z.ZodTypeAny {
  switch (field.type) {
    case "email":
      return z.string().email("Invalid email address");
    case "tel":
      return z
        .string()
        .regex(/^\+[1-9]\d{1,14}$/, "Enter a valid phone number");
    case "date":
    case "month":
      return z.string().min(1, "Date is required");
    case "number":
      return z.coerce.number({ error: "Must be a number" });
    case "checkbox":
      return z.literal(true, { error: "This field is required" });
    case "checkbox-group":
      if (field.value) {
        return z
          .union([z.boolean(), z.array(z.string()), z.string()])
          .refine(
            (val) => {
              if (Array.isArray(val)) return val.includes(field.value!);
              return val === field.value || val === true;
            },
            { message: "This field is required" }
          );
      }
      return z
        .array(z.string())
        .min(1, "Select at least one option");
    case "radio":
      return z.string().min(1, "Please select an option");
    case "signature":
      return z.string().min(1, "Signature is required");
    case "url":
      return z.string().url("Invalid URL").or(z.literal(""));
    case "textarea":
    case "text":
    case "select":
    default:
      return z.string().min(1, "This field is required");
  }
}

function optionalFieldSchema(field: FormField): z.ZodTypeAny {
  if (field.type === "checkbox") {
    return z.boolean().optional();
  }

  if (field.type === "checkbox-group") {
    if (field.value) {
      return z.union([z.boolean(), z.array(z.string()), z.string()]).optional();
    }
    return z.array(z.string()).optional();
  }

  if (field.type === "number") {
    return z.coerce.number().optional().or(z.literal(""));
  }

  if (field.type === "url") {
    return z.string().url().or(z.literal("")).optional();
  }

  if (field.type === "tel") {
    return z
      .string()
      .regex(/^\+[1-9]\d{1,14}$/, "Enter a valid phone number")
      .or(z.literal(""))
      .optional();
  }

  const base = zodForField(field);
  return base.optional().or(z.literal(""));
}

function buildShapeFromFields(
  fields: FormField[],
  values: Record<string, unknown>
) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    const name = normalizeFieldName(field.name);

    if (field.type === "heading" || field.type === "signature") {
      if (field.type === "signature" && field.required) {
        shape[name] = zodForField(field);
      }
      continue;
    }

    if (!isFieldVisible(field, values)) continue;

    shape[name] = field.required
      ? zodForField(field)
      : optionalFieldSchema(field);

    if (field.type === "date" && name === "date_of_birth") {
      shape[name] = shape[name].refine((val: unknown) => {
        if (!val || typeof val !== "string") return true;
        const selected = new Date(val);
        const now = new Date();
        selected.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        return selected <= now;
      }, "Date of birth cannot be in the future");
    }
  }

  return shape;
}

export function buildRegistrationSchema(
  sections: FormSection[],
  values: Record<string, unknown> = {}
) {
  const fields = getVisibleFields(sections, values);
  return z.object(buildShapeFromFields(fields, values)).passthrough();
}

export function buildSectionSchema(
  section: FormSection,
  values: Record<string, unknown>
) {
  const fields = getVisibleSectionFields(section, values);
  return z.object(buildShapeFromFields(fields, values)).passthrough();
}

export function buildClientRegistrationSchema(sections: FormSection[]) {
  return (values: Record<string, unknown>) =>
    buildRegistrationSchema(sections, values);
}

export function buildServerRegistrationSchema(sections: FormSection[]) {
  return buildRegistrationSchema(sections);
}

export type RegistrationFormValues = Record<string, unknown>;
