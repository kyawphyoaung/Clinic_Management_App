# Next Phase – System Refinements & New Features (Phase 707)

## Overview
This document outlines system refinements, new features, and structural changes to improve the clinic management workflow. The focus is on visit-based tracking, commission logic separation, enhanced deposit management, and user experience improvements.

---

## 1. Dashboard Sidebar – Sticky Behavior

### Issue
- The sidebar currently scrolls with the content on the right side.
- When the user scrolls down, the sidebar moves up and disappears.

### Requirement
- The sidebar must remain **fixed/sticky** in its position.
- It should stay visible at all times while the user scrolls through the content.
- The sidebar should not move or scroll with the page content.

---

## 2. Visits System (Core Structural Change)

### Concept
- A **Visit** represents a patient's physical visit to a clinic.
- Each patient can have multiple visits over time (first visit, follow-up, revisit to a different clinic, etc.).
- The Visit determines which clinic the patient attended and whether the visit was via an **agent referral** or a **walk-in**.

### Purpose
- Separate patient identity (centralized) from visit-specific details.
- Allow the same patient to visit different clinics under the Revivora network.
- Determine agent commission eligibility **per visit**, not per patient.
- If a patient registers via an agent for their first visit, the agent only earns commission for treatments completed during **that specific visit**.
- If the patient returns later on their own (walk-in), the agent does not earn commission for subsequent visits/treatments.

### Visit Fields
| Field | Description |
| :--- | :--- |
| **Patient ID** | The patient's unique 6‑digit numeric ID (e.g., `260006`). |
| **Clinic ID** | The clinic the patient visited (e.g., `11` for CLINIQUE PRINTEMPS, `22` for REVIVORA). |
| **Agent ID** | The agent who referred the patient for this visit (if applicable). If the patient walked in, this is `0000` or empty. |
| **Date** | The date of the visit. |
| **Visit Type** | `First Visit`, `Revisit`, `Follow-up`, etc. (Choose a professional term that fits the workflow). |
| **Source** | `Agent Referral` or `Walk-in` (selected by staff during visit creation). |

### Visit ID Format
- **Format:** `{clinicCode}-{agentCode}-{patientID}-{YYMMDD}`
- **Example 1 (Agent Referral):** `11-YU2W-260006-261011`
  - Clinic: CLINIQUE PRINTEMPS (11)
  - Agent: YU2W
  - Patient: 260006
  - Date: 2026-10-11
- **Example 2 (Walk-in):** `22-0000-260006-261204`
  - Clinic: REVIVORA (22)
  - Agent: None (0000)
  - Patient: 260006
  - Date: 2026-12-04

### Relationship with Treatments
- **Treatments are linked to a specific Visit.**
- Each treatment belongs to exactly one visit.
- When a treatment is created, the user must select which visit it belongs to.
- Charges, payments, and commission are all calculated at the **visit level**.

---

## 3. Patient ID & Display ID Changes

### Patient ID (New Primary Identifier)
- Each patient has a **unique 6‑digit numeric ID** (e.g., `260006`).
- This ID is **permanent** and does not change.
- It is used to identify the patient across all visits, clinics, and records.

