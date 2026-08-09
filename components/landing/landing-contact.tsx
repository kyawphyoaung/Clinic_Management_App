import QRCode from "qrcode";
import { Mail } from "lucide-react";
import { LandingContactIcon } from "@/components/landing/landing-contact-icons";
import { LandingCopyButton } from "@/components/landing/landing-copy-button";
import { LandingSection } from "@/components/landing/landing-section";
import {
  LANDING,
  LANDING_CONTACT,
  LANDING_CONTACTS,
  type LandingContactChannel,
} from "@/lib/landing";

async function toQrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    width: 160,
    margin: 1,
    color: { dark: "#0f0f1a", light: "#ffffff" },
  });
}

function ContactValue({ channel }: { channel: LandingContactChannel }) {
  if (channel.action === "link" && channel.href) {
    return (
      <a
        href={channel.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 text-sm font-medium text-[var(--landing-navy)] underline decoration-[var(--landing-gold)]/50 underline-offset-4 transition-colors hover:text-[var(--landing-gold)] hover:decoration-[var(--landing-gold)]"
      >
        Open {channel.label}
      </a>
    );
  }

  if (channel.displayValue) {
    return (
      <div className="mt-3">
        <LandingCopyButton
          value={channel.displayValue}
          className="justify-center text-[var(--landing-navy)] hover:text-[var(--landing-gold)]"
        />
      </div>
    );
  }

  return null;
}

export async function LandingContact() {
  const contactQrCodes = await Promise.all(
    LANDING_CONTACTS.map(async (channel) => ({
      ...channel,
      qrDataUrl: await toQrDataUrl(channel.qrValue),
    }))
  );

  return (
    <LandingSection
      id="contact"
      className="bg-[var(--landing-cream-deep)]"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium tracking-[0.22em] text-[var(--landing-gold)] uppercase">
          Get in touch
        </p>
        <h2 className="font-serif mt-3 text-3xl font-medium text-[var(--landing-navy)] sm:text-4xl">
          {LANDING_CONTACT.heading}
        </h2>
        <p className="mt-3 text-base text-[var(--landing-muted)] sm:text-lg">
          {LANDING_CONTACT.subheading}
        </p>
        <a
          href={`mailto:${LANDING.email}`}
          className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--landing-navy)] transition-colors hover:text-[var(--landing-gold)]"
        >
          <Mail className="size-4 text-[var(--landing-gold)]" />
          {LANDING.email}
        </a>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {contactQrCodes.map((channel) => (
          <article
            key={channel.id}
            className="flex flex-col items-center border border-[var(--landing-gold)]/25 bg-[color-mix(in_srgb,var(--landing-gold-soft)_22%,var(--landing-cream))] px-5 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[var(--landing-gold)]/50 hover:shadow-[0_20px_40px_-28px_rgba(15,15,26,0.45)]"
          >
            <div className="flex items-center gap-2 text-[var(--landing-navy)]">
              <LandingContactIcon
                id={channel.id}
                className="size-5 text-[var(--landing-gold)]"
              />
              <h3 className="text-xs font-medium tracking-[0.18em] uppercase">
                {channel.label}
              </h3>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element -- data-URL QR from qrcode */}
            <img
              src={channel.qrDataUrl}
              alt={`${channel.label} QR code`}
              width={128}
              height={128}
              className="mt-5 size-32 border border-[var(--landing-navy)]/8 bg-white p-2"
            />

            <ContactValue channel={channel} />
          </article>
        ))}
      </div>
    </LandingSection>
  );
}
