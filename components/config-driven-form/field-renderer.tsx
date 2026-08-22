"use client";

import type {
  FormField,
  FormSection,
  SupportedLanguage,
} from "@/lib/constants/form-types";
import {
  isFieldVisible,
  normalizeFieldName,
} from "@/lib/utils/config-driven-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { SignatureCanvas } from "@/components/config-driven-form/signature-canvas";

const E164_PHONE = /^\+[1-9]\d{1,14}$/;
const PHONE_ERROR = "Enter a valid phone number";

function currentYearMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function todayDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function RequiredMark({ required }: { required?: boolean }) {
  if (!required) return null;
  return <span className="text-destructive"> *</span>;
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <Label>
      {label}
      <RequiredMark required={required} />
    </Label>
  );
}

type FieldRendererProps = {
  field: FormField;
  language: SupportedLanguage;
  values: Record<string, unknown>;
  errors: Record<string, { message?: string } | undefined>;
  onChange: (name: string, value: unknown) => void;
  onAgreementCheckboxClick?: (field: FormField) => void;
  readOnlyOverrides?: Record<string, boolean>;
};

export function FieldRenderer({
  field,
  language,
  values,
  errors,
  onChange,
  onAgreementCheckboxClick,
  readOnlyOverrides,
}: FieldRendererProps) {
  if (!isFieldVisible(field, values)) return null;

  const name = normalizeFieldName(field.name);
  const label = field.label[language];
  const placeholder = field.placeholder?.[language];
  const error = errors[name]?.message ?? errors[field.name]?.message;
  const readOnly = readOnlyOverrides?.[name] ?? readOnlyOverrides?.[field.name] ?? field.readOnly;
  const fieldValue = values[name] ?? values[field.name];

  if (field.type === "heading") {
    return (
      <div className="col-span-full pt-2">
        <h3 className="font-serif text-base text-amber-200/80">{label}</h3>
      </div>
    );
  }

  const colSpan =
    field.colSpan === 3
      ? "col-span-full"
      : field.colSpan === 2
        ? "sm:col-span-2"
        : "";

  if (field.type === "checkbox") {
    const hasAgreements = (field.agreementFiles?.length ?? 0) > 0;
    const agreedCount =
      (values[`__consent_logs_${name}`] as string[] | undefined)?.length ??
      (values[`__consent_logs_${field.name}`] as string[] | undefined)?.length ??
      0;
    const allAgreed =
      !hasAgreements ||
      agreedCount >= (field.agreementFiles?.length ?? 0);
    const checked = hasAgreements ? allAgreed : fieldValue === true;

    return (
      <div className={`space-y-1 ${colSpan}`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-amber-400"
            checked={checked}
            readOnly={hasAgreements}
            onChange={(e) => {
              if (hasAgreements) {
                if (e.target.checked) {
                  onAgreementCheckboxClick?.(field);
                } else {
                  onChange(name, false);
                  onChange(`__consent_logs_${name}`, []);
                }
                return;
              }
              onChange(name, e.target.checked);
            }}
            onClick={(e) => {
              if (hasAgreements && !(fieldValue === true || allAgreed)) {
                e.preventDefault();
                onAgreementCheckboxClick?.(field);
              }
            }}
          />
          <span className="text-sm leading-relaxed">
            {label}
            <RequiredMark required={field.required} />
          </span>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (field.type === "checkbox-group") {
    if (field.value) {
      const checked = Array.isArray(fieldValue)
        ? (fieldValue as string[]).includes(field.value)
        : fieldValue === field.value;

      return (
        <div className={`space-y-1 ${colSpan}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-amber-400"
              checked={checked}
              onChange={(e) => {
                const current = Array.isArray(fieldValue)
                  ? [...(fieldValue as string[])]
                  : [];
                if (e.target.checked) {
                  onChange(name, [...current, field.value]);
                } else {
                  onChange(
                    name,
                    current.filter((v) => v !== field.value)
                  );
                }
              }}
            />
            <span className="text-sm">
              {label}
              <RequiredMark required={field.required} />
            </span>
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );
    }

    return (
      <div className={`space-y-2 ${colSpan}`}>
        <FieldLabel label={label} required={field.required} />
        <div className="space-y-2">
          {field.options?.map((option) => {
            const selected = Array.isArray(fieldValue)
              ? (fieldValue as string[]).includes(option.value)
              : false;

            return (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  className="size-4 accent-amber-400"
                  checked={selected}
                  onChange={(e) => {
                    const current = Array.isArray(fieldValue)
                      ? [...(fieldValue as string[])]
                      : [];
                    if (e.target.checked) {
                      onChange(name, [...current, option.value]);
                    } else {
                      onChange(
                        name,
                        current.filter((v) => v !== option.value)
                      );
                    }
                  }}
                />
                {option.label[language]}
              </label>
            );
          })}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <div className={`space-y-2 ${colSpan}`}>
        <FieldLabel label={label} required={field.required} />
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                type="radio"
                name={name}
                className="accent-amber-400"
                checked={fieldValue === option.value}
                onChange={() => onChange(name, option.value)}
              />
              {option.label[language]}
            </label>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className={`space-y-2 ${colSpan}`}>
        <FieldLabel label={label} required={field.required} />
        <Select
          value={String(fieldValue ?? "")}
          onChange={(e) => onChange(name, e.target.value)}
          disabled={readOnly}
        >
          <option value="">{placeholder ?? "Select..."}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label[language]}
            </option>
          ))}
        </Select>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className={`space-y-2 ${colSpan}`}>
        <FieldLabel label={label} required={field.required} />
        <Textarea
          value={String(fieldValue ?? "")}
          placeholder={placeholder}
          onChange={(e) => onChange(name, e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (field.type === "signature") {
    return (
      <div className={colSpan}>
        <SignatureCanvas
          label={label}
          value={(fieldValue as string | null) ?? null}
          onChange={(v) => onChange(name, v)}
          compressWidth={field.compressWidth}
          compressQuality={field.compressQuality}
          error={error}
        />
      </div>
    );
  }

  if (field.type === "tel") {
    const telValue = String(fieldValue ?? "");
    const telError =
      error ??
      (telValue && !E164_PHONE.test(telValue.replace(/\s+/g, ""))
        ? PHONE_ERROR
        : undefined);
    const hasTelError = Boolean(telError);

    return (
      <div className={`space-y-2 ${colSpan}`}>
        <FieldLabel label={label} required={field.required} />
        <PhoneNumberInput
          value={telValue}
          placeholder={placeholder}
          readOnly={readOnly}
          invalid={hasTelError}
          onChange={(e164) => onChange(name, e164)}
        />
        {telError && <p className="text-sm text-destructive">{telError}</p>}
      </div>
    );
  }

  if (field.type === "date" || field.type === "month") {
    return (
      <div className={`space-y-2 ${colSpan}`}>
        <FieldLabel label={label} required={field.required} />
        <Input
          type={field.type}
          value={String(fieldValue ?? "")}
          placeholder={placeholder}
          readOnly={readOnly}
          min={field.type === "month" ? currentYearMonth() : undefined}
          max={field.type === "date" && name === "date_of_birth" ? todayDateString() : undefined}
          className="scheme-dark"
          onChange={(e) => onChange(name, e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${colSpan}`}>
      <FieldLabel label={label} required={field.required} />
      <Input
        type={
          field.type === "email"
            ? "email"
            : field.type === "number"
              ? "number"
              : field.type === "url"
                ? "url"
                : "text"
        }
        value={String(fieldValue ?? "")}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange(name, e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function SectionFields({
  section,
  language,
  values,
  errors,
  onChange,
  onAgreementCheckboxClick,
  readOnlyOverrides,
}: {
  section: FormSection;
  language: SupportedLanguage;
  values: Record<string, unknown>;
  errors: Record<string, { message?: string } | undefined>;
  onChange: (name: string, value: unknown) => void;
  onAgreementCheckboxClick?: (field: FormField) => void;
  readOnlyOverrides?: Record<string, boolean>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {section.fields.map((field) => (
        <FieldRenderer
          key={`${section.id}-${normalizeFieldName(field.name)}-${field.value ?? ""}`}
          field={field}
          language={language}
          values={values}
          errors={errors}
          onChange={onChange}
          onAgreementCheckboxClick={onAgreementCheckboxClick}
          readOnlyOverrides={readOnlyOverrides}
        />
      ))}
    </div>
  );
}
