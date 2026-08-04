import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPartnerSessionAgentId } from "@/lib/partner-session";
import { getBillingDetailByBillingId } from "@/lib/actions/commission-admin";
import {
  BillingDetailView,
  derivePaymentStatus,
} from "@/components/admin/billing-detail-view";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ billingId: string }>;
};

export default async function PartnerBillingDetailPage({ params }: PageProps) {
  const agentId = await getPartnerSessionAgentId();
  if (!agentId) redirect("/partner/login");

  const { billingId: raw } = await params;
  const billingId = decodeURIComponent(raw);
  const data = await getBillingDetailByBillingId(billingId, {
    requireAuth: false,
    agentId,
  });
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
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/partner/dashboard" />}
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Button>
      <BillingDetailView
        billingId={data.billingId ?? billingId}
        agentName={data.agent.fullName}
        monthLabel={data.monthLabel}
        commissionPercent={data.commissionPercent}
        patientCount={data.patientCount}
        totalCharges={data.totalCharges}
        totalCommission={data.totalCommission}
        patients={patients}
        paymentStatus={derivePaymentStatus(data.reviewStatuses)}
        showAdminActions={false}
      />
    </div>
  );
}
