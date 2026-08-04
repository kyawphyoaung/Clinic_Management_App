import Image from "next/image";
import Link from "next/link";
import { LANDING, LANDING_NAV } from "@/lib/landing";

const FOOTER_LINKS = LANDING_NAV.filter((item) =>
  ["#home", "#treatments", "#contact"].includes(item.href)
);

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="contact"
      className="scroll-mt-24 bg-[var(--landing-footer)] text-[var(--landing-cream)]"
    >
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
            {LANDING.address}
          </p>
          <a
            href={LANDING.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs tracking-[0.14em] text-[var(--landing-gold)] uppercase transition-colors hover:text-[var(--landing-gold-soft)]"
          >
            Open in Google Maps →
          </a>
          <div className="mt-5 overflow-hidden border border-[var(--landing-gold)]/20">
            <iframe
              title="REVIVORA clinic location"
              src={LANDING.mapsEmbed}
              className="h-40 w-full grayscale-[20%] contrast-110"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
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
