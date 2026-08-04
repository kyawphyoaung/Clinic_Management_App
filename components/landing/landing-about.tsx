import { LandingSection } from "@/components/landing/landing-section";
import { LANDING_ABOUT } from "@/lib/landing";

export function LandingAbout() {
  return (
    <LandingSection
      id="about"
      className="bg-[var(--landing-cream-deep)]"
      containerClassName="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16"
    >
      <div>
        <p className="text-xs font-medium tracking-[0.22em] text-[var(--landing-gold)] uppercase">
          Our Promise
        </p>
        <h2 className="font-serif mt-3 text-3xl font-medium text-[var(--landing-navy)] sm:text-4xl">
          {LANDING_ABOUT.heading}
        </h2>
      </div>
      <p className="max-w-2xl text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
        {LANDING_ABOUT.body}
      </p>
    </LandingSection>
  );
}
