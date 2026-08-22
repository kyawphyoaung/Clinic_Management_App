
### Analysis - What left?

| Category | Missing / Incomplete Items |
| :--- | :--- |
| **Core Structure** | • Visit → Treatment linking is not fully functional<br>• Patient ID (6-digit) is not fully implemented as primary identifier<br>• Display ID is still used in many places where Patient ID should be shown<br>• Doctor ID system not implemented |
| **Visit System** | • Visit creation flow is incomplete<br>• Visit update/delete may not work properly<br>• Visit list table does not show linked Treatment IDs correctly<br>• "New Treatment" button inside Visit row not working |
| **Treatment & Charges** | • Edit Charge functionality is missing<br>• Delete Charge functionality is missing<br>• `isAgentRelated` flag per charge not visible or editable<br>• Charge detail view (modal) not implemented or incomplete<br>• Treatment ID and Charge ID (short format) not generated<br>• Net Price color coding (green when Paid) not working<br>• Remaining Balance color coding not implemented |
| **Deposit & Payment** | • Requested Deposit system is incomplete<br>• Multi-currency support not implemented<br>• Deposit Receiver system not built<br>• Deposit application at payment stage not working<br>• Print Receipt function missing<br>• Cashflow overview dashboard missing<br>• Export to Excel missing |
| **SOAP Notes** | • SOAP notes UI (Subjective, Objective, Assessment, Plan) not fully implemented<br>• Vital signs fields (Blood Pressure, Heart Rate, Weight, Height, Temperature) not showing<br>• Notes create/update/delete may not work<br>• Update button dirty-state behavior not functional<br>• Delete confirmation dialog missing<br>• Notes should be in a modal or new page, not inline |
| **Patient Detail Page** | • Section order not matching spec (Deposit Billing, Appointments, Visits, Treatments, Demographics, Consents, Survey Results, Registration Info)<br>• Change Status, Assign Agent, Survey Links positioning not correct<br>• Deposit Billing Balance not showing with gold/orange color<br>• Consents, Survey Results, Registration Info should be collapsible (hide in arrow) |
| **UI / UX** | • Sidebar is not sticky (scrolls with content)<br>• Phone number country code dropdown not implemented<br>• Phone number formatting per country not working<br>• Partner Registration: Job Title field still required<br>• Partner Registration: Business Address label not changed to Contact Address<br>• Forgot Password for Partners not implemented<br>• Forgot Password for Doctors not implemented<br>• Password change logs not recorded<br>• Help / Documentation page missing |
| **Dashboard** | • /dashboard/agents/[id] – Copy Password Reset Link missing<br>• Recent Activities not showing password change events<br>• Cashflow overview not built |
| **Treatment Detail Page** | • Treatment ID only (not Display ID) not implemented<br>• Visit ID not shown in Treatment Info card<br>• Summary card: Remaining Balance color coding (red for positive, purple for negative) missing<br>• Alert icon for negative balance missing<br>• Payments table: Date & Time columns not split<br>• Payments table: Amount in green, Remaining Balance in red<br>• Payments table: Strike-through for paid rows missing<br>• Payments table: View, Update, Delete functions missing<br>• Payments table: Sorting by date/time (newest first) not working |

---

### 📋 English Prompt for AI (Markdown Format)


# Phase 707 v2 – Remaining Work

## Overview
The previous implementation of Phase 707 v2 is incomplete. Many features are missing or not functioning correctly. This document lists all remaining work items that must be completed.

**Important:** The AI must first analyze the existing codebase to understand the current state, then implement each missing feature in the order listed below.

---

## 1. Core Structure Changes

### 1.1 Patient ID System
- Replace Display ID with **6-digit Patient ID** (e.g., `260006`) as the primary identifier.
- Show Patient ID in:
  - `/dashboard/patients` list
  - `/dashboard/patients/[id]` – under patient name
  - `/dashboard/treatments/[id]` – patient info section
- Display ID should ONLY appear in the Visit context (Visit ID format: `{clinicCode}-{agentCode}-{patientID}-{YYMMDD}`).

### 1.2 Doctor ID System
- Assign a **unique short ID** to each doctor (e.g., `DR001`, `DR002`).
- Use this ID in appointments, treatments, and all doctor-related references.

