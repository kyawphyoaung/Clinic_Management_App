"use client";

import type { FormEvent, ReactNode } from "react";

/**
 * Hard-navigates on submit so filter applies are a single document request.
 * Soft App Router transitions were getting stuck in a Turbopack HMR refetch
 * storm (hundreds of identical RSC fetches to the same filtered URL).
 */
export function PatientsFilterForm({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams();

    for (const [key, value] of data.entries()) {
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (!trimmed) continue;
      params.set(key, trimmed);
    }

    const qs = params.toString();
    window.location.assign(
      qs ? `/dashboard/patients?${qs}` : "/dashboard/patients"
    );
  }

  return (
    <form
      method="GET"
      action="/dashboard/patients"
      onSubmit={onSubmit}
      className={className}
    >
      {children}
    </form>
  );
}
