"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import {
  createPatientNote,
  deletePatientNote,
  updatePatientNote,
} from "@/lib/actions/patient-notes";
import { formatStableTaiwanDateTime } from "@/lib/book-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type NotePin = {
  label: string;
  x: number;
  y: number;
  description: string;
};

type DiagramTab = "FULL_BODY" | "UROLOGY" | "NEUROLOGY";

const DIAGRAM_SRC: Record<string, string> = {
  FULL_BODY: "/images/body/fullBody.webp",
  FULL_BODY_FRONT: "/images/body/fullBody.webp",
  FULL_BODY_BACK: "/images/body/fullBody.webp",
  UROLOGY: "/images/body/male_female_urology.webp",
  NEUROLOGY: "/images/body/neurology.webp",
  BRAIN: "/images/body/neurology.webp",
};

function ageFromDob(dob: Date | string | null | undefined): number | null {
  if (!dob) return null;
  const d = typeof dob === "string" ? new Date(dob) : dob;
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
}

function parseBp(bp: string | null | undefined): [string, string] {
  if (!bp) return ["", ""];
  const [s, d] = bp.split("/");
  return [s?.trim() ?? "", d?.trim() ?? ""];
}

function nextPinLabel(pins: NotePin[]): string {
  return `Pin A${pins.length + 1}`;
}

function diagramTypeValue(tab: DiagramTab): string {
  return tab;
}

type PatientInfo = {
  id: string;
  fullName: string;
  dateOfBirth: Date | string;
  countryOfResidence?: string | null;
  nationality?: string | null;
};

type ExistingNote = {
  id: string;
  title: string;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  bloodPressure?: string | null;
  heartRate?: number | null;
  weight?: number | null;
  height?: number | null;
  bodyTemperature?: number | null;
  diagramType?: string | null;
  pins?: NotePin[] | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  createdBy?: { fullName: string } | null;
};

type Props = {
  treatmentId: string;
  patient: PatientInfo;
  doctorName: string;
  note?: ExistingNote | null;
  canWrite: boolean;
};