### 1.3 Treatment & Charge IDs
- Generate **short, unique IDs** for each treatment (e.g., `TREAT-001`, `TREAT-002`).
- Generate **short, unique IDs** for each charge (e.g., `CHG-001`, `CHG-002`).

---

## 2. Visit System (Complete)

### 2.1 Visit CRUD
- Create Visit form must include:
  - Patient (auto-selected from patient detail page)
  - Clinic (dropdown)
  - Agent (dropdown, optional – if selected, this visit is agent-referred)
  - Date (default: today)
  - Visit Type (First Visit, Revisit, Follow-up, etc.)
- Update Visit: Allow editing all fields.
- Delete Visit: Confirm before deletion.

### 2.2 Visit List Table (on Patient Detail Page)
- Columns: Visit ID, Date, Clinic, Agent, Source, Treatments (linked Treatment IDs as clickable links).
- If no treatments exist, show a **"New Treatment"** button.
- Clicking "New Treatment" should open the Create Treatment form with the Visit pre-selected.

### 2.3 Visit → Treatment Linking
- Treatments must be linked to a specific Visit.
- When creating a treatment, the user must select which Visit it belongs to.
- Commission eligibility is determined by the Visit's Agent (if the Visit has an Agent → commission applies to all treatments under that Visit).

---

## 3. Treatments & Charges (Complete)

### 3.1 Charge Edit & Delete
- Add **Edit** functionality to each charge.
- Add **Delete** functionality to each charge (with confirmation).
- Editing a charge should allow updating:
  - Service Category
  - Description
  - Quantity
  - Price
  - Notes
  - `isAgentRelated` flag (checkbox)

### 3.2 `isAgentRelated` Flag
- Each charge must have an `isAgentRelated` boolean field.
- **Default:** If the Visit has an Agent → `isAgentRelated = true`.
- **Override:** User can manually change the flag.
- This flag determines whether the charge contributes to agent commission.

### 3.3 Charge Detail View
- Clicking a charge row opens a **detailed view** (modal or page).
- Display:
  - All line items (Category, Notes, Quantity, Price).
  - Total Price.
  - `isAgentRelated` status.
  - Any applied discounts.

### 3.4 Charge Color Coding (Treatment Detail Page)
- **Net Price:** 
  - Green (`#10b981`) if `Paid = Yes`
  - Red (`#ef4444`) if `Paid = No`

### 3.5 Treatment Summary Card (Treatment Detail Page)
- **Remaining Balance:**
  - Red (`#ef4444`) if positive (> 0)
  - Purple (`#8b5cf6`) if negative (< 0)
- Show an **alert icon** with "Something Wrong" if balance is negative.

---

## 4. Payments (Treatment Detail Page)

### 4.1 Payments Table Columns
- **Date & Time** (split into two columns: Date, Time).
- **Amount** (green text).
- **Remaining Balance** (red text).
- **Actions:** View, Update, Delete.

### 4.2 Payment Row Behavior
- Rows sorted by **Date & Time (newest first)**.
- If a payment clears the remaining balance, the row should show **strike-through** text.
- View, Update, Delete functions must work.

### 4.3 Payment Create/Update/Delete
- View: Show payment details in a modal or page.
- Update: Allow editing Payment Method, Date, Time, Notes, Reference.
- Delete: Confirm before deletion.

---

## 5. SOAP Notes (Treatment Notes)

### 5.1 SOAP Fields
- Notes must use **SOAP format**:
  - **Subjective** (textbox)
  - **Objective** (textbox)
  - **Assessment** (textbox)
  - **Plan** (textbox)

### 5.2 Vital Signs
- Include the following vital sign fields:
  - Blood Pressure: **Systolic (mm Hg)** and **Diastolic (mm Hg)** (two separate textboxes).
  - Heart Rate (bpm)
  - Weight (kg)
  - Height (cm)
  - Body Temperature (°C)
- Each field should have an appropriate icon.

### 5.3 Notes CRUD
- **Create:** Add Note button opens a **modal or new page** (not inline).
- **Update:** When editing, changes should enable the **Update button** (dirty-state behavior – button becomes green).
- **Delete:** Confirm before deletion (double confirmation).

