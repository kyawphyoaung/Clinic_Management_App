"use server";

import { redirect } from "next/navigation";
import { clearPartnerSession, setPartnerSession } from "@/lib/partner-session";
import { verifyPartnerLogin } from "@/lib/actions/agents";

export async function loginPartner(formData: FormData) {
  const partnerId = String(formData.get("partner_id") ?? "").trim().toUpperCase();
  const password = String(formData.get("password") ?? "");
  const agent = await verifyPartnerLogin(partnerId, password);
  if (!agent) {
    return { success: false as const, error: "Invalid partner ID or password" };
  }

  await setPartnerSession(agent.id);
  redirect("/partner/dashboard");
}

export async function logoutPartner() {
  await clearPartnerSession();
  redirect("/partner/login");
}
