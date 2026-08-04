import { LandingCta } from "@/components/landing/landing-cta";
import { LandingSection } from "@/components/landing/landing-section";
import { LANDING, LANDING_PARTNER } from "@/lib/landing";

export function LandingPartner() {
  return (
    <LandingSection className="bg-[var(--landing-navy)] text-[var(--landing-cream)]">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-medium tracking-[0.22em] text-[var(--landing-gold)] uppercase">
          Referral Network
        </p>
        <h2 className="font-serif mt-3 text-3xl font-medium sm:text-4xl">
          {LANDING_PARTNER.heading}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[var(--landing-cream)]/75 sm:text-lg">
          {LANDING_PARTNER.body}
        </p>
        <div className="mt-9">
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
