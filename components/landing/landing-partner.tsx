import { Building2, MapPin, Phone } from "lucide-react";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingSection } from "@/components/landing/landing-section";
import {
  LANDING,
  LANDING_PARTNER,
  LANDING_PARTNER_CLINICS,
} from "@/lib/landing";

function ComingSoonCard() {
  return (
    <article
      aria-hidden
      className="hidden min-h-[28rem] flex-col items-center justify-center border border-dashed border-[var(--landing-navy)]/15 bg-white/40 px-6 py-10 text-center opacity-55 md:flex"
    >
      <Building2 className="size-10 text-[var(--landing-muted)]" />
      <p className="font-serif mt-5 text-2xl font-medium text-[var(--landing-navy)]">
        {LANDING_PARTNER.comingSoon}
      </p>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--landing-muted)]">
        {LANDING_PARTNER.comingSoonBody}
      </p>
    </article>
  );
}

export function LandingPartner() {
  const clinic = LANDING_PARTNER_CLINICS[0];

  return (
    <LandingSection id="partners" className="bg-[var(--landing-cream)]">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium tracking-[0.22em] text-[var(--landing-gold)] uppercase">
          Network
        </p>
        <h2 className="font-serif mt-3 text-3xl font-medium text-[var(--landing-navy)] sm:text-4xl">
          {LANDING_PARTNER.heading}
        </h2>
        <p className="mt-3 text-[var(--landing-muted)]">{LANDING_PARTNER.body}</p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3 md:items-stretch">
        <ComingSoonCard />

        <article className="flex flex-col border border-[var(--landing-navy)]/8 bg-white/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-28px_rgba(15,15,26,0.45)]">
          <div className="overflow-hidden border-b border-[var(--landing-navy)]/8">
            <iframe
              title={`${clinic.nameEn} location`}
              src={clinic.mapsEmbed}
              className="h-48 w-full"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          <div className="flex flex-1 flex-col px-6 py-7">
            <h3 className="font-serif text-2xl font-medium text-[var(--landing-navy)]">
              {clinic.nameZh}
            </h3>
            <p className="mt-1 text-xs font-medium tracking-[0.16em] text-[var(--landing-gold)] uppercase">
              {clinic.nameEn}
            </p>

            <p className="mt-5 flex gap-2 text-sm leading-relaxed text-[var(--landing-muted)]">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--landing-gold)]" />
              <span>{clinic.address}</span>
            </p>
            <a
              href={`tel:${clinic.phone}`}
              className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--landing-navy)] transition-colors hover:text-[var(--landing-gold)]"
            >
              <Phone className="size-4 text-[var(--landing-gold)]" />
              {clinic.phone}
            </a>

            <div className="mt-auto pt-7">
              <LandingCta
                href={clinic.website}
                variant="outline-dark"
                className="w-full uppercase tracking-[0.12em]"
              >
                Visit Website
              </LandingCta>
            </div>
          </div>
        </article>

        <ComingSoonCard />
      </div>

      <div className="mt-12 border border-[var(--landing-navy)]/8 bg-[var(--landing-cream-deep)] px-6 py-8 text-center sm:px-10">
        <p className="font-serif text-2xl text-[var(--landing-navy)]">
          Want to join our referral network?
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--landing-muted)]">
          Partner with REVIVORA and help patients access coordinated specialist
          care in Taiwan.
        </p>
        <div className="mt-6">
          <LandingCta
            href={LANDING.partnerRegisterHref}
            className="uppercase tracking-[0.14em]"
          >
            {LANDING_PARTNER.cta}
          </LandingCta>
        </div>
      </div>
    </LandingSection>
  );
}
