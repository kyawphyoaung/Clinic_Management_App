# Phase 707_v2 – System Refinements & New Features (Implementation Specification)

## Overview
This document outlines the required refinements and new features for the clinic management system. All changes must be implemented in the order listed below, with attention to preserving existing performance optimizations, caching strategies, and code patterns.

---

## 1. Dashboard Sidebar – Sticky Behavior
**Status:** Fix
- The sidebar currently scrolls with the page content.
- **Required:** The sidebar must remain fixed/sticky in its position at all times.
- It should not move or disappear when the user scrolls vertically.

---

## 2. Visits System – Core Structural Change
**Status:** New Feature

### Concept
- A Visit represents one physical visit of a patient to a clinic.
- Each patient can have multiple visits over time (first visit, follow-up, revisit to a different clinic).
- The Visit determines the clinic attended and whether the visit was agent-referred or walk-in.

### Purpose
- Separate patient identity (centralized) from visit-specific details.
- Allow the same patient to visit different clinics within the Revivora network.
- Determine agent commission eligibility **per visit** (not per patient).
- If a patient registers via an agent for their first visit, the agent earns commission only for treatments completed during **that specific visit**.
- If the patient returns later on their own (walk-in), the agent does not earn commission for subsequent visits/treatments.

### Required Fields
- **Patient ID:** 6‑digit numeric ID (e.g., 260006) – permanent patient identifier.
- **Clinic ID:** The clinic the patient visited (e.g., 11 for CLINIQUE PRINTEMPS, 22 for REVIVORA).
- **Agent ID:** The agent who referred the patient for this visit (if applicable). If the patient walked in, this is 0000 or empty.
- **Date:** The date of the visit (YYYY-MM-DD).
- **Visit Type:** `First Visit`, `Revisit`, `Follow-up`, etc. (choose a professional term that fits the workflow).
- **Source:** `Agent Referral` or `Walk-in` (selected by staff during visit creation).

### Visit ID Format
- **Format:** `{clinicCode}-{agentCode}-{patientID}-{YYMMDD}`
- Example (Agent Referral): `11-YU2W-260006-261011`
  - Clinic: CLINIQUE PRINTEMPS (11)
  - Agent: YU2W
  - Patient: 260006
  - Date: 2026-10-11
- Example (Walk-in): `22-0000-260006-261204`
  - Clinic: REVIVORA (22)
  - Agent: None (0000)
  - Patient: 260006
  - Date: 2026-12-04

### Relationship with Treatments
- Treatments are linked to a specific Visit.
- Each treatment belongs to exactly one visit.
- When a treatment is created, the user must select which visit it belongs to.
- Charges, payments, and commission are calculated at the visit level.

### Required Actions
- Create a **New Visit** button/flow.
- Allow **Update** and **Delete** of existing visits.
- Visits list table must include a **Treatments** column showing the Treatment IDs linked to that visit.
- If no treatment exists for a visit, display a **New Treatment** button that pre-fills the visit ID in the treatment creation form.

---

## 3. Patient ID & Display ID Changes
**Status:** Structural Change

### Patient ID (Primary)
- Each patient has a unique 6‑digit numeric ID (e.g., 260006).
- This ID is permanent and does not change.
- It is the primary identifier for all patient records.

### Display ID (Visit Identifier)
- Display ID is now visit‑based (not patient‑based).
- Format: `{clinicCode}-{agentCode}-{patientID}-{YYMMDD}`
- **Where to Show What:**
  - `/dashboard/patients`: Show Patient ID (e.g., 260006) as the primary identifier.
  - `/dashboard/patients/[id]` – Patient Name area: Show Patient ID (e.g., 260006).
  - `/dashboard/patients/[id]` – Visits section: Show Display ID for each visit.
  - `/dashboard/treatments/[id]` – Title & Patient Info: Show **only Patient ID** (e.g., 260006). Remove Display ID from title and patient info.

### Action Required
- Remove Display ID from patient‑level views.
- Add Display ID to visit‑level views.
- Update all relevant UI components accordingly.

---

## 4. Treatments & Charges – Agent Commission Logic
**Status:** Refinement

### Commission Determination
- Agent commission eligibility is determined at the **Visit level**.
- If the Visit has an Agent ID → All treatments and charges under that visit are eligible for agent commission (default).
- If the Visit has no Agent ID → No commission is calculated for any treatment or charge under that visit.