export function SoapNoteEditor({
  treatmentId,
  patient,
  doctorName,
  note,
  canWrite,
}: Props) {
  const router = useRouter();
  const isExisting = Boolean(note?.id);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initialDiagram = note?.diagramType ?? "FULL_BODY";
  const initialTab: DiagramTab = initialDiagram.startsWith("UROLOGY")
    ? "UROLOGY"
    : initialDiagram.startsWith("BRAIN") ||
        initialDiagram.startsWith("NEUROLOGY")
      ? "NEUROLOGY"
      : "FULL_BODY";

  const [title, setTitle] = useState(note?.title ?? "SOAP Note");
  const [tab, setTab] = useState<DiagramTab>(initialTab);
  const [pins, setPins] = useState<NotePin[]>(
    Array.isArray(note?.pins) ? note!.pins! : []
  );
  const [bpS, bpD] = parseBp(note?.bloodPressure);
  const [systolic, setSystolic] = useState(bpS);
  const [diastolic, setDiastolic] = useState(bpD);
  const [heartRate, setHeartRate] = useState(
    note?.heartRate != null ? String(note.heartRate) : ""
  );
  const [temperature, setTemperature] = useState(
    note?.bodyTemperature != null ? String(note.bodyTemperature) : ""
  );
  const [weight, setWeight] = useState(
    note?.weight != null ? String(note.weight) : ""
  );
  const [height, setHeight] = useState(
    note?.height != null ? String(note.height) : ""
  );
  const [subjective, setSubjective] = useState(note?.subjective ?? "");
  const [objective, setObjective] = useState(note?.objective ?? "");
  const [assessment, setAssessment] = useState(note?.assessment ?? "");
  const [plan, setPlan] = useState(note?.plan ?? "");

  const diagramKey = diagramTypeValue(tab);
  const diagramSrc = DIAGRAM_SRC[diagramKey];
  const age = ageFromDob(patient.dateOfBirth);
  const lastUpdated = note?.updatedAt ?? note?.createdAt ?? null;
  const displayDoctor = note?.createdBy?.fullName ?? doctorName;

  const dobLabel = useMemo(() => {
    const d =
      typeof patient.dateOfBirth === "string"
        ? new Date(patient.dateOfBirth)
        : patient.dateOfBirth;
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  }, [patient.dateOfBirth]);

  function onDiagramClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!canWrite) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setPins((prev) => [
      ...prev,
      {
        label: nextPinLabel(prev),
        x: Math.round(x * 1000) / 1000,
        y: Math.round(y * 1000) / 1000,
        description: "",
      },
    ]);
  }

  function updatePinDescription(index: number, description: string) {
    setPins((prev) =>
      prev.map((p, i) => (i === index ? { ...p, description } : p))
    );
  }

  function removePin(index: number) {
    setPins((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, label: `Pin A${i + 1}` }))
    );
  }

  function buildPayload() {
    return {
      patientId: patient.id,
      treatmentId,
      title: title.trim() || "SOAP Note",
      content: [subjective, objective, assessment, plan]
        .filter(Boolean)
        .join("\n\n"),
      subjective: subjective || null,
      objective: objective || null,
      assessment: assessment || null,
      plan: plan || null,
      bloodPressure:
        systolic.trim() || diastolic.trim()
          ? `${systolic.trim() || "0"}/${diastolic.trim() || "0"}`
          : null,
      heartRate: heartRate ? Number(heartRate) : null,
      bodyTemperature: temperature ? Number(temperature) : null,
      weight: weight ? Number(weight) : null,
      height: height ? Number(height) : null,
      diagramType: diagramKey,
      pins,
    };
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const payload = buildPayload();
      if (isExisting && note) {
        const result = await updatePatientNote({
          noteId: note.id,
          ...payload,
        });
        if (!result.success) {
          setError(result.error);
          return;
        }
        router.refresh();
        return;
      }
      const result = await createPatientNote(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.replace(`/dashboard/treatments/${treatmentId}/notes/${result.id}`);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!note?.id) return;
    if (!window.confirm("Delete this SOAP note?")) return;
    if (!window.confirm("Are you sure?")) return;
    startTransition(async () => {
      await deletePatientNote(note.id);
      router.push(`/dashboard/treatments/${treatmentId}`);
      router.refresh();
    });
  }

  const tabs: { id: DiagramTab; label: string }[] = [
    { id: "FULL_BODY", label: "Full Body" },
    { id: "UROLOGY", label: "Urology" },
    { id: "NEUROLOGY", label: "Neurology" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            Last updated{" "}
            {lastUpdated
              ? formatStableTaiwanDateTime(
                  typeof lastUpdated === "string"
                    ? lastUpdated
                    : new Date(lastUpdated).toISOString()
                )
              : "—"}
          </p>
          <p className="mt-1 text-base font-medium">{displayDoctor}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite && (
            <Button
              type="button"
              disabled={isPending}
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={handleSave}
            >
              {isPending ? "Saving…" : isExisting ? "Update" : "Save"}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="size-8" />
          </div>
          <div className="min-w-0 space-y-0.5 text-sm">
            <p className="text-lg font-semibold">{patient.fullName}</p>
            <p>
              DOB: {dobLabel}
              {age != null ? ` · Age ${age}` : ""}
            </p>
            <p>
              Country:{" "}
              {patient.countryOfResidence || patient.nationality || "—"}
            </p>
          </div>
          <div className="ml-auto w-full max-w-xs space-y-1.5 sm:w-auto">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={title}
              disabled={!canWrite}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Body diagram</CardTitle>
          <div className="flex flex-wrap gap-2 border-b border-border pb-2 pt-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="relative mx-auto max-w-xl cursor-crosshair select-none overflow-hidden rounded-md border border-border bg-slate-50"
            onClick={onDiagramClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={diagramSrc}
              alt={diagramKey}
              className="block w-full"
              draggable={false}
            />
            {pins.map((pin) => (
              <span
                key={pin.label}
                className="absolute -translate-x-1/2 -translate-y-full rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
                style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
                title={pin.description || pin.label}
              >
                {pin.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Click the diagram to place pins. Coordinates are saved relative to
            the image.
          </p>
          {pins.length > 0 && (
            <div className="space-y-3">
              {pins.map((pin, index) => (
                <div
                  key={pin.label}
                  className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-start"
                >
                  <div className="w-20 shrink-0 pt-2 text-sm font-medium">
                    {pin.label}
                  </div>
                  <Textarea
                    className="min-h-16 flex-1"
                    placeholder="Description…"
                    value={pin.description}
                    disabled={!canWrite}
                    onChange={(e) =>
                      updatePinDescription(index, e.target.value)
                    }
                  />
                  {canWrite && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removePin(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vital signs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>BP Systolic (mm Hg)</Label>
              <Input
                value={systolic}
                disabled={!canWrite}
                onChange={(e) => setSystolic(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>BP Diastolic (mm Hg)</Label>
              <Input
                value={diastolic}
                disabled={!canWrite}
                onChange={(e) => setDiastolic(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Heart Rate (bpm)</Label>
              <Input
                type="number"
                value={heartRate}
                disabled={!canWrite}
                onChange={(e) => setHeartRate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Body Temp (°C)</Label>
              <Input
                type="number"
                step="0.1"
                value={temperature}
                disabled={!canWrite}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={weight}
                disabled={!canWrite}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Height (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={height}
                disabled={!canWrite}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SOAP</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Subjective</Label>
            <Textarea
              className="min-h-24"
              value={subjective}
              disabled={!canWrite}
              onChange={(e) => setSubjective(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Objective</Label>
            <Textarea
              className="min-h-24"
              value={objective}
              disabled={!canWrite}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Assessment</Label>
            <Textarea
              className="min-h-24"
              value={assessment}
              disabled={!canWrite}
              onChange={(e) => setAssessment(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Textarea
              className="min-h-24"
              value={plan}
              disabled={!canWrite}
              onChange={(e) => setPlan(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {canWrite && (
          <Button
            type="button"
            disabled={isPending}
            className="bg-amber-600 text-white hover:bg-amber-700"
            onClick={handleSave}
          >
            {isPending ? "Saving…" : isExisting ? "Update" : "Save"}
          </Button>
        )}
        {canWrite && isExisting && (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
