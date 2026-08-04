import Image from "next/image";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingSection } from "@/components/landing/landing-section";
import { LANDING_DOCTORS } from "@/lib/landing";

export function LandingDoctors() {
  return (
    <LandingSection id="doctors" className="bg-[var(--landing-cream)]">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium tracking-[0.22em] text-[var(--landing-gold)] uppercase">
          Specialists
        </p>
        <h2 className="font-serif mt-3 text-3xl font-medium text-[var(--landing-navy)] sm:text-4xl">
          Meet Our Expert Doctors
        </h2>
        <p className="mt-3 text-[var(--landing-muted)]">
          World-class specialists dedicated to your care
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-2">
        {LANDING_DOCTORS.map((doctor) => (
          <article
            key={doctor.id}
            className="flex flex-col items-center border border-[var(--landing-navy)]/8 bg-white/70 px-6 py-10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-28px_rgba(15,15,26,0.45)]"
          >
            <div className="relative size-36 overflow-hidden rounded-full ring-2 ring-[var(--landing-gold)]/40 ring-offset-4 ring-offset-[var(--landing-cream)] sm:size-40">
              <Image
                src={doctor.image}
                alt={doctor.name}
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>
            <h3 className="font-serif mt-7 text-2xl font-medium text-[var(--landing-navy)]">
              {doctor.name}
            </h3>
            <p className="mt-2 text-xs font-medium tracking-[0.14em] text-[var(--landing-gold)] uppercase">
              {doctor.specialty}
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--landing-muted)]">
              {doctor.bio}
            </p>
            <LandingCta
              href={doctor.href}
              className="mt-7 px-5 py-2.5 text-sm tracking-wide"
            >
              Book Appointment
            </LandingCta>
          </article>
        ))}
      </div>
    </LandingSection>
  );
}
