# Landing Page Implementation – REVIVORA Clinic (Updated)

## Overview
Build a professional, modern, and conversion‑focused landing page for REVIVORA Clinic. The page should serve as the public face of the clinic and drive users to book consultations or partner with us.

## Design Guidelines
- **Theme:** Hybrid – 70% Light / 30% Dark. Clean, elegant, medical‑grade aesthetic.
- **Typography:** Serif headings (`font-serif`) + Sans‑serif body (`font-sans`).
- **Colors:** Primary – Gold/Champagne accents (`#c9a84c`), Secondary – Deep navy (`#0f0f1a`), Background – White/Off‑white (`#f8f6f0`).
- **Spacing:** Generous white space; card‑based layouts for treatments and doctors.
- **Responsive:** Fully mobile‑friendly using Tailwind responsive classes (`sm:`, `md:`, `lg:`). All cards stack vertically on small screens; navigation collapses to hamburger menu on mobile.

## Image Assets (Already Provided)
All images are located in `/public/images/`.

| Asset | File Name | Usage |
| :--- | :--- | :--- |
| Hero Banner | `hero-banner.webp` | Full‑width hero background |
| Doctor 1 Photo | `AungMyatThu.webp` | Dr. Aung Myat Thu’s profile (circular crop) |
| Doctor 2 Photo | `SweSweHtet.webp` | Dr. Swe Swe Htet’s profile (circular crop) |
| Logo | `main_logo.svg` | Site logo in the header and footer |

## Sections

### 1. Header (Navigation Bar)
- **Logo:** Use `main_logo.svg` on the left.
- **Nav Links:** `Home`, `Treatments`, `About`, `Contact`.
- **CTA Button:** `Book Consultation` – links to `/register`.
- **Style:** Fixed/sticky header with subtle shadow. On mobile, collapse to a hamburger menu.

### 2. Hero Section (Full‑Width Banner)
- **Background Image:** `hero-banner.webp` (set as background with `object-fit: cover`).
- **Overlay:** Dark gradient overlay (30% opacity) for text readability.
- **Headline:** `"Expert Medical Care in the Heart of Taipei"`
- **Subheadline:** `"Your trusted partner for Men's Health, Aesthetics, and Wellness"`
- **Button:** `Book Consultation` – links to `/register`.
- **Button Style:** Gold/Champagne background with dark text.
- On mobile, the text and button should remain centered and readable.

### 3. Available Treatments (3‑Column Cards)
- **Heading:** `"Our Treatments"`
- **Subheading:** `"Comprehensive care tailored to your needs"`
- **3 Cards:**
  1. **Men's Health & Urology**
     - Icon: Placeholder or use simple SVG/emoji (no image required)
     - Text: "Expert care for erectile dysfunction, testosterone therapy, and prostate health."
     - Link: `/register`
  2. **Aesthetic & Anti‑Aging**
     - Icon: Placeholder or use simple SVG/emoji
     - Text: "Advanced treatments for hair restoration, skin tightening, and body sculpting."
     - Link: `/register`
  3. **Wellness & Regeneration**
     - Icon: Placeholder or use simple SVG/emoji
     - Text: "Preventive medicine, executive screening, and chronic pain management."
     - Link: `/register`
- On mobile, cards stack in a single column.

### 4. Meet with Expert Doctor (Doctor Cards)
- **Heading:** `"Meet Our Expert Doctors"`
- **Subheading:** `"World‑class specialists dedicated to your care"`
- **2 Doctor Cards** (use provided images):
  1. **Dr. Aung Myat Thu** – *Urology and Men's Health Specialist*
     - Photo: `AungMyatThu.webp` (circular crop)
     - Short bio: (you may add a 1‑line placeholder)
     - `Book Appointment` button → `/register`
  2. **Dr. Swe Swe Htet** – *Neurology Specialist*
     - Photo: `SweSweHtet.webp` (circular crop)
     - Short bio: (you may add a 1‑line placeholder)
     - `Book Appointment` button → `/register`
- On mobile, the cards stack vertically.

### 5. Partner with Us Section
- **Heading:** `"Partner with Us"`
- **Text:** "Join our network of trusted referral partners and help patients access world‑class medical care in Taiwan."
- **Button:** `Partner with Us` → `/partner/register`

### 6. Footer
- **Left Column:** Clinic Name, Address, Google Maps embed.
- **Middle Column:** Contact – Phone, Email, Line.
- **Right Column:** Quick Links – Home, Treatments, Contact.
- **Bottom:** Copyright notice.
- The footer should also be responsive and stack on small screens.

## Implementation Notes
- Use Tailwind CSS for styling.
- Use `next/image` for optimized images.
- All external links open in new tab (`target="_blank" rel="noopener noreferrer"`).
- Mobile navigation: Hamburger menu on small screens (use a simple toggle).
- Do NOT change existing dashboard or appointment logic.
- This is a standalone public page – route: `/` (homepage).
- **Responsive Behaviour:** Ensure the page looks great on all screen sizes. Use Tailwind’s responsive prefixes (`sm:`, `md:`, `lg:`) for padding, font sizes, grid columns, and layout adjustments.

## Expected Behavior
- All CTA buttons navigate to the correct routes (`/register`, `/partner/register`).
- The page should load fast and feel premium.
- No admin/dashboard logic is required on this page.
