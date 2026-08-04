"use client";

import type { SupportedLanguage } from "@/lib/constants/form-types";
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from "@/lib/constants/labels";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type FormLanguageSelectorProps = {
  language: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
};

export function FormLanguageSelector({
  language,
  onChange,
}: FormLanguageSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <Label className="text-sm text-muted-foreground">Language</Label>
      <Select
        value={language}
        onChange={(e) => onChange(e.target.value as SupportedLanguage)}
        className="w-40"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang][lang]}
          </option>
        ))}
      </Select>
    </div>
  );
}
