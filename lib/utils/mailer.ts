import { headers } from "next/headers";

export async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "REVIVORA <noreply@revivora.local>";

  if (!apiKey) {
    console.info("[mailer] Email not sent (no RESEND_API_KEY):", options.subject, options.to);
    console.info(options.text);
    return { sent: false as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      text: options.text,
    }),
  });

  if (!res.ok) {
    console.error("[mailer] Resend failed", await res.text());
    return { sent: false as const };
  }
  return { sent: true as const };
}

export async function clientIpAddress() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}
