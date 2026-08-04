import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCommissionReviewData } from "@/lib/actions/commission-admin";
import { CommissionReviewClient } from "@/components/admin/commission-review-client";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Commission Review",
};

type PageProps = {
  searchParams: Promise<{ agentId?: string; month?: string }>;
};

export default async function CommissionReviewPage({ searchParams }: PageProps) {
  const { agentId, month } = await searchParams;
  if (!agentId || !month || !/^\d{4}-\d{2}$/.test(month)) {
    notFound();
  }

  const data = await getCommissionReviewData(agentId, month);
  if (!data) notFound();

  const patients = data.patients.map((p) => ({
    patient: p.patient,
    totalCharges: p.totalCharges,
    totalCommission: p.totalCommission,
    treatments: p.treatments.map((t) => ({
      ...t,
      treatmentDate: t.treatmentDate.toISOString(),
      endDate: t.endDate?.toISOString() ?? null,
    })),
  }));

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/dashboard/agents/${agentId}`} />}
      >
        <ArrowLeft className="size-4" />
        Back to Agent
      </Button>
      <CommissionReviewClient
        agentId={data.agent.id}
        agentName={data.agent.fullName}
        periodMonth={data.periodMonth}
        monthLabel={data.monthLabel}
        patients={patients}
        totalCommission={data.totalCommission}
        totalCharges={data.totalCharges}
        commissionPercent={data.agent.commissionPercent ?? 10}
        pendingCount={data.pendingCount}
      />
    </div>
  );
}
