import Image from "next/image";
import { LandingCta } from "@/components/landing/landing-cta";
import { LANDING, LANDING_HERO } from "@/lib/landing";

export function LandingHero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[88vh] items-end overflow-hidden sm:min-h-[92vh] sm:items-center"
    >
      <Image
        src="/images/hero-banner.webp"
        alt=""
        fill
        priority
        className="object-cover object-[75%_center] sm:object-center"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[var(--landing-navy)]/80 via-[var(--landing-navy)]/55 to-[var(--landing-navy)]/25"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[var(--landing-navy)]/70 via-transparent to-[var(--landing-navy)]/20"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-32">
        <p className="landing-fade-up text-xs font-medium tracking-[0.28em] text-[var(--landing-gold)] uppercase">
          {LANDING.brand}
        </p>
        <h1 className="landing-fade-up-delay font-serif mt-4 max-w-3xl text-4xl leading-[1.1] font-medium text-[var(--landing-cream)] sm:text-5xl lg:text-6xl">
          {LANDING_HERO.headline}
        </h1>
        <p className="landing-fade-up-delay-2 mt-5 max-w-xl text-base leading-relaxed text-[var(--landing-cream)]/85 sm:text-lg">
          {LANDING_HERO.subheadline}
        </p>
        <div className="landing-fade-up-delay-2 mt-9">
          <LandingCta
            href={LANDING.registerHref}
            className="text-sm tracking-wide"
          >
            {LANDING_HERO.cta}
          </LandingCta>
        </div>
      </div>
    </section>
  );
}
