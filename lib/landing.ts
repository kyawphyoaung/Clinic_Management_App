export const LANDING = {
  brand: "REVIVORA",
  tagline: "Medical Care in the Heart of Taipei",
  email: "uroadrian.tw@gmail.com",
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

export type LandingContactChannel = {
  id: "line" | "viber" | "whatsapp" | "telegram";
  label: string;
  /** Value encoded into the QR code */
  qrValue: string;
  /** Visible text for copyable channels */
  displayValue?: string;
  /** External link for button-style channels */
  href?: string;
  action: "link" | "copy";
};

export const LANDING_CONTACT = {
  heading: "Contact Revivora",
  subheading:
    "Get in touch with us through any of the channels below.",
} as const;

export const LANDING_CONTACTS: readonly LandingContactChannel[] = [
  {
    id: "line",
    label: "Line",
    qrValue: "https://line.me/ti/p/pBFzTGejr5",
    href: "https://line.me/ti/p/pBFzTGejr5",
    action: "link",
  },
  {
    id: "viber",
    label: "Viber",
    qrValue: "viber://chat?number=%2B886966906232",
    displayValue: "+886966906232",
    action: "copy",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    qrValue: "https://wa.me/qr/MC2O4KUZ6VWKO1",
    href: "https://wa.me/qr/MC2O4KUZ6VWKO1",
    action: "link",
  },
  {
    id: "telegram",
    label: "Telegram",
    qrValue: "https://t.me/revivora",
    displayValue: "t.me/revivora",
    action: "copy",
  },
] as const;

export const LANDING_PARTNER_CLINICS = [
  {
    id: "clinique-printemps",
    nameZh: "春森診所",
    nameEn: "CLINIQUE PRINTEMPS",
    address:
      "106, Taiwan, Taipei City, Da’an District, Huasheng Village, Section 4, Zhongxiao E Rd, 333號5樓之一",
    phone: "+886227754548",
    website: "https://pinmed.co/clinic/0z6c269v",
    mapsEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d37510.55705670834!2d121.52797496641043!3d25.0416597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442abbbdf993473%3A0xbc3716eb9eed8eb4!2z5pil5qOu6Ki65omAIENMSU5JUVVFIFBSSU5URU1QU--9nOazjOWwv-enke-9nOelnue2k-enke-9nOmHjummrOazou-9nOmIpuaPkOWNh--9nOWnnOWunOWmrumGq-W4q--9nOW8teWYieirlumGq-W4q--9nOmZs-aYpeiPr-mGq-W4qw!5e1!3m2!1sen!2smm!4v1786236012710!5m2!1sen!2smm",
  },
] as const;

export const LANDING_PARTNER = {
  heading: "Partner Clinics",
  body: "Visit our collaborating clinics for in-person care coordinated through REVIVORA.",
  cta: "Partner with Us",
  comingSoon: "Coming Soon..",
  comingSoonBody:
    "More partner clinics are on the way. Updates will be shown here soon.",
} as const;