### Per‑Charge Agent Flag
- Each charge must have a flag: `isAgentRelated` (boolean).
- **Default:** If the visit is agent‑referred, all charges default to `isAgentRelated = true`.
- **User override:** Staff/Admin can manually change the flag for individual charges.
- This flag determines whether the charge contributes to the agent's commission calculation.

### Commission Calculation
- Commission = Sum of `(Charge Amount × Agent Commission Rate)` for all charges where `isAgentRelated = true`.
- Calculated per visit, not per patient.

---

## 5. Charge Edit & Delete Functionality
**Status:** New Feature
- Existing charges must be **editable** and **deletable**.
- When editing a charge:
  - Update fields: Category, Description, Quantity, Price, Notes, `isAgentRelated`.
  - Recalculate treatment total and commission after update.
- When deleting a charge:
  - Confirm deletion.
  - Recalculate treatment totals and commissions after deletion.

---

## 6. Charge Detail View
**Status:** New Feature
- Clicking on a charge row opens a detailed view.
- Display:
  - All line items (Category, Description, Quantity, Price).
  - Total price.
  - `isAgentRelated` status.
  - Any applied discounts (if applicable).
- UI must be clean, professional, and visually appealing.

---

## 7. Treatment & Charge IDs
**Status:** New Feature
- Each treatment must have a unique, short, human‑readable ID.
- Each charge must also have a unique, short, human‑readable ID.
- IDs should be short (not long UUIDs). Example format: `TREAT-001`, `CHG-001` or similar.

---

## 8. Deposit & Payment System Overhaul
**Status:** Major Refactor

### Deposit Balance – Patient Level
- Each patient has a Deposit Balance.
- Staff can add deposit payments to a patient's balance.

### Deposit Application (Charges)
- **New Logic:**
  - Commission is calculated **only on the original charge amounts** (before deposit deduction).
  - Deposit is applied **at the payment stage**, not at the charge stage.
  - When a patient makes a payment:
    - The user selects which charges to pay for.
    - The user can choose to apply deposit balance to the payment.
    - If deposit is applied, the remaining amount to be paid is reduced.
    - The payment record reflects the final amount paid (after deposit).
    - A receipt is generated showing all details (charges, deposit applied, final amount).
    - The receipt should be printable/exportable.

### Payment Workflow
1. User clicks **"Make New Payment"**.
2. Select the charges to pay for.
3. Option to apply deposit balance (full or partial).
4. System calculates the remaining amount to pay.
5. User confirms and **prints a receipt**.
6. Receipt includes:
   - Patient name and ID
   - Charges and amounts
   - Deposit applied
   - Final amount paid
   - Payment method
   - Date and time
7. Record the payment.

---

## 9. Deposit Receiver System
**Status:** New Feature

### Concept
- A Deposit Receiver is an entity (person or account) that holds patient deposits on behalf of the clinic.
- Examples: A partner clinic, a staff member, or a specific bank account.
- Staff can create, update, and delete Deposit Receivers.

### Fields
- Name
- Description
- Contact info (optional)
- Current balance (auto‑calculated from deposit records)

### Flow
1. **Request Deposit:** Staff sets a deposit amount for a specific patient (in TWD or other currency).
   - Requested amount appears on the Agent Dashboard if the patient is agent‑referred.
   - Exchange rate (default: current rate from API) determines equivalent amounts in other currencies.
2. **Patient Makes Deposit:** The patient transfers the deposit to a Deposit Receiver.
3. **Record Deposit:** Staff records the deposit in the system, specifying:
   - Patient
   - Amount (with currency)
   - Deposit Receiver
   - Date
4. **Transfer to Clinic:** The deposit can later be transferred from the Receiver to the clinic account.
   - Staff logs this transition (Receiver → Clinic).
   - Track all deposit movements.

### Requested Deposit System (NEW)
- A **Requested Deposit** is a formal request sent to a patient for a specific deposit amount.
- Requested Deposit record includes:
  - Patient ID
  - Requested Amount (in TWD)
  - Exchange Rate (current at time of request)
  - Equivalent amount in the patient's currency (USD, MMK, etc.)
  - Date
  - Status (Pending, Paid, Updated)
