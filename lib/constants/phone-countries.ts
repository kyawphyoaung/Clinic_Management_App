export type PhoneCountry = {
  iso: string;
  name: string;
  dial: string;
  placeholder: string;
  format: "us" | "tw" | "mm" | "groups3";
};

/** Priority countries first (Taiwan, US, Myanmar), then remaining A–Z. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "TW", name: "Taiwan", dial: "886", placeholder: "956 781 282", format: "tw" },
  { iso: "US", name: "United States", dial: "1", placeholder: "(415) 234-5678", format: "us" },
  { iso: "MM", name: "Myanmar", dial: "95", placeholder: "912 345 678", format: "mm" },
  { iso: "AU", name: "Australia", dial: "61", placeholder: "412 345 678", format: "groups3" },
  { iso: "CA", name: "Canada", dial: "1", placeholder: "(416) 234-5678", format: "us" },
  { iso: "CN", name: "China", dial: "86", placeholder: "138 0013 8000", format: "groups3" },
  { iso: "GB", name: "United Kingdom", dial: "44", placeholder: "7911 123456", format: "groups3" },
  { iso: "HK", name: "Hong Kong", dial: "852", placeholder: "9123 4567", format: "groups3" },
  { iso: "ID", name: "Indonesia", dial: "62", placeholder: "812 345 6789", format: "groups3" },
  { iso: "IN", name: "India", dial: "91", placeholder: "91234 56789", format: "groups3" },
  { iso: "JP", name: "Japan", dial: "81", placeholder: "90 1234 5678", format: "groups3" },
  { iso: "KR", name: "South Korea", dial: "82", placeholder: "10 1234 5678", format: "groups3" },
  { iso: "MY", name: "Malaysia", dial: "60", placeholder: "12 345 6789", format: "groups3" },
  { iso: "PH", name: "Philippines", dial: "63", placeholder: "917 123 4567", format: "groups3" },
  { iso: "SG", name: "Singapore", dial: "65", placeholder: "9123 4567", format: "groups3" },
  { iso: "TH", name: "Thailand", dial: "66", placeholder: "91 234 5678", format: "groups3" },
  { iso: "VN", name: "Vietnam", dial: "84", placeholder: "91 234 56 78", format: "groups3" },
];

export function formatNationalNumber(format: PhoneCountry["format"], digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (!d) return "";

  if (format === "us") {
    const a = d.slice(0, 3);
    const b = d.slice(3, 6);
    const c = d.slice(6, 10);
    if (d.length <= 3) return a;
    if (d.length <= 6) return `(${a}) ${b}`;
    return `(${a}) ${b}-${c}`;
  }

  if (format === "tw") {
    const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean);
    return parts.join(" ");
  }

  if (format === "mm") {
    const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean);
    return parts.join(" ");
  }

  const chunks: string[] = [];
  for (let i = 0; i < d.length; i += 3) {
    chunks.push(d.slice(i, i + 3));
  }
  return chunks.join(" ");
}

export function parseE164(
  e164: string
): { iso: string; national: string } | null {
  const digits = e164.replace(/\D/g, "");
  if (!digits) return null;

  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const country of sorted) {
    if (digits.startsWith(country.dial)) {
      return { iso: country.iso, national: digits.slice(country.dial.length) };
    }
  }
  return null;
}

export function toE164(dial: string, nationalDigits: string): string {
  const n = nationalDigits.replace(/\D/g, "");
  if (!n) return "";
  return `+${dial}${n}`;
}
