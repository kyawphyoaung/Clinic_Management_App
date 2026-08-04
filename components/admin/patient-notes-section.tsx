"use client";

import { useState, useTransition } from "react";
import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPatientNote } from "@/lib/actions/patient-notes";
import { formatStableTaiwanDateTime } from "@/lib/book-i18n";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
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
  content: string | null;
  bloodPressure: string | null;
  heartRate: number | null;
  weight: number | null;
  height: number | null;
  bodyTemperature: number | null;
  createdAt: Date | string;
  createdBy: { fullName: string };
  appointment: { publicId: string } | null;
  treatment: { id: string; diagnosis: string | null } | null;
};

type Option = { id: string; label: string };

type Props = {
  patientId: string;
  notes: NoteRow[];
  appointments: Option[];
  treatments: Option[];
  canWrite: boolean;
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

export function PatientNotesSection({
  patientId,
  notes,
  appointments,
  treatments,
  canWrite,
}: Props) {
  const [open, setOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bodyTemperature, setBodyTemperature] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setTitle("");
    setContent("");
    setBloodPressure("");
    setHeartRate("");
    setWeight("");
    setHeight("");
    setBodyTemperature("");
    setAppointmentId("");
    setTreatmentId("");
    setVitalsOpen(false);
    setOpen(false);
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await createPatientNote({
        patientId,
        title,
        content: content || null,
        bloodPressure: bloodPressure || null,
        heartRate: heartRate ? Number(heartRate) : null,
        weight: weight ? Number(weight) : null,
        height: height ? Number(height) : null,
        bodyTemperature: bodyTemperature ? Number(bodyTemperature) : null,
        appointmentId: appointmentId || null,
        treatmentId: treatmentId || null,
      });
      setMessage(result.success ? "Note saved" : result.error);
      if (result.success) resetForm();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Notes</h2>
        {canWrite && (
          <Button
            type="button"
            size="sm"
            className="bg-amber-600 text-white hover:bg-amber-700"
            onClick={() => setOpen((v) => !v)}
          >
            <StickyNote className="size-4" />
            {open ? "Cancel" : "Add note"}
          </Button>
        )}
      </div>

      {open && canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New note</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Content</Label>
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Link appointment</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
              >
                <option value="">—</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Link treatment</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={treatmentId}
                onChange={(e) => setTreatmentId(e.target.value)}
              >
                <option value="">—</option>
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVitalsOpen((v) => !v)}
              >
                {vitalsOpen ? "Hide vitals" : "Add vitals"}
              </Button>
            </div>
            {vitalsOpen && (
              <>
                <div className="space-y-1.5">
                  <Label>Blood pressure</Label>
                  <Input
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    placeholder="120/80"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Heart rate</Label>
                  <Input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Body temperature (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={bodyTemperature}
                    onChange={(e) => setBodyTemperature(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <Button
                type="button"
                disabled={isPending || !title.trim()}
                onClick={submit}
              >
                {isPending ? "Saving…" : "Save note"}
              </Button>
              {message && (
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
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
                        No notes yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    notes.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell suppressHydrationWarning>
                          {formatStableTaiwanDateTime(
                            typeof n.createdAt === "string"
                              ? n.createdAt
                              : n.createdAt.toISOString()
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{n.title}</p>
                          {n.content && (
                            <p className="text-xs text-muted-foreground">
                              {n.content}
                            </p>
                          )}
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
                    No notes yet
                  </p>
                ) : (
                  notes.map((n) => (
                    <Card key={n.id} className="shadow-sm">
                      <CardContent className="space-y-2 p-4">
                        <p className="font-medium">{n.title}</p>
                        {n.content && (
                          <p className="text-sm text-muted-foreground">
                            {n.content}
                          </p>
                        )}
                        <MobileField label="Date">
                          <span suppressHydrationWarning>
                            {formatStableTaiwanDateTime(
                              typeof n.createdAt === "string"
                                ? n.createdAt
                                : n.createdAt.toISOString()
                            )}
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
    </div>
  );
}