- Staff can create, update, and delete Requested Deposits.
- If Exchange Rate changes, staff can update the request and re‑send it.
- **Multi‑Currency Support:**
  - When recording a deposit payment, the user must select the currency used (TWD, USD, MMK, etc.).
  - The system should display amounts in TWD and the patient's preferred currency.
  - Exchange rates should be fetched from an API (current rate) and stored with the request.
- **Agent Dashboard:**
  - For agent‑referred patients, show the Requested Deposit amount.

---

## 10. Cashflow Overview Dashboard
**Status:** New Feature
- A comprehensive cashflow dashboard showing the clinic's financial status.
- Display:
  - Total patient deposits held (across all receivers and clinic account).
  - Total outstanding charges.
  - Total revenue collected.
  - Deposits held by each Deposit Receiver.
  - Deposits transferred to the clinic account.
- Filterable by **month** or **year**.
- **Export to Excel** functionality for all data views.

---

## 11. Doctor ID System
**Status:** New Feature
- Each doctor must have a unique, short ID.
- Format: `DR001`, `DR002`, etc.
- Use this ID in appointments, treatments, and other records.

---

## 12. Partner Registration Form Updates
**Status:** UI Update
- Remove the `Job Title` field – it should not be required.
- Rename `Business Address` label to `Contact Address`.
- Update placeholder text accordingly.

---

## 13. Patient & Partner Registration – Phone Number Input
**Status:** UI/UX Redesign

### Current Issue
- Users must manually enter the `+` and country code.
- No formatting or validation is applied.

### Required Changes
- Replace free‑text phone input with a **country code dropdown** + **phone number input**.
- The dropdown should list countries, showing the country name and its code.
- **Priority Countries (top of list):**
  1. Taiwan (`+886`)
  2. United States (`+1`)
  3. Myanmar (`+95`)
- **Formatting:**
  - As the user types, format the phone number according to the selected country's format.
  - Example:
    - US: `(415) 234-5678`
    - Taiwan: `956 781 282`
    - Myanmar: format according to local conventions.
- **Placeholder:**
  - Show a sample number starting with 9 (not 0).
  - If the user enters a number starting with 0, show an alert and remove the leading zero.

---

## 14. Patient Registration – Confirmation Page
**Status:** UI Update
- After registration, display only the **Patient ID** (e.g., 260006).
- Do not show the Display ID.

---

## 15. Forgot Password System
**Status:** New Feature

### For Partners (Agents)
- Link on Partner Login page (`/partner/login`).
- User enters their registered **Email** and **Date of Birth**.
- If matched, generate a **password reset link**.
- Send the link to the user's email.
- Clicking the link takes the user to a page where they can enter a **new password** and **confirm it**.
- Password is updated.
- **Admin Dashboard:** Admin can generate a password reset link for any agent directly from the dashboard.
- **For Admin:** The button should be **"Copy Password Reset Link"** (copy to clipboard), not "Send".

### For Doctors
- Link on Admin Login page (`/jamesHarry`).
- Doctor enters their registered **email**.
- A **password reset link** is sent to their email.
- Clicking the link redirects to a password reset page.
- Doctor enters a **new password** and confirms it.
- Password is updated.

### Password Change Logs
- All password changes must be **logged**.
- Logs should include: User ID, Timestamp, IP address (optional).
- Logs must be viewable in the system (e.g., user detail page or admin audit log).
- Recent password changes should appear in the **Recent Activities** section of the Dashboard.

---

## 16. Help / Documentation System
**Status:** New Feature
- A Help Page accessible from the dashboard.
- Contains a **Search Bar** at the top.
- Users can search for any feature or function in the system.

### Search Behavior
- When a user searches for a term (e.g., "Charges"):
  - Display a **card** explaining what "Charges" are.
  - Provide **navigation directions**:
    - `Choose a Patient > Choose a Visit > Choose a Treatment > Charges`
- When a user searches for "Treatments":
  - Explain treatments and the two ways to access them:
    1. Via Dashboard Sidebar → Treatments.
    2. Via Choose a Patient > Choose a Visit > Treatments.
- For "Make New Treatment":
  - `Choose a Patient > Choose a Visit > Make New Treatment`
- The Help page should cover all major features and workflows.

---

## 17. Page‑Specific UI/UX Updates