### 5.4 Notes Display
- Notes should be viewable in a clean, organized table.
- Clicking a note should open its full content.

---

## 6. Deposit & Payment System

### 6.1 Requested Deposit
- Staff can **request a deposit** from a patient.
- Request fields:
  - Patient (auto-selected)
  - Amount (in TWD)
  - Currency (default: TWD, but can be set to other currencies)
  - Exchange Rate (auto-populated from API, but editable)
  - Date
- Requested Deposit appears on the **Agent Dashboard** if the patient is agent-referred.
- **Update:** Requested Deposit can be updated (e.g., if exchange rate changes) **only if no payment has been made yet**.

### 6.2 Multi-Currency Support
- Deposits can be recorded in multiple currencies (TWD, USD, MMK, etc.).
- Exchange rates should be displayed (default: current rate from API).
- When recording a deposit, the user can select:
  - Currency (TWD, USD, MMK, etc.)
  - Amount
  - Deposit Receiver (where the deposit was sent)

### 6.3 Deposit Receiver System
- Create, Update, Delete Deposit Receivers.
- Each Receiver has:
  - Name
  - Description (optional)
  - Contact info (optional)
  - Current balance (auto-calculated)

### 6.4 Deposit Payment (New Deposit Payment)
- When recording a deposit payment, the user must select:
  - Patient
  - Currency
  - Amount
  - Deposit Receiver (where the money was sent)
- The deposit is added to the patient's **Deposit Balance**.

### 6.5 Deposit Application (at Payment Stage)
- When making a payment, the user can **apply deposit balance** to the payment.
- Options:
  - Apply **full** deposit balance.
  - Apply **partial** deposit amount (custom amount).
- The system calculates the remaining amount to pay.

### 6.6 Print Receipt
- After payment, a **Print Receipt** button should be available.
- Receipt should display:
  - Patient Name & ID
  - Charges (with amounts)
  - Deposit Applied
  - Final Amount Paid
  - Payment Method
  - Date & Time

### 6.7 Cashflow Overview Dashboard
- A dashboard showing:
  - Total patient deposits (held across all receivers and clinic account).
  - Total outstanding charges.
  - Total revenue collected.
  - Deposits held by each Deposit Receiver.
  - Deposits transferred to the clinic account.
- **Export to Excel** for all data views (monthly/yearly).

---

## 7. Patient Detail Page (`/dashboard/patients/[id]`)

### 7.1 Action Bar Changes
- **Remove** the "Assign Clinic" dropdown.
- Keep "Change Status" and "Assign Agent" dropdowns.

### 7.2 Section Order (Top to Bottom)
1. **Change Status** – dropdown list.
2. **Assign Agent** – dropdown with search box.
3. **Survey Links** – hidden behind an arrow (collapsible).
4. **Deposit Billing** – subtitle: `Balance: NT$ 2,500.00` (gold/orange color).
5. **Appointments** – upcoming/past appointments table.
6. **Visits** – visit list table with linked treatments.
7. **Treatments** – treatment list.
8. **Demographics** – patient personal information.
9. **Consents** – hidden behind an arrow (collapsible).
10. **Survey Results** – hidden behind an arrow (collapsible).
11. **Registration Info** – hidden behind an arrow (collapsible).

---

## 8. Treatment Detail Page (`/dashboard/treatments/[id]`)

### 8.1 Title & Patient Info
- Title: `Treatment Detail - [Patient Name]`
- Below title: **Patient ID** only (e.g., `260042`).
- Remove Display ID from this section.
- **Treatment ID** (short format) should be displayed.

### 8.2 Treatment Info Card
- Add **Visit ID** field.

### 8.3 Summary Card
- Move to the top of the page.
- Display:
  - Total Charges
  - Total Paid
  - Remaining Balance (color-coded)
  - Commission (if applicable)

### 8.4 Charges Card
- Show Net Price color coding (green if Paid, red if not).
- Each charge row should have:
  - Edit button
  - Delete button

### 8.5 Payments Card
- Columns: `Date | Time | Amount | Remaining Balance | Actions`
- Amount: Green text.
- Remaining Balance: Red text.
- Rows sorted by Date & Time (newest first).
- Paid rows should show strike-through.

