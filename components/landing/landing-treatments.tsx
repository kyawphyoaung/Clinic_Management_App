import Link from "next/link";
import { LandingSection } from "@/components/landing/landing-section";
import { LANDING_TREATMENTS } from "@/lib/landing";

function TreatmentIcon({ id }: { id: string }) {
  const common = "size-7 stroke-[1.5]";
  if (id === "mens-health") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
        <path
          d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z"
          stroke="currentColor"
        />
      </svg>
    );
  }
  if (id === "aesthetic") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
        <path
          d="M12 3 14.5 9.5 21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"
          stroke="currentColor"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" />
    </svg>
  );
}

export function LandingTreatments() {
  return (
    <LandingSection id="treatments" className="bg-[var(--landing-cream)]">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium tracking-[0.22em] text-[var(--landing-gold)] uppercase">
          Care Pathways
        </p>
        <h2 className="font-serif mt-3 text-3xl font-medium text-[var(--landing-navy)] sm:text-4xl">
          Our Treatments
        </h2>
        <p className="mt-3 text-[var(--landing-muted)]">
          Comprehensive care tailored to your needs
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_TREATMENTS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex flex-col border border-[var(--landing-navy)]/8 bg-white/70 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--landing-gold)]/50 hover:shadow-[0_20px_40px_-28px_rgba(15,15,26,0.45)]"
          >
            <span className="inline-flex size-12 items-center justify-center bg-[var(--landing-navy)] text-[var(--landing-gold)] transition-colors group-hover:bg-[var(--landing-gold)] group-hover:text-[var(--landing-navy)]">
              <TreatmentIcon id={item.id} />
            </span>
            <h3 className="font-serif mt-6 text-xl font-medium text-[var(--landing-navy)]">
              {item.title}
            </h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--landing-muted)]">
              {item.description}
            </p>
            <span className="mt-6 text-sm font-medium tracking-wide text-[var(--landing-gold)]">
              Register Now →
            </span>
          </Link>
        ))}
      </div>
    </LandingSection>
  );
}
