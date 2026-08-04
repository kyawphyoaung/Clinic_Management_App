# Next Phase Development – REVIVORA Medical Tourism Web App

## Overview

This document describes the required features and modifications to transform the existing survey‑focused app into a full‑fledged clinic management system.  
**Key existing pieces:** `lib/constants/questionnaires.ts` (ready), survey form hybrid workflow (ready), basic admin dashboard at `/jamesharry`, Prisma schema with Patient/Agent/SurveyResponse models.  

**General Guidelines:**

- **Encryption:** Use AES‑256‑CBC. Encrypt these fields: passport_number, passport_expiry, mobile_number, whatsapp, line_id, email, residential_address, emergency_contact_*, medical_history_description, signature_image. Leave name, preferred_name, DOB, gender, nationality, country_of_residence, medical_service_selections, travel_info, referral_source, consent_booleans unencrypted.
- **Patient Display ID:** format `{clinic_code}-{agent_id}-{YY}{unique_seq}`. Clinic codes: 11 (Chunsen), 12 (Revivora). Agent ID: 4‑char (e.g., ZA1W) or 000 for none. Year last two digits, sequence resets yearly. Display ID auto‑updates when clinic or agent assigned. Database primary key is UUID, display ID is a separate unique column.
- **Multi‑language:** All user‑facing forms support English, Burmese, Chinese. UI must adapt.
- **UI Design:** Dark theme with gold/champagne accents. Serif headings, sans‑serif body. Multi‑step forms with progress bars.

---



## Phase 1 – Core Functionality (must be completed)



### 1. Database Schema Revamp

- Modify Prisma schema:
  - Rename existing models to match new requirements.
  - Add `display_id` (unique, text) to Patient.
  - Add new enums: `PatientStatus` (Inquiry, Quotation Sent, Booking Deposit Received, Telemedicine Scheduled, Appointment Confirmed, Traveling, Patient Arrived, Treatment, Completed, Rescheduled for Follow‑up, Treatment Cancelled, Refunded).
  - Add `ConsentLog` model:
    - `id` String @id @default(uuid())
    - `patientId` String? (optional, for Patient registrations)
    - `agentId` String? (optional, for Agent registrations)
    - `documentType` String (e.g., "privacy_policy")
    - `version` String (e.g., "v1")
    - `source` ConsentSource (DIGITAL / PAPER)
    - `consentedAt` DateTime
    - `recordedAt` DateTime @default(now())
    - `ipAddress` String?
    - `userAgent` String?
    - `staffId` String?
    - `physicalLocation` String?
    - `signatureImageUrl` String?
    - `staffDeclaration` Boolean @default(false)
    - `patient` Patient? @relation(fields: [patientId], references: [id])
    - `agent` Agent? @relation(fields: [agentId], references: [id])
  - Add `Agent` model: `id` UUID, `partner_id` (4‑char unique, generated on approval), `status` (PENDING, ACTIVE, REJECTED), `email`, `password_hash`, `commission_percent`, other fields from agent_reg_form.
  - Add `AgentSetPasswordToken` (token, agent_id, expires_at).
  - Add `Cashflow` model (patient_id, type (Deposit/Charge/Payment), amount, currency, method (Bank/Cash/Card), bank_account_id, remark, timestamp).
  - Add `BankAccount` model (id, name, account_number, is_active).
  - Add `PatientStatusLog` (patient_id, old_status, new_status, changed_by, remark, timestamp).
  - Add `CommissionPayment` model (agent_id, patient_id, amount, currency, calculated_at, paid_at, payment_method, remark).
  - Add `Appointment` model (patient_id, date, status).
  - Update existing `Patient` to include all registration fields, `clinic_id` (nullable), `current_agent_id` (nullable), `appointment_date`, `appointment_status`.
  - Ensure all new tables have proper relations and RLS‑ready structure.
- **Encryption:** The fields listed above must be encrypted before storage. Use server actions for all writes/reads.

---



### 2. Homepage Redesign