### /dashboard/patients/[id]
**Order of Sections (Top to Bottom):**
1. Change Status: [dropdown list]
2. Assign Agent: [dropdown list with search box]
3. Survey Links (hidden under arrow/toggle)
4. Deposit Billing (subtitle: Balance: NT$ 2,500.00 – use orange/gold color for the amount)
5. Appointments
6. Visits
7. Treatments
8. Demographics
9. Consents (hidden under arrow/toggle)
10. Survey Results (hidden under arrow/toggle)
11. Registration Info (hidden under arrow/toggle)

**Other Changes:**
- Remove the **Assign Clinic** dropdown/system completely.
- **Visits List Table:** Add a **Treatments** column showing Treatment IDs linked to the visit.
  - If no treatment exists, display a **New Treatment** button that pre‑fills the visit ID in the treatment creation form.

### /dashboard/treatments/[id] – Treatment Detail Page

#### Summary Card (Topmost)
- **Remaining Balance:** Display in **red** if positive (e.g., NT$ 9999.99).
- If Remaining Balance is negative (e.g., NT$ -250.00), display in **purple**.
- If negative, show an alert icon with the text **"Something Wrong"**.

#### Charges Card – Table
- **Net Price** values:
  - If `Paid = Yes`, display in **green**.
  - If `Paid = No`, display in **red**.

#### Payments Card – Table
- Replace `Date` column with **Date | Time** (two columns).
- If not stored, update the database to store Date & Time.
- **Amount** values: display in **green**.
- **Remaining Balance** values: display in **red**.
- Rows with a remaining balance should move to the bottom.
- When a remaining balance is paid off, display the row with a **strike‑through**.
- **Sorting:** Rows sorted by date & time descending (newest on top).
- **Actions per row:** View, Update, Delete (with confirmation for delete).

---

## 18. Treatment Notes – SOAP Format & Vital Signs
**Status:** New Feature

### SOAP Fields (Replace Title & Content)
- **Subjective Symptoms** (textbox)
- **Objective Findings** (textbox)
- **Assessment Goals** (textbox)
- **Plan of Treatment** (textbox)

### Vital Signs
Include icons and input fields for:
- **Blood Pressure:** Systolic (mm Hg) and Diastolic (mm Hg) – two textboxes with symbol.
- **Heart Rate:** (bpm) – textbox with icon.
- **Weight:** (kg) – textbox with icon.
- **Height:** (cm) – textbox with icon.
- **Body Temperature:** (°C) – textbox with icon.

### Note Management
- Create, Update, Delete notes.
- **View Mode:** Display all fields in textboxes.
- **Update Button:** Green/enabled only when the user makes a change; otherwise disabled/gray.
- **Delete:** Double‑check confirmation required.

---

## 19. Implementation Guidelines

**Important Notes for AI:**
1. **Review existing code first** – understand current functions, components, and logic before making changes.
2. **Do not break existing performance optimizations** (caching, API call reduction, etc.).
3. **Maintain consistency** with the existing code style and architecture.
4. **Respect existing solutions for webpack/turbopack issues** – do not reintroduce problems already fixed.
5. **Do not rewrite code unnecessarily** – reuse existing components and logic where possible.
6. **All changes must follow the order listed in this document.**

---

## Summary of Changes

| Area | Change |
| :--- | :--- |
| Sidebar | Make it sticky. |
| Visits | Introduce visit‑based tracking; separate patient identity from visit details; determine agent commission per visit. |
| Patient ID | Use a 6‑digit numeric ID as the primary identifier. |
| Display ID | Move to visit‑level identifier with format `{clinic}-{agent}-{patientID}-{date}`. |
| Treatment & Charges | Link treatments to visits; add `isAgentRelated` flag per charge; allow editing/deleting charges. |
| Deposits | Apply deposit at payment stage (not charge stage); introduce Deposit Receiver system; support multi‑currency. |
| Cashflow | Add a financial dashboard with export to Excel. |
| Doctor ID | Assign unique short IDs to doctors. |
| Registration Forms | Remove Job Title; rename Business Address; add country‑code dropdown for phone numbers with formatting. |
| Forgot Password | Implement for Partners and Doctors with logging. |
| Help Page | Add a searchable help system with navigation guides for all features. |
| Treatment Notes | Implement SOAP format + Vital Signs with create/update/delete. |
| UI/UX Updates | Reorder sections, update color coding, add view/update/delete actions, etc. |

---