---

## 9. Partner & Doctor Forgot Password

### 9.1 Partner (Agent) Forgot Password
- **Link:** `/partner/login` page.
- **Process:**
  1. User enters Email and Date of Birth.
  2. System validates.
  3. Password reset link is sent to email.
  4. Link opens a page to enter new password (with confirmation).
  5. Password is updated.
- **Admin:** Can generate a "Copy Password Reset Link" button on `/dashboard/agents/[id]` (Copy to clipboard).

### 9.2 Doctor Forgot Password
- **Link:** `/jamesHarry` (Admin Login page).
- **Process:**
  1. Doctor enters email.
  2. Password reset link is sent to email.
  3. Link opens a page to enter new password (with confirmation).
  4. Password is updated.

### 9.3 Password Change Logs
- All password changes must be logged.
- Logs should appear in **Recent Activities** on the Dashboard.

---

## 10. Registration Forms – Phone Number Input

### 10.1 Country Code Dropdown
- Replace the free-text phone input with:
  - **Country Code Dropdown** (showing country name + code)
  - **Phone Number Input**

### 10.2 Priority Countries (Top of List)
1. Taiwan (`+886`)
2. United States (`+1`)
3. Myanmar (`+95`)

### 10.3 Phone Number Formatting
- As the user types, the number should be formatted according to the selected country:
  - **US:** `(415) 234-5678`
  - **Taiwan:** `956 781 282`
  - **Myanmar:** appropriate format.

### 10.4 Placeholder & Validation
- Placeholder example: starts with `9` (not `0`).
- If the user enters `0`, show an alert and remove the leading zero.

---

## 11. Partner Registration Form Updates

### 11.1 Remove Job Title
- `Job Title` field should **not** be required.
- Remove it or make it optional.

### 11.2 Rename Business Address
- Change label from `Business Address` to `Contact Address`.
- Update placeholder text accordingly.

---

## 12. Help / Documentation Page

### 12.1 Search Bar
- A search bar at the top of the page.

### 12.2 Search Results
- When a user searches (e.g., "Charges"):
  - Display a card explaining what "Charges" are.
  - Show navigation directions: `Choose a Patient > Choose a Visit > Choose a Treatment > Charges`
- When a user searches for "Treatments":
  - Explain the two ways to access treatments:
    1. Dashboard Sidebar → Treatments
    2. Choose a Patient > Choose a Visit > Treatments
- For "Make New Treatment":
  - `Choose a Patient > Choose a Visit > Make New Treatment`

### 12.3 Scope
- Cover all major features and workflows in the app.
- Each feature should have a clear explanation and step-by-step guide.

---

## 13. Sidebar Sticky Behavior

### Requirement
- The sidebar must remain **fixed/sticky**.
- It should NOT scroll with the page content.
- It should stay visible at all times.

---

## 14. Implementation Guidelines

### Important Rules for the AI:
1. **Read existing code first** – understand current state before making changes.
2. **Do not break performance optimizations** (caching, API call reduction, etc.).
3. **Maintain consistency** with existing code style and architecture.
4. **Reuse existing components** where possible – do not rewrite unnecessarily.
5. **Test each feature** after implementation.

---

## Summary of Remaining Work

| Priority | Category | Items |
| :---: | :--- | :--- |
| P0 | Core Structure | Patient ID, Doctor ID, Treatment/Charge IDs |
| P0 | Visit System | CRUD, linking, list table, New Treatment |
| P0 | Charges | Edit, Delete, `isAgentRelated`, Detail View, Color Coding |
| P0 | SOAP Notes | Full implementation with modal/page, vital signs, CRUD |
| P1 | Deposits | Requested Deposit, Multi-Currency, Receiver, Payment, Receipt |
| P1 | Patient Detail Page | Section order, action bar, collapsible sections |
| P1 | Treatment Detail Page | Summary card, Payments table, Charge color coding |
| P2 | Forgot Password | Partners, Doctors, Logs |
| P2 | Registration Forms | Phone input with country code, Partner form updates |
| P2 | Help Page | Searchable documentation |
| P2 | Sidebar | Sticky behavior |
| P3 | Cashflow Dashboard | Overview + Export to Excel |

---

**End of Specification**
