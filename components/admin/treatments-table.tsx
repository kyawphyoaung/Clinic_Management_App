"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bulkDeleteTreatments } from "@/lib/actions/treatments";
import type { TreatmentStatus } from "@/prisma/generated/prisma/enums";
import { TreatmentStatusBadge } from "@/components/admin/treatment-status-badge";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TreatmentsTableRow = {
  id: string;
  treatmentDate: Date;
  endDate: Date | null;
  diagnosis: string | null;
  status: TreatmentStatus;
  patient: { id: string; fullName: string; displayId: string };
  doctor: { fullName: string } | null;
};

type TreatmentsTableProps = {
  treatments: TreatmentsTableRow[];
  canWrite: boolean;
};

export function TreatmentsTable({ treatments, canWrite }: TreatmentsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const allIds = useMemo(() => treatments.map((t) => t.id), [treatments]);
  const allSelected =
    treatments.length > 0 && treatments.every((t) => selected.has(t.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(allIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    const warn = window.confirm(
      "It should only be deleted if it was entered incorrectly or contains errors."
    );
    if (!warn) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selected.size} treatment(s)?`
    );
    if (!confirmed) return;

    startTransition(async () => {
      await bulkDeleteTreatments([...selected]);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      {canWrite && selected.size > 0 && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {selected.size} selected
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleBulkDelete}
          >
            Delete
          </Button>
        </div>
      )}
      <ResponsiveList
        table={
          <Table>
            <TableHeader>
              <TableRow>
                {canWrite && (
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all treatments"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </TableHead>
                )}
                <TableHead>Start Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treatments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canWrite ? 8 : 7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No treatments found
                  </TableCell>
                </TableRow>
              ) : (
                treatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    {canWrite && (
                      <TableCell>
                        <input
                          type="checkbox"
                          aria-label={`Select treatment ${treatment.id}`}
                          checked={selected.has(treatment.id)}
                          onChange={() => toggleOne(treatment.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      {treatment.treatmentDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/patients/${treatment.patient.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {treatment.patient.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{treatment.diagnosis ?? "—"}</TableCell>
                    <TableCell>{treatment.doctor?.fullName ?? "—"}</TableCell>
                    <TableCell>
                      <TreatmentStatusBadge status={treatment.status} />
                    </TableCell>
                    <TableCell>
                      {treatment.endDate
                        ? treatment.endDate.toLocaleDateString()
                        : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <Link
                            href={`/dashboard/treatments/${treatment.id}?from=treatments`}
                          />
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        }
        cards={
          <div className="space-y-3 p-4">
            {treatments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No treatments found
              </p>
            ) : (
              treatments.map((treatment) => (
                <Card key={treatment.id} className="shadow-sm">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {canWrite && (
                          <input
                            type="checkbox"
                            className="size-4"
                            aria-label={`Select treatment ${treatment.id}`}
                            checked={selected.has(treatment.id)}
                            onChange={() => toggleOne(treatment.id)}
                          />
                        )}
                        <p className="font-medium">
                          {treatment.diagnosis ?? "Treatment"}
                        </p>
                      </div>
                      <TreatmentStatusBadge status={treatment.status} />
                    </div>
                    <MobileField label="Patient">
                      <Link
                        href={`/dashboard/patients/${treatment.patient.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {treatment.patient.fullName}
                      </Link>
                    </MobileField>
                    <MobileField label="Start">
                      {treatment.treatmentDate.toLocaleDateString()}
                    </MobileField>
                    <MobileField label="Doctor">
                      {treatment.doctor?.fullName ?? "—"}
                    </MobileField>
                    {treatment.endDate && (
                      <MobileField label="End">
                        {treatment.endDate.toLocaleDateString()}
                      </MobileField>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      render={
                        <Link
                          href={`/dashboard/treatments/${treatment.id}?from=treatments`}
                        />
                      }
                    >
                      View
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        }
      />
    </div>
  );
}