- Replace current survey directory with a clinic landing page.
- Sections required: Hero, About, Available Treatments (Men's Health & Urology, Aesthetic & Anti‑Aging, Wellness & Regeneration). Each treatment category shows relevant sub‑treatments.
- Include call‑to‑action buttons: "Book Consultation", "View Questionnaires", "Partner with Us".
- Keep the survey directory accessible via a dedicated page (e.g., `/surveys`) or a card on the homepage.

---



### 3. Patient Registration – Public Link

- Create a public registration page at `/register`.
- The form must be built from a configuration file (`@patient_reg_form.ts`) containing all sections (A–I) with multilingual labels, input types, and validation rules.  
**Important:** The AI must read this file.
- **Workflow:**
  - Multi‑step form with progress bar (Sections A‑H in groups, Section I Consent at the end).
  - Language selector at top.
  - If URL contains `?ref=XXXX`, prefill the "Partner Referral Code" field with that code and make it read‑only.
  - On submission:
    - Generate Patient UUID and Display ID (see rule). If no clinic/agent yet, use `00-000-{YY}{seq}`.
    - Encrypt required fields.
    - Save patient to DB.
    - Log consent for each checked consent checkbox with source `DIGITAL`, timestamp, IP, user agent.
    - Return Display ID to patient.
- **Dynamic Multi-Step Rendering & Config-Driven UI:**
  - **Single Source of Truth:** `patient_reg_form.ts` is the exclusive source for all sections, fields, labels, input types, validation rules, and grouping.
  - **No Hardcoding:** UI components must parse the config file at runtime to dynamically generate the form.
  - **Automatic Pagination:** Sections are split into logical steps (e.g., Step 1: A–C, Step 2: D–F, Step 3: G–H, Step 4: I – Consent). Progress bar shows completion.
  - **Live Reactivity:** Changes to `patient_reg_form.ts` reflect immediately without modifying UI component logic.
- **Consent & Signature UX:**
  - **Master Signature (Canvas):**
    - Include an HTML5 Canvas element for the patient to draw their signature (touch + mouse support).
    - Capture the canvas as an image (PNG), compress to max 600px, JPEG quality 60-70%, file size 30-100KB.
    - Store the encrypted signature image in **Supabase Storage** (bucket: `patient_signatures`). This is the ONLY file upload in the public registration form.
    - Store the signature URL in the Patient DB record (`signature_image` encrypted).
  - **"Use my Master Signature" Checkbox:**
    - Display a checkbox labeled "Use my Master Signature for all agreements" above the consent section.
    - If checked, the single Master Signature is automatically applied to ALL consent checkboxes in Section I.
    - The signature image URL is stored once and linked to all `ConsentLog` entries (no need to re-upload).
- **Agreement Modal (Click-to-Consent UX with Sequential Review):**
  - **Trigger Behavior:**
    - When the user **clicks (checks)** a checkbox that has an `agreementFiles` array defined in the config file (`patient_reg_form.ts` or `agent_reg_form.ts`), a Modal/Overlay **MUST open immediately**.
    - **NO "View Agreement" button** is required or permitted. The checkbox click itself is the trigger.
    - If the user **unchecks** the checkbox and then **re-checks** it, the Modal MUST open again from the beginning, and the user must re-agree to all files.
  - **Modal Content & Flow:**
    - **File Format:** Agreement files are stored as **Markdown (**`.md`**)** in `/public/agreements/`. (e.g., `privacy_policy_v1.md`, `partner_agreement_v1.md`).
    - **Display:** The modal reads the `.md` file from the `agreementFiles` array and renders it using `react-markdown` inside the modal body.
    - **Multiple Files (Sequential Flow):**
      - If the array contains 4 files, the modal starts by showing **File 1 of 4**.
      - **Header:** Show the file name and progress: `📄 Privacy Policy (1 / 4)`
      - **Content:** The rendered Markdown content of the current file.
      - **Button:**
        - For files 1 to N-1: `✅ I Agree & Next →`
        - For the last file (N of N): `✅ I Agree & Close`
    - **Action:**
      - When the user clicks "I Agree & Next", the modal advances to the next file without closing.
      - When the user clicks "I Agree & Close" on the last file, the modal closes.
      - **Only after ALL files have been agreed to** does the checkbox become **automatically ticked (checked)**.
      - If the user closes the modal (e.g., by clicking outside or pressing ESC) before agreeing to all files, the checkbox **must remain unchecked**.
  - **Database Logging (Consent Tracking):**
    - Each time a user clicks "I Agree" on a specific file, a **separate record** MUST be created in the `ConsentLog` table.
    - Required fields for each log:
      - `patientId` (for Patient form) / `agentId` (for Agent form)
      - `documentType`: Extracted from the file name (e.g., `privacy_policy`)
      - `version`: Extracted from the file name (e.g., `v1`)
      - `source`: `DIGITAL`
      - `consentedAt`: Timestamp of the click
      - `recordedAt`: Server timestamp
      - `ipAddress`: User's IP (server-side)
      - `userAgent`: User's browser info (server-side)
      - `signatureImageUrl`: If "Master Signature" is used, this field should reference the stored master signature URL.
    - **Important:** The checkbox state is **only** set to "ticked" if ALL files in the `agreementFiles` array exist as separate `ConsentLog` entries for that user.
- **Medical Records (Checkbox Only - No File Upload):**
  - Section E (Medical History) contains **NO file upload fields**.
  - Instead, display simple checkboxes: "Do you have the following documents?"
    - ☐ Medical Reports
    - ☐ Lab Results
    - ☐ Imaging (CT/MRI/Ultrasound/X-ray)
    - ☐ Medication List
    - ☐ Referral Letter
    - ☐ Previous Surgery Records
    - ☐ Other
  - These booleans are stored in the Patient DB (`has_medical_reports`, `has_lab_results`, etc.).
  - **No Document Management System** is required. Staff will request these files later via email/chat (outside the app scope).
- **No Profile Photo:** Profile photo upload is NOT required and NOT included.

---



### 4. Staff Paper Digitization Form

- Keep `/dashboard/patients/new` for staff to digitize paper registrations.
- This form is identical to the public registration form but includes:
  - Extra field: "Date of Signature" (date picker).
  - Image upload field for the patient’s paper signature (compressed, 600px, JPEG 60‑70%, 30‑100KB).
  - Staff declaration checkbox: "I confirm that I have witnessed the patient sign the original paper document…".
- On submission:
  - Save consent log with source `PAPER`, staff_id, physical location (text field), signature image URL, staff_declaration = true.
  - Record `digitized_by` (current user), `digitized_at` timestamp.
- **Medical Records:** Same as public form: Checkbox only. No file upload.

---



### 5. Patient Detail Page – Consents Tab

- On admin/staff patient detail view, add a "Consents" section/table.
- Show each consent record (document, version, agreed date, source, actions).
- Clicking "View Details" shows a modal:
  - For DIGITAL: timestamp, IP, user agent, "This consent was recorded automatically…" message.
  - For PAPER: physical location, consented date, digitized by (staff name), digitized at, signature image thumbnail (click to enlarge), staff declaration statement with staff name and timestamp.
- Signature image displayed from Supabase Storage (encrypted bucket).

---



### 6. Agent Management – Basic Flow

- **Agent Registration (public link):** `/partner/register` – Form from `agent_reg_form.ts` (multilingual).
- **Agent Registration Form Features (Mirrors Patient Form):**
  - **Master Signature (Canvas):** Identical to patient registration (Canvas → Supabase Storage).
  - **"Use my Master Signature" Checkbox:** Same functionality as patient form.
  - **Agreement Modal (Click-to-Consent UX):** Identical to patient registration. Triggered by checkbox click. Uses Markdown (`.md`) files from `/public/agreements/`. Sequential flow ("I Agree & Next" / "I Agree & Close"). Each agreement creates a separate `ConsentLog` entry with `agentId`.
  - **Document Upload:** None. Checkbox only for document availability.
  - On submit, create agent with status PENDING.
- **Admin Dashboard – Pending Agents:** List all PENDING agents. Approve/Reject actions.
- **Approval:** 
  - Generate unique 4‑character `partner_id` (uppercase alphanumeric). 
  - Set status ACTIVE, `approved_at`, `approved_by`.
  - Create one‑time `AgentSetPasswordToken` (expires in 24h).
  - Send email containing set‑password link: `/partner/set-password?token=xxxx`. Email also shows Partner ID.
- **Set Password page:** Validate token. Show form to enter new password (with confirmation). Hash password (bcrypt) and store in `Agent.password_hash`. Delete token.
- **Agent Login:** Login page at `/partner/login`. Accept Partner ID + password. Authenticate and redirect to Agent Dashboard.
- **Forgot password:** Sends reset link (similar token mechanism).

---



### 7. Patient Display ID Auto‑Update

- When admin assigns clinic (`clinic_id` set) or agent (`current_agent_id` set), `display_id` must be recomputed and updated immediately.
- Unique numeric sequence (`YYnnnnn`) derived from yearly counter (`yearly_patient_sequence` table). Resets on January 1. Ensure uniqueness.

---



### 8. Multi-Step Form Navigation Rules (Unified for Patient & Agent)

**Progress Tabs:**

- Display section tabs at the top of the form: `[A] [B] [C] [D] [E] [F] [G] [H] [I]` (or corresponding sections for Agent).
- Users **can** click any tab to navigate directly to that section at any time.

**Navigation Constraints:**

- **Forward Navigation (Next Section):** A user **cannot** move to the next section (via "Next" button or clicking a future tab) if any **required** field in the current section is empty or contains invalid data.
  - *Behavior:* Show a clear error message (e.g., "Please complete all required fields in this section before proceeding.") and highlight the empty/invalid fields.
- **Backward Navigation (Previous Sections):** Users **can** click on any **previous** section tab (e.g., from Section D back to Section A) **without validation**. This allows users to freely go back and edit previous answers.
- **Inter-Section Tabs:** Clicking a tab that is ahead (e.g., clicking Section E while on Section C) triggers the same validation as clicking "Next". If current section is incomplete, navigation is blocked.

**Progress Bar / Status Indicator:**

- The progress bar or tab list must visually indicate the completion status of each section:
  - **Complete (Green checkmark / Filled circle):** All required fields in that section are validated and filled.
  - **Incomplete (Red dot / Empty circle):** Required fields are missing or invalid.
  - **Active (Highlighted / Gold border):** The section currently being viewed.

**Implementation Note for Developers:**

- The form UI must read the `fields` array from the respective config file (`patient_reg_form.ts` / `agent_reg_form.ts`) to determine which fields are `required`.
- Validation must run on the client-side (for instant feedback) and be re-validated on the server-side upon final submission.
- The "Next" button should only validate the **current section's fields**, not the entire form, until the final step.

---



## Phase 2 – Extended Features (build if tokens/time permit)



### 9. Cashflow System

- Models for Deposit, Charge, Payment. Each linked to a patient.
- Record deposit amount, charge for services, and payments.
- Payment methods: Bank (active accounts list), Cash, Card.
- Bank Account management: Admin settings (add, edit name/number, set active/inactive). No deletion.
- Currency: Manual input per transaction.



### 10. Patient Statuses & Logging

- Implement full list of patient statuses.
- On patient detail page, show current status with dropdown to update.
- When status changes, create `PatientStatusLog` entry.
- Status log visible to admin and assigned agent.



### 11. Agent Dashboard (Login Required)

- Show referred patients list (display ID, preferred name, country, selected services, travel info, current status).
- Show deposit/charges per patient.
- Monthly commission summary.
- Downloadable marketing materials (static list).
- Commission detail: Admin can view and mark as paid.



### 12. Appointment Management

- Add `appointment_date` and `appointment_status` to Patient.
- Admin/doctor can set/reschedule appointment.
- Staff/Doctor can see upcoming appointments (calendar or list).
- Agent dashboard shows appointment date.



### 13. Role‑Based Access Control

- Roles: Admin, Doctor, Staff, Agent.
- Admin: full access.
- Doctor: view patients, add medical notes, set appointments.
- Staff: registrations, digitize paper forms, update statuses, cashflow.
- Agent: own referred patients, commission, resources.



### 14. Pre‑registered Survey Link Generation

- Admin dashboard: dropdown to select patient, generate unique survey link (e.g., `/survey/adam_v1?patientId=...`). "Generate" copies link to clipboard.

---



## Phase 3 – UI Polish & Final Touches

- Implement dark theme with gold/champagne accents across all pages.
- Apply serif/sans‑serif typography.
- Convert all long forms into multi‑step with progress bars.
- Settings page: Admin can create accounts for Doctor/Staff. Agent accounts only after agent record exists.
- Ensure all data display follows UI patterns.

---



## Agreement File Storage Specification (For Both Patient & Agent Forms)


| Item                   | Specification                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **File Format**        | **Markdown (**`.md`**)** only                                                                                           |
| **Storage Location**   | `/public/agreements/`                                                                                                   |
| **Naming Convention**  | `{document_type}_v{version}.md`                                                                                         |
| **Examples**           | `privacy_policy_v1.md`, `telemedicine_informed_consent_v1.md`, `booking_refund_policy_v1.md`, `partner_agreement_v1.md` |
| **Rendering in Modal** | Use `react-markdown` to render `.md` content                                                                            |
| **Action Button**      | "I Agree & Next" / "I Agree & Close" (sequential flow per file)                                                         |
| **Trigger Behavior**   | Clicking the checkbox opens the modal immediately (NO separate "View" button).                                          |
| **Database Logging**   | Each "I Agree" click creates a separate `ConsentLog` entry with `documentType` and `version`.                           |


---



## File Storage Summary (Simplified)


| Asset                     | Storage Location                               | Upload Method                 |
| ------------------------- | ---------------------------------------------- | ----------------------------- |
| Master Signature (Canvas) | Supabase Storage (`patient_signatures` bucket) | Server Action (encrypted)     |
| Medical Records           | **NOT UPLOADED** (Checkbox only)               | N/A                           |
| Profile Photo             | **NOT UPLOADED** (Not included)                | N/A                           |
| Agreement Files (.md)     | `/public/agreements/` (static files)           | Manual (developer adds files) |


---



## Implementation Notes for AI (Cursor)

1. **Read** `patient_reg_form.ts` **and** `agent_reg_form.ts` – These are the single source of truth for all fields.
2. **No Cloudinary, No Third-Party Storage** – Only Supabase Storage for signatures.
3. **No Document Management System** – Staff will request files manually outside the app.
4. **Canvas Signature** – Must support touch + mouse. Compress on client before upload.
5. **Agreement Modal** – Must use **Markdown (**`.md`**)** files from `/public/agreements/`. Render with `react-markdown`. Trigger: checkbox click opens modal directly. Sequential flow: "I Agree & Next" for files 1 to N-1, "I Agree & Close" for last file. Checkbox ticks ONLY after all files are agreed. Each "I Agree" click creates a separate `ConsentLog` entry.
6. **"Use my Master Signature"** – If checked, all consent logs reference the same signature URL.
7. **Multi-step forms** – Use progress bar, split sections as defined in config. Apply unified navigation rules (tabs, required field validation per section).
8. **Multi-language** – English, Burmese, Chinese. Labels from config.
9. **Encryption** – AES-256-CBC for sensitive fields. Server actions for all writes/reads.
10. **Display ID** – Format `{clinic_code}-{agent_id}-{YY}{seq}`. Auto-update on clinic/agent assignment.
11. **ConsentLog Schema** – Remember `patientId` and `agentId` are both optional (nullable) to support both Patient and Agent registrations in the same table.
12. `agreementFiles` **Key** – In config files, the array of Markdown file paths MUST be stored under the key `agreementFiles`.

---

**Cursor:** Read this document carefully. Read `patient_reg_form.ts` and `agent_reg_form.ts`. Follow this spec exactly. Do NOT ask clarifying questions about file upload, document management, or PDFs – the decision is already made above (Markdown, no uploads). Start implementation from Phase 1, Section 1 (Database Schema Revamp) and proceed sequentially.