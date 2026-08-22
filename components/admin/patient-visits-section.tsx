"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
  createVisit,
  deleteVisit,
  getVisitDeleteImpact,
  updateVisit,
} from "@/lib/actions/visits";
import { TreatmentCreateModal } from "@/components/admin/treatment-create-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { formatMoney } from "@/lib/utils/money";

type VisitRow = {
  id: string;
  displayId: string;
  visitDate: Date;
  visitType: string;
  source: string;
  clinic: { id: string; code: string; name: string };
  agent: { id: string; fullName: string; partnerId: string | null } | null;
  treatments: { id: string; shortId: string }[];
  appointment?: {
    id: string;
    publicId: string;
    startsAt: Date;
    status: string;
  } | null;
  _count: { treatments: number };
};

type PatientTreatmentOption = {
  id: string;
  shortId: string;
  visitId?: string;
};

const VISIT_TYPE_LABEL: Record<string, string> = {
  FIRST_VISIT: "First Visit",
  REVISIT: "Revisit",
  FOLLOW_UP: "Follow-up",
};

const SOURCE_LABEL: Record<string, string> = {
  AGENT_REFERRAL: "Agent Referral",
  WALKIN: "Walk-in",
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function PatientVisitsSection({
  patientId,
  visits,
  clinics,
  agents,
  doctors,
  patientTreatments = [],
  canWrite,
}: {
  patientId: string;
  visits: VisitRow[];
  clinics: { id: string; code: string; name: string }[];
  agents: { id: string; fullName: string; partnerId: string | null }[];
  doctors: { id: string; fullName: string }[];
  patientTreatments?: PatientTreatmentOption[];
  canWrite: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"AGENT_REFERRAL" | "WALKIN">("WALKIN");
  const [editingVisit, setEditingVisit] = useState<VisitRow | null>(null);
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createVisit({
        patientId,
        clinicId: String(form.get("clinicId") ?? ""),
        visitDate: String(form.get("visitDate") ?? todayString()),
        visitType: String(form.get("visitType") ?? "REVISIT") as
          | "FIRST_VISIT"
          | "REVISIT"
          | "FOLLOW_UP",
        source,
        agentId:
          source === "AGENT_REFERRAL"
            ? String(form.get("agentId") ?? "") || null
            : null,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingVisit) return;
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateVisit({
        visitId: editingVisit.id,
        clinicId: String(form.get("clinicId") ?? ""),
        visitDate: String(form.get("visitDate") ?? todayString()),
        visitType: String(form.get("visitType") ?? "REVISIT") as
          | "FIRST_VISIT"
          | "REVISIT"
          | "FOLLOW_UP",
        source,
        agentId:
          source === "AGENT_REFERRAL"
            ? String(form.get("agentId") ?? "") || null
            : null,
        treatmentIds: selectedTreatmentIds,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setEditingVisit(null);
    });
  }

  function openEdit(visit: VisitRow) {
    setEditingVisit(visit);
    setSource(visit.source as "AGENT_REFERRAL" | "WALKIN");
    setSelectedTreatmentIds(visit.treatments.map((t) => t.id));
  }

  function confirmDelete(visit: VisitRow) {
    startTransition(async () => {
      const impact = await getVisitDeleteImpact(visit.id);
      const lines: string[] = [
        `Delete visit ${visit.displayId}?`,
        "",
        "This will also remove linked treatments, charges, and payments:",
      ];
      if (!impact || impact.treatments.length === 0) {
        lines.push("- No linked treatments");
      } else {
        for (const t of impact.treatments) {
          lines.push(
            `- ${t.shortId}${t.diagnosis ? ` (${t.diagnosis})` : ""}: ${t.chargeCount} charge(s), ${t.paymentCount} payment(s)`
          );
          for (const c of t.charges) {
            lines.push(`    · Charge ${c.shortId}: ${formatMoney(c.netPrice)}`);
          }
          for (const p of t.payments) {
            lines.push(`    · Payment ${p.paymentDate}: ${formatMoney(p.amount)}`);
          }
        }
      }
      if (!window.confirm(lines.join("\n"))) return;
      const result = await deleteVisit(visit.id);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Visits</h2>
        {canWrite && (
          <Button type="button" onClick={() => setOpen(true)}>
            New Visit
          </Button>
        )}
      </div>
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Visit history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visit ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead>Treatments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No visits yet
                  </TableCell>
                </TableRow>
              ) : (
                visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-mono text-xs">{visit.displayId}</TableCell>
                    <TableCell>{visit.visitDate.toLocaleDateString()}</TableCell>
                    <TableCell>
                      {VISIT_TYPE_LABEL[visit.visitType] ?? visit.visitType}
                    </TableCell>
                    <TableCell>{SOURCE_LABEL[visit.source] ?? visit.source}</TableCell>
                    <TableCell>
                      {visit.clinic.code} · {visit.clinic.name}
                    </TableCell>
                    <TableCell>
                      {visit.agent
                        ? `${visit.agent.fullName}${
                            visit.agent.partnerId ? ` (${visit.agent.partnerId})` : ""
                          }`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {visit.appointment ? (
                        <span className="text-xs">
                          {visit.appointment.publicId}
                          <span className="text-muted-foreground">
                            {" "}
                            · {visit.appointment.status}
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {visit.treatments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {visit.treatments.map((t) => (
                            <Button
                              key={t.id}
                              variant="outline"
                              size="sm"
                              render={
                                <Link href={`/dashboard/treatments/${t.id}?from=patient`} />
                              }
                            >
                              {t.shortId}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {visit.treatments.length === 0 && canWrite && (
                          <TreatmentCreateModal
                            patientId={patientId}
                            doctors={doctors}
                            visits={[
                              {
                                id: visit.id,
                                displayId: visit.displayId,
                                visitDate: visit.visitDate.toISOString().slice(0, 10),
                              },
                            ]}
                            initialVisitId={visit.id}
                          />
                        )}
                        {canWrite && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(visit)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => confirmDelete(visit)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-semibold">Create Visit</h3>
            <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="visitDate">Visit Date</Label>
                <Input
                  id="visitDate"
                  name="visitDate"
                  type="date"
                  defaultValue={todayString()}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clinicId">Clinic</Label>
                <Select id="clinicId" name="clinicId" required defaultValue={clinics[0]?.id ?? ""}>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visitType">Visit Type</Label>
                <Select id="visitType" name="visitType" defaultValue="REVISIT">
                  <option value="FIRST_VISIT">First Visit</option>
                  <option value="REVISIT">Revisit</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="source">Source</Label>
                <Select
                  id="source"
                  name="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value as "AGENT_REFERRAL" | "WALKIN")}
                >
                  <option value="WALKIN">Walk-in</option>
                  <option value="AGENT_REFERRAL">Agent Referral</option>
                </Select>
              </div>
              {source === "AGENT_REFERRAL" && (
                <div className="space-y-1.5">
                  <Label htmlFor="agentId">Agent</Label>
                  <Select id="agentId" name="agentId" required>
                    <option value="">Select agent</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} {a.partnerId ? `(${a.partnerId})` : ""}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {error && (
                <Alert className="border-destructive/50">
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  Create Visit
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              onClick={() => setEditingVisit(null)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-semibold">Update Visit</h3>
            <form className="mt-4 grid gap-3" onSubmit={handleUpdate}>
              <div className="space-y-1.5">
                <Label htmlFor="visitDateEdit">Visit Date</Label>
                <Input
                  id="visitDateEdit"
                  name="visitDate"
                  type="date"
                  defaultValue={editingVisit.visitDate.toISOString().slice(0, 10)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clinicIdEdit">Clinic</Label>
                <Select
                  id="clinicIdEdit"
                  name="clinicId"
                  required
                  defaultValue={editingVisit.clinic.id}
                >
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visitTypeEdit">Visit Type</Label>
                <Select
                  id="visitTypeEdit"
                  name="visitType"
                  defaultValue={editingVisit.visitType}
                >
                  <option value="FIRST_VISIT">First Visit</option>
                  <option value="REVISIT">Revisit</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sourceEdit">Source</Label>
                <Select
                  id="sourceEdit"
                  name="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value as "AGENT_REFERRAL" | "WALKIN")}
                >
                  <option value="WALKIN">Walk-in</option>
                  <option value="AGENT_REFERRAL">Agent Referral</option>
                </Select>
              </div>
              {(source === "AGENT_REFERRAL" || editingVisit.agent) && (
                <div className="space-y-1.5">
                  <Label htmlFor="agentIdEdit">Agent</Label>
                  <Select
                    id="agentIdEdit"
                    name="agentId"
                    required={source === "AGENT_REFERRAL"}
                    defaultValue={editingVisit.agent?.id ?? ""}
                  >
                    <option value="">Select agent</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} {a.partnerId ? `(${a.partnerId})` : ""}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Linked Treatments</Label>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                  {patientTreatments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No treatments available</p>
                  ) : (
                    patientTreatments.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={selectedTreatmentIds.includes(t.id)}
                          onChange={() => {
                            setSelectedTreatmentIds((prev) =>
                              prev.includes(t.id)
                                ? prev.filter((id) => id !== t.id)
                                : [...prev, t.id]
                            );
                          }}
                        />
                        <span>{t.shortId}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              {error && (
                <Alert className="border-destructive/50">
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  Update Visit
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingVisit(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
