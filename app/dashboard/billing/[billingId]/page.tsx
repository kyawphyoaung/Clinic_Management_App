import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBillingDetailByBillingId } from "@/lib/actions/commission-admin";
import {
  BillingDetailView,
  derivePaymentStatus,
} from "@/components/admin/billing-detail-view";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ billingId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { billingId } = await params;
  return { title: `Billing ${decodeURIComponent(billingId)}` };
}

export default async function AdminBillingDetailPage({ params }: PageProps) {
  const { billingId: raw } = await params;
  const billingId = decodeURIComponent(raw);
  const data = await getBillingDetailByBillingId(billingId);
  if (!data) notFound();

  const patients = data.patients.map((p) => ({
    patient: p.patient,
    totalCharges: p.totalCharges,
    totalCommission: p.totalCommission,
    treatments: p.treatments.map((t) => ({
      treatmentId: t.treatmentId,
      diagnosis: t.diagnosis,
      treatmentDate: t.treatmentDate.toISOString(),
      endDate: t.endDate?.toISOString() ?? null,
      status: t.status,
      reviewStatus: t.reviewStatus,
      commissionAmount: t.commissionAmount,
      totalCharges: t.totalCharges,
      charges: t.charges,
    })),
  }));

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/dashboard/agent_billing" />}
      >
        <ArrowLeft className="size-4" />
        Back to Agent Billing
      </Button>
      <BillingDetailView
        billingId={data.billingId ?? billingId}
        agentId={data.agent.id}
        periodMonth={data.periodMonth}
        agentName={data.agent.fullName}
        monthLabel={data.monthLabel}
        commissionPercent={data.commissionPercent}
        patientCount={data.patientCount}
        totalCharges={data.totalCharges}
        totalCommission={data.totalCommission}
        patients={patients}
        paymentStatus={derivePaymentStatus(data.reviewStatuses)}
        showAdminActions
      />
    </div>
  );
}
