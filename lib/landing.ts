import { CLINIC } from "@/lib/book-i18n";

export const LANDING = {
  brand: "REVIVORA",
  tagline: "Medical Care in the Heart of Taipei",
  address: CLINIC.address,
  email: CLINIC.email,
  mapsUrl: CLINIC.mapsUrl,
  mapsEmbed: CLINIC.mapsEmbed,
  registerHref: "/register",
  bookHref: "/book",
  partnerRegisterHref: "/partner/register",
} as const;

export const LANDING_NAV = [
  { label: "Home", href: "#home" },
  { label: "Treatments", href: "#treatments" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

export const LANDING_HERO = {
  headline: "Expert Medical Care in the Heart of Taipei",
  subheadline:
    "Your trusted partner for Men's Health, Aesthetics, and Wellness",
  cta: "Register Now",
} as const;

export const LANDING_TREATMENTS = [
  {
    id: "mens-health",
    title: "Men's Health & Urology",
    description:
      "Expert care for erectile dysfunction, testosterone therapy, and prostate health.",
    href: "/register",
  },
  {
    id: "aesthetic",
    title: "Aesthetic & Anti-Aging",
    description:
      "Advanced treatments for hair restoration, skin tightening, and body sculpting.",
    href: "/register",
  },
  {
    id: "wellness",
    title: "Wellness & Regeneration",
    description:
      "Preventive medicine, executive screening, and chronic pain management.",
    href: "/register",
  },
] as const;

export const LANDING_ABOUT = {
  heading: "About REVIVORA",
  body: "REVIVORA connects international patients with world-class specialists in Taipei. We coordinate Men's Health, aesthetics, and wellness care so your journey feels clear, private, and supported from consultation to recovery.",
} as const;

export const LANDING_DOCTORS = [
  {
    id: "aung-myat-thu",
    name: "Dr. Aung Myat Thu",
    specialty: "Urology and Men's Health Specialist",
    bio: "Focused on discreet, evidence-based care for men's urological and hormonal health.",
    image: "/images/AungMyatThu.webp",
    href: "/book",
  },
  {
    id: "swe-swe-htet",
    name: "Dr. Swe Swe Htet",
    specialty: "Neurology Specialist",
    bio: "Dedicated to precise neurological assessment and compassionate long-term care.",
    image: "/images/SweSweHtet.webp",
    href: "/book",
  },
] as const;

export const LANDING_PARTNER = {
  heading: "Partner with Us",
  body: "Join our network of trusted referral partners and help patients access world-class medical care in Taiwan.",
  cta: "Partner with Us",
} as const;
