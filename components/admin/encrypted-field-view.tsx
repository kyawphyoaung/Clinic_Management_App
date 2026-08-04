"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type EncryptedFieldViewProps = {
  endpoint: string;
};

export function EncryptedFieldView({ endpoint }: EncryptedFieldViewProps) {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reveal() {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      const body = (await res.json()) as { value?: string };
      if (res.ok) {
        setValue(body.value ?? "—");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span>{value ?? "[Encrypted]"}</span>
      {!value && (
        <Button type="button" variant="outline" size="sm" disabled={loading} onClick={reveal}>
          {loading ? "Loading..." : "View"}
        </Button>
      )}
    </div>
  );
}
