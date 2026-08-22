import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTreatmentById } from "@/lib/actions/treatments";
import { listNotesForTreatment } from "@/lib/actions/patient-notes";
import { getPatientDepositBalance } from "@/lib/actions/deposits";
import { summarizeTreatment } from "@/lib/utils/treatment-summary";
import { getDoctorsForSelect } from "@/lib/actions/users";
import { requireAuth } from "@/lib/session";
import { canWriteTreatments } from "@/lib/permissions";
import { TreatmentDetailClient } from "@/components/admin/treatment-detail-client";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const treatment = await getTreatmentById(id);
  return {
    title: treatment
      ? `Treatment Detail - ${treatment.patient.fullName}`
      : "Treatment Detail",
  };
}

export default async function TreatmentDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const [treatment, doctors, session, linkedNotes] = await Promise.all([
    getTreatmentById(id),
    getDoctorsForSelect(),
    requireAuth(),
    listNotesForTreatment(id),
  ]);

  if (!treatment) notFound();

  const depositBalance = await getPatientDepositBalance(treatment.patient.id);
  const summary = {
    ...summarizeTreatment(treatment),
    depositBalance,
  };
  const paymentsWithBalance = summary.paymentsWithBalance;
  const paymentBalanceMap = new Map(
    paymentsWithBalance.map((p) => [p.id, p.balanceAfter])
  );

  const canWrite = canWriteTreatments(session.user.role);
  const backHref =
    from === "treatments"
      ? "/dashboard/treatments"
      : `/dashboard/patients/${treatment.patient.id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={backHref} />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            Treatment Detail – {treatment.patient.fullName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Patient ID: {treatment.patient.patientNumber}
            {treatment.shortId ? ` · ${treatment.shortId}` : ""}
          </p>
        </div>
      </div>

      <TreatmentDetailClient
        canWrite={canWrite}
        from={from}
        doctors={doctors}
        summary={summary}
        linkedNotes={linkedNotes}
        treatment={{
          id: treatment.id,
          shortId: treatment.shortId,
          treatmentDate: treatment.treatmentDate,
          endDate: treatment.endDate,
          diagnosis: treatment.diagnosis,
          notes: treatment.notes,
          status: treatment.status,
          patient: treatment.patient,
          visit: treatment.visit,
          doctor: treatment.doctor,
          charges: treatment.charges.map((c) => {
            const paidAmount = (c.allocations ?? []).reduce(
              (sum, a) => sum + Number(a.amount),
              0
            );
            return {
              id: c.id,
              shortId: c.shortId,
              categoryLabel: c.lines.map((l) => l.serviceCategory).join(", ") || "—",
              totalPrice: Number(c.totalPrice),
              discount: Number(c.discount),
              depositApplied: Number(c.depositApplied ?? 0),
              netPrice: Number(c.netPrice),
              isAgentRelated: c.isAgentRelated,
              isPaid: paidAmount >= Number(c.netPrice) - 0.001,
              paidAmount,
              createdAt: c.createdAt.toISOString(),
              lines: c.lines.map((l) => ({
                id: l.id,
                serviceCategory: l.serviceCategory,
                notes: l.notes,
                quantity: l.quantity,
                unitPrice: Number(l.unitPrice),
              })),
            };
          }),
          payments: treatment.payments.map((p) => ({
            id: p.id,
            amount: Number(p.amount),
            method: p.method,
            paymentDate: p.paymentDate,
            createdAt: p.createdAt,
            reference: p.reference,
            notes: p.notes,
            recordedBy: p.recordedBy,
            balanceAfter: paymentBalanceMap.get(p.id) ?? 0,
            depositAppliedAmount: Number(p.depositAppliedAmount ?? 0),
            allocations: (p.allocations ?? []).map((a) => ({
              chargeId: a.chargeId,
              amount: Number(a.amount),
            })),
          })),
        }}
      />
    </div>
  );
}
