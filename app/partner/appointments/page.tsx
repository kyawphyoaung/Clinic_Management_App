import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPartnerSessionAgentId } from "@/lib/partner-session";

export const metadata: Metadata = {
  title: "Partner Appointments",
};

/** Temporarily disabled — agents cannot book appointments in Phase 602. */
export default async function PartnerAppointmentsPage() {
  const agentId = await getPartnerSessionAgentId();
  if (!agentId) redirect("/partner/login");
  redirect("/partner/dashboard");
}
