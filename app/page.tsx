import type { Metadata } from "next";
import { LandingAbout } from "@/components/landing/landing-about";
import { LandingContact } from "@/components/landing/landing-contact";
import { LandingDoctors } from "@/components/landing/landing-doctors";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPartner } from "@/components/landing/landing-partner";
import { LandingTreatments } from "@/components/landing/landing-treatments";
import { LANDING } from "@/lib/landing";

export const metadata: Metadata = {
  title: {
    absolute: `${LANDING.brand} — Expert Medical Care in Taipei`,
  },
  description:
    "Your trusted partner for Men's Health, Aesthetics, and Wellness in the heart of Taipei.",
};

export default function HomePage() {
  return (
    <div className="landing flex min-h-full flex-1 flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingTreatments />
        <LandingAbout />
        <LandingDoctors />
        <LandingPartner />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  );
}
