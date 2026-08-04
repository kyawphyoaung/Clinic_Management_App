import { cookies } from "next/headers";

const PARTNER_COOKIE = "partner_agent_id";

export async function setPartnerSession(agentId: string) {
  const store = await cookies();
  store.set(PARTNER_COOKIE, agentId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearPartnerSession() {
  const store = await cookies();
  store.delete(PARTNER_COOKIE);
}

export async function getPartnerSessionAgentId() {
  const store = await cookies();
  return store.get(PARTNER_COOKIE)?.value ?? null;
}
