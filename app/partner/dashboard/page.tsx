import { redirect } from "next/navigation";
import { getPartnerSessionAgentId } from "@/lib/partner-session";
import { getPartnerDashboard } from "@/lib/actions/agents";
import { PartnerDashboardClient } from "@/components/registration/partner-dashboard-client";

export default async function PartnerDashboardPage() {
  const agentId = await getPartnerSessionAgentId();
  if (!agentId) redirect("/partner/login");

  const agent = await getPartnerDashboard(agentId);
  if (!agent) redirect("/partner/login");

  return (
    <PartnerDashboardClient
      agent={{
        id: agent.id,
        fullName: agent.fullName,
        partnerId: agent.partnerId,
        companyName: agent.companyName,
        commissionPercent: agent.commissionPercent ?? 10,
      }}
      patients={agent.patients.map((p) => ({
        id: p.id,
        displayId: p.displayId,
        fullName: p.fullName,
        preferredName: p.preferredName,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        treatments: p.treatments.map((t) => ({
          id: t.id,
          status: t.status,
          diagnosis: t.diagnosis,
        })),
      }))}
      commissions={agent.commissionPayments.map((c) => ({
        id: c.id,
        patientId: c.patientId,
        amount: Number(c.amount),
        reviewStatus: c.reviewStatus,
        paidAt: c.paidAt?.toISOString() ?? null,
        endDate: c.treatment.endDate?.toISOString() ?? null,
      }))}
    />
  );
}