### Display ID (Visit Identifier)
- The **Display ID** is now **visit‑based** (not patient‑based).
- It follows the format: `{clinicCode}-{agentCode}-{patientID}-{YYMMDD}`
- Display ID is shown in:
  - `/dashboard/patients` list (patient rows will show the **Patient ID** and the **Display ID** of their most recent or selected visit).
  - `/dashboard/patients/[id]` page, under the patient name (show the patient's **Patient ID**, and the **Display ID** of each visit).
- **Patient ID** is displayed prominently. **Display ID** is secondary.

### Where to Show What
| Location | What to Show |
| :--- | :--- |
| `/dashboard/patients` | Patient ID (e.g., `260006`) as the primary identifier. |
| `/dashboard/patients/[id]` – Patient Name area | Patient ID (e.g., `260006`). |
| `/dashboard/patients/[id]` – Visits section | Display ID for each visit (e.g., `11-YU2W-260006-261011`). |
| `/dashboard/treatments/[id]` – Title & Patient Info | Patient ID only (e.g., `260006`). Remove the Display ID from the title and patient info section. |

---

## 4. Treatments & Charges – Agent Commission Logic

### Commission Determination
- Agent commission eligibility is determined **at the Visit level**.
- If the Visit has an Agent ID → All treatments and charges under that visit are eligible for agent commission.
- If the Visit has no Agent ID → No commission is calculated for any treatment or charge under that visit.

### Per-Charge Agent Flag
- Each charge within a treatment must have a flag: `isAgentRelated` (boolean).
- **Default behavior:** If the visit is agent‑referred, all charges default to `isAgentRelated = true`.
- **User override:** Staff/Admin can manually change the flag for individual charges (e.g., if a patient adds extra services on their own during the visit).
- This flag determines whether the charge contributes to the agent's commission calculation.

### Commission Calculation
- Commission = Sum of `(Charge Amount × Agent Commission Rate)` for all charges where `isAgentRelated = true`.
- This is calculated per visit, not per patient.

---

## 5. Charge Edit & Delete Functionality

### Requirement
- Existing charges must be **editable** and **deletable**.
- When editing a charge:
  - The user can update fields such as Category, Description, Quantity, Price, Notes, and the `isAgentRelated` flag.
  - Changes should update the treatment total and commission calculation accordingly.
- When deleting a charge:
  - Confirm before deletion.
  - Remove the charge from the system.
  - Recalculate treatment totals and commissions.

---

## 6. Charge Detail View

### Requirement
- Clicking on a charge row should open a detailed view.
- The detail view must display:
  - All line items within the charge (Category, Description, Quantity, Price).
  - Total price.
  - `isAgentRelated` status.
  - Any applied discounts (if applicable).
- The UI should be clean, professional, and visually appealing.

---

## 7. Treatment & Charge IDs

### Requirement
- Each treatment must have a **unique, short, human‑readable ID**.
- Each charge must also have a **unique, short, human‑readable ID**.
- IDs should be **short** (not long UUIDs).
- Consider a format like `TREAT-001`, `CHG-001`, or similar.

---

## 8. Deposit & Payment System Overhaul

### Deposit Balance – Patient Level
- Each patient has a **Deposit Balance**.
- Staff can add deposit payments to a patient's balance.

### Deposit Application (Charges)
- Previously, deposit was applied directly to charges (subtracted from total).
- This caused issues with commission calculation (commission was calculated on reduced amounts).
- **New Logic:**
  - Commission is calculated **only on the original charge amounts** (before deposit deduction).
  - Deposit is applied **at the payment stage**, not at the charge stage.
  - When a patient makes a payment:
    - The user selects which charges to pay for.
    - The user can choose to apply deposit balance to the payment.
    - If deposit is applied, the remaining amount to be paid is reduced.
    - The payment record reflects the final amount paid (after deposit).
    - A receipt is generated showing all details (charges, deposit applied, final amount).

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
7. Record the payment in the system.

### Deposit Receiver System

#### Concept
- A **Deposit Receiver** is an entity (person or account) that holds patient deposits on behalf of the clinic.
- Examples: A partner clinic, a staff member, or a specific bank account.
- Staff can create, update, and delete Deposit Receivers.

#### Deposit Receiver Fields
- Name
- Description
- Contact info (optional)
- Current balance (auto‑calculated from deposit records)

#### Deposit Flow with Receiver
1. **Request Deposit:** Staff sets a deposit amount for a specific patient (in TWD or other currency).
   - The requested amount appears on the Agent Dashboard if the patient is agent‑referred.
   - The exchange rate (default: current rate from API) determines the equivalent amount in other currencies.
2. **Patient Makes Deposit:** The patient transfers the deposit to the designated Deposit Receiver.
3. **Record Deposit:** Staff records the deposit in the system, specifying:
   - Patient
   - Amount (with currency)
   - Deposit Receiver (where the deposit was sent)
   - Date
4. **Transfer to Clinic:** The deposit can later be transferred from the Receiver to the clinic account.
   - Staff logs this transition (Receiver → Clinic).
   - The system should track all deposit movements.

### Multi‑Currency Support
- Deposits can be recorded in multiple currencies (TWD, USD, etc.).
- Exchange rates should be displayed (default: current rate from an API).
- The system should show amounts in the patient's preferred currency where applicable.

### Deposit Balance Visibility
- Patient‑level deposit balance is displayed in:
  - Patient Detail page.
  - Payment screens.
  - Deposit Receiver detail page (shows total deposits held by that receiver).

---

## 9. Cashflow Overview Dashboard

### Requirement
- A comprehensive cashflow dashboard that shows the clinic's financial status at a glance.
- Should display:
  - Total patient deposits held (across all receivers and clinic account).
  - Total outstanding charges (amounts not yet paid by patients).
  - Total revenue collected (payments received).
  - Deposits held by each Deposit Receiver.
  - Deposits transferred to the clinic account.
- Data should be filterable by **month** or **year**.
- **Export to Excel** functionality for all data views.

---

## 10. Doctor ID System

### Requirement
- Each doctor must have a **unique, short ID**.
- This ID should be used for identification in appointments, treatments, and other records.
- Example: `DR001`, `DR002`, etc.

---

## 11. Partner Registration Form Updates

### Changes
- **Remove the `Job Title` field** – it should not be required.
- **Rename `Business Address` label to `Contact Address`.**
- Update the placeholder text accordingly.

---

## 12. Patient & Partner Registration – Phone Number Input

### Current Issue
- Users must manually enter the `+` and country code.
- No formatting or validation is applied.

### Requirement
- Replace the free‑text phone input with a **country code dropdown** + **phone number input**.
- The dropdown should list countries, showing the country name and its code.
- **Priority Countries (top of list):**
  1. Taiwan (`+886`)
  2. United States (`+1`)
  3. Myanmar (`+95`)
- **Formatting:**
  - As the user types, the phone number should be formatted according to the selected country's format.
  - Example:
    - US: `(415) 234-5678`
    - Taiwan: `956 781 282`
    - Myanmar: format accordingly.
- **Placeholder:**
  - Show a sample number **starting with 9** (not 0).
  - If the user enters a number starting with `0`, show an alert and remove the leading zero.

---

## 13. Patient Registration – Confirmation Page

### Change
- After registration, the confirmation page should display only the **Patient ID** (e.g., `260006`).
- **Do not show the Display ID.**

---

## 14. Forgot Password System

### For Partners (Agents)
- **Link:** On the Partner Login page (`/partner/login`).
- **Process:**
  1. User enters their registered **Email** and **Date of Birth**.
  2. If matched, the system generates a **password reset link**.
  3. The link is sent to the user's email.
  4. Clicking the link takes the user to a page where they can enter a **new password** and **confirm it**.
  5. Password is updated.
- **Admin Dashboard:**
  - Admin can also generate a password reset link for any agent directly from the dashboard.

### For Doctors
- **Link:** On the Admin Login page (`/jamesHarry`).
- **Process:**
  1. Doctor enters their registered **email**.
  2. A **password reset link** is sent to their email.
  3. Clicking the link redirects to a password reset page.
  4. Doctor enters a **new password** and confirms it.
  5. Password is updated.

### Password Change Logs
- All password changes must be **logged**.
- Logs should include:
  - User ID
  - Timestamp
  - IP address (optional)
- These logs must be viewable in the system (e.g., in the user's detail page or in an admin audit log).
- Recent password changes should appear in the **Recent Activities** section of the Dashboard.

---

## 15. Help / Documentation System

### Requirement
- A **Help Page** accessible from the dashboard.
- Contains a **Search Bar** at the top.
- Users can search for any feature or function in the system.

### Search Behavior
- When a user searches for a term (e.g., "Charges"):
  - The system displays a **card** explaining what "Charges" are.
  - Provides **navigation directions**:
    - `Choose a Patient > Choose a Visit > Choose a Treatment > Charges`
- When a user searches for "Treatments":
  - The card explains treatments and the two ways to access them:
    1. Via **Dashboard Sidebar → Treatments**.
    2. Via **Choose a Patient > Choose a Visit > Treatments**.
- For "Make New Treatment":
  - `Choose a Patient > Choose a Visit > Make New Treatment`

### Scope
- The Help page should cover **all major features and workflows** in the app.
- Each feature should have a clear explanation and step‑by‑step navigation guide.

---

## 16. Implementation Guidelines

### Important Notes for AI
1. **Review existing code first** – understand current functions, components, and logic before making changes.
2. **Do not break existing performance optimizations** (caching, API call reduction, etc.).
3. **Maintain consistency** with the existing code style and architecture.
4. **Respect existing solutions for webpack/turbopack issues** – do not reintroduce problems that were already fixed.
5. **Do not rewrite code unnecessarily** – reuse existing components and logic where possible.

---

## Summary of Key Changes

| Area | Change |
| :--- | :--- |
| **Sidebar** | Make it sticky (does not scroll with content). |
| **Visits** | Introduce visit‑based tracking; separate patient identity from visit details; determine agent commission per visit. |
| **Patient ID** | Use a 6‑digit numeric ID as the primary identifier. |
| **Display ID** | Move to visit‑level identifier with format `{clinic}-{agent}-{patientID}-{date}`. |
| **Treatment & Charges** | Link treatments to visits; add `isAgentRelated` flag per charge; allow editing/deleting charges. |
| **Deposits** | Apply deposit at payment stage (not charge stage); introduce Deposit Receiver system; support multi‑currency. |
| **Cashflow** | Add a financial dashboard with export to Excel. |
| **Doctor ID** | Assign unique short IDs to doctors. |
| **Registration Forms** | Remove Job Title; rename Business Address; add country‑code dropdown for phone numbers with formatting. |
| **Forgot Password** | Implement for Partners and Doctors with logging. |
| **Help Page** | Add a searchable help system with navigation guides for all features. |

---

**End of Specification**