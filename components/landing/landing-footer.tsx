import Image from "next/image";
import Link from "next/link";
import { LandingContactIcon } from "@/components/landing/landing-contact-icons";
import { LANDING, LANDING_NAV } from "@/lib/landing";
import type { LandingContactChannel } from "@/lib/landing";

const FOOTER_LINKS = LANDING_NAV.filter((item) =>
  ["#home", "#treatments", "#contact"].includes(item.href)
);

const MESSAGING_CHANNELS: {
  id: LandingContactChannel["id"];
  label: string;
  href: string;
}[] = [
  { id: "line", label: "LINE", href: "https://line.me/ti/p/pBFzTGejr5" },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: "https://wa.me/qr/MC2O4KUZ6VWKO1",
  },
  {
    id: "viber",
    label: "Viber",
    href: "viber://chat?number=%2B886966906232",
  },
  {
    id: "telegram",
    label: "Telegram",
    href: "https://t.me/revivora",
  },
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--landing-footer)] text-[var(--landing-cream)]">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-3 lg:gap-10 lg:py-16">
        <div>
          <div className="relative mb-5 h-9 w-[140px]">
            <Image
              src="/images/main_logo.svg"
              alt={LANDING.brand}
              fill
              className="object-contain object-left brightness-110"
            />
          </div>
          <p className="font-serif text-xl text-[var(--landing-gold-soft)]">
            {LANDING.brand}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--landing-cream)]/70">
            An online medical platform connecting patients with trusted care in
            Taipei.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-medium tracking-[0.2em] text-[var(--landing-gold)] uppercase">
            Contact
          </h3>
          <a
            href={`mailto:${LANDING.email}`}
            className="mt-4 block text-sm text-[var(--landing-cream)]/85 transition-colors hover:text-[var(--landing-gold-soft)]"
          >
            {LANDING.email}
          </a>

          <p className="mt-7 text-xs font-medium tracking-[0.16em] text-[var(--landing-cream)]/50 uppercase">
            Messaging channels
          </p>
          <ul className="mt-3 space-y-2.5">
            {MESSAGING_CHANNELS.map((channel) => (
              <li key={channel.id}>
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-sm text-[var(--landing-cream)]/80 underline decoration-transparent underline-offset-4 transition-colors hover:text-[var(--landing-gold-soft)] hover:decoration-[var(--landing-gold)]/70"
                >
                  <LandingContactIcon
                    id={channel.id}
                    className="size-4 shrink-0 text-[var(--landing-gold)]"
                  />
                  <span>{channel.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-medium tracking-[0.2em] text-[var(--landing-gold)] uppercase">
            Quick Links
          </h3>
          <ul className="mt-4 space-y-3">
            {FOOTER_LINKS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm text-[var(--landing-cream)]/75 transition-colors hover:text-[var(--landing-gold-soft)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#partners"
                className="text-sm text-[var(--landing-cream)]/75 transition-colors hover:text-[var(--landing-gold-soft)]"
              >
                Partner Clinics
              </a>
            </li>
            <li>
              <Link
                href={LANDING.registerHref}
                className="text-sm text-[var(--landing-cream)]/75 transition-colors hover:text-[var(--landing-gold-soft)]"
              >
                Register Now
              </Link>
            </li>
            <li>
              <Link
                href={LANDING.partnerRegisterHref}
                className="text-sm text-[var(--landing-cream)]/75 transition-colors hover:text-[var(--landing-gold-soft)]"
              >
                Partner with Us
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-5 py-5 text-center text-xs text-[var(--landing-cream)]/45 sm:px-8 sm:text-left">
          © {year} {LANDING.brand}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
