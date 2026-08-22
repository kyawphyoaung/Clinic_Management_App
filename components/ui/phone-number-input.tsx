"use client";

import { useMemo, useState } from "react";
import {
  PHONE_COUNTRIES,
  formatNationalNumber,
  parseE164,
  toE164,
} from "@/lib/constants/phone-countries";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PhoneNumberInputProps = {
  value: string;
  onChange: (e164: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  invalid?: boolean;
  id?: string;
};

export function PhoneNumberInput({
  value,
  onChange,
  placeholder,
  readOnly,
  invalid,
  id,
}: PhoneNumberInputProps) {
  const parsed = value ? parseE164(value) : null;
  const [iso, setIso] = useState(parsed?.iso ?? "TW");
  const [leadingZeroWarning, setLeadingZeroWarning] = useState(false);

  const country = useMemo(
    () => PHONE_COUNTRIES.find((c) => c.iso === iso) ?? PHONE_COUNTRIES[0],
    [iso]
  );

  const nationalDigits = parsed?.iso === iso ? parsed.national : value.replace(/^\+\d+/, "").replace(/\D/g, "");
  const display = formatNationalNumber(country.format, nationalDigits);

  function handleCountryChange(nextIso: string) {
    const next = PHONE_COUNTRIES.find((c) => c.iso === nextIso) ?? PHONE_COUNTRIES[0];
    setIso(next.iso);
    onChange(toE164(next.dial, nationalDigits));
  }

  function handleNumberChange(raw: string) {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0")) {
      setLeadingZeroWarning(true);
      digits = digits.replace(/^0+/, "");
    } else {
      setLeadingZeroWarning(false);
    }
    onChange(toE164(country.dial, digits));
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Select
          value={iso}
          disabled={readOnly}
          aria-label="Country code"
          className="h-9 w-[9.5rem] shrink-0"
          onChange={(e) => handleCountryChange(e.target.value)}
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={`${c.iso}-${c.dial}`} value={c.iso}>
              {c.name} +{c.dial}
            </option>
          ))}
        </Select>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={display}
          placeholder={placeholder || country.placeholder}
          readOnly={readOnly}
          aria-invalid={invalid}
          className={cn(
            "min-w-0 flex-1",
            invalid ? "border-destructive focus-visible:ring-destructive/40" : undefined
          )}
          onChange={(e) => handleNumberChange(e.target.value)}
        />
      </div>
      {leadingZeroWarning && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Phone numbers should start with 9, not 0. The leading zero was removed.
        </p>
      )}
    </div>
  );
}
