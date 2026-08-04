"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, X } from "lucide-react";
import { formatStableTaiwanDateTime } from "@/lib/book-i18n";
import { createPatientNote } from "@/lib/actions/patient-notes";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  patientId,
  treatmentId,
  canWrite,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<NoteRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitNote() {
    setError(null);
    startTransition(async () => {
      const result = await createPatientNote({
        patientId,
        treatmentId,
        title,
        content: content || null,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setAddOpen(false);
      setTitle("");
      setContent("");
      router.refresh();
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
          <CardTitle className="text-base">Linked notes</CardTitle>
          {canWrite && (
            <Button
              type="button"
              size="sm"
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => setAddOpen(true)}
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
                        onClick={() => setSelected(n)}
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
                      onClick={() => setSelected(n)}
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-semibold">{selected.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>
              {formatStableTaiwanDateTime(toIso(selected.createdAt))} ·{" "}
              {selected.createdBy.fullName}
            </p>
            <p className="mt-4 text-sm whitespace-pre-wrap">
              {selected.content?.trim() || "No content"}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Vitals: {vitalsSummary(selected)}
            </p>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground"
              onClick={() => setAddOpen(false)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-semibold">Add note</h3>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Input value={content} onChange={(e) => setContent(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isPending || !title.trim()}
                  className="bg-amber-600 text-white hover:bg-amber-700"
                  onClick={submitNote}
                >
                  {isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
