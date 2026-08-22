"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StickyNote } from "lucide-react";
import { formatStableTaiwanDateTime } from "@/lib/book-i18n";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type NoteRow = {
  id: string;
  title: string;
  content?: string | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  bloodPressure: string | null;
  heartRate: number | null;
  weight: number | null;
  height: number | null;
  bodyTemperature: number | null;
  createdAt: Date | string;
  createdBy: { fullName: string };
};

function vitalsSummary(n: NoteRow): string {
  const parts: string[] = [];
  if (n.bloodPressure) parts.push(`BP ${n.bloodPressure}`);
  if (n.heartRate != null) parts.push(`HR ${n.heartRate}`);
  if (n.weight != null) parts.push(`Wt ${n.weight}`);
  if (n.height != null) parts.push(`Ht ${n.height}`);
  if (n.bodyTemperature != null) parts.push(`Temp ${n.bodyTemperature}`);
  return parts.length ? parts.join(" · ") : "—";
}

function toIso(createdAt: Date | string) {
  return typeof createdAt === "string" ? createdAt : createdAt.toISOString();
}

type Props = {
  notes: NoteRow[];
  patientId: string;
  treatmentId: string;
  canWrite: boolean;
};

export function TreatmentNotesTable({
  notes,
  treatmentId,
  canWrite,
}: Props) {
  const router = useRouter();
  const noteHref = (noteId: string) =>
    `/dashboard/treatments/${treatmentId}/notes/${noteId}`;
  const newHref = `/dashboard/treatments/${treatmentId}/notes/new`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
        <CardTitle className="text-base">Linked notes</CardTitle>
        {canWrite && (
          <Button
            type="button"
            size="sm"
            className="bg-amber-600 text-white hover:bg-amber-700"
            render={<Link href={newHref} />}
          >
            <StickyNote className="size-4" />
            Add Notes
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ResponsiveList
          table={
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Vitals</TableHead>
                  <TableHead>Created by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No linked notes
                    </TableCell>
                  </TableRow>
                ) : (
                  notes.map((n) => (
                    <TableRow
                      key={n.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(noteHref(n.id))}
                    >
                      <TableCell suppressHydrationWarning>
                        {formatStableTaiwanDateTime(toIso(n.createdAt))}
                      </TableCell>
                      <TableCell className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400">
                        {n.title}
                      </TableCell>
                      <TableCell className="text-xs">
                        {vitalsSummary(n)}
                      </TableCell>
                      <TableCell>{n.createdBy.fullName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          }
          cards={
            <div className="space-y-3 p-4">
              {notes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No linked notes
                </p>
              ) : (
                notes.map((n) => (
                  <Card
                    key={n.id}
                    className="cursor-pointer shadow-sm"
                    onClick={() => router.push(noteHref(n.id))}
                  >
                    <CardContent className="space-y-2 p-4">
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">
                        {n.title}
                      </p>
                      <MobileField label="Date">
                        <span suppressHydrationWarning>
                          {formatStableTaiwanDateTime(toIso(n.createdAt))}
                        </span>
                      </MobileField>
                      <MobileField label="Vitals">
                        {vitalsSummary(n)}
                      </MobileField>
                      <MobileField label="Created by">
                        {n.createdBy.fullName}
                      </MobileField>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
