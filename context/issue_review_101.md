## Overview

Infrastructure issues (Supabase bucket, Prisma migration) are resolved. This document focuses **only on remaining UI/UX bugs, form behavior issues, and missing features** that need to be fixed before the registration flows are production-ready.

**Priority:** High – All issues block user registration or degrade user experience.

---

## Patient Registration (`/register`) – Issues to Fix

### Issue 1: Missing "Copy Patient Registration Link" Button

**Location:** Admin Dashboard → Patient Page (`/dashboard/patients`)

**Requirement:**

- Add a **"Copy Patient Registration Link"** button on `/dashboard/patients`.
- On click, copy `https://[domain]/register` to clipboard.
- Show toast notification: "Registration link copied to clipboard!"

**Files to modify:**

- `app/dashboard/patients/page.tsx`
- `components/dashboard/patient-actions.tsx` (create if needed)

---



### Issue 2: Section E – Auto-Ticked Green Checkmark (False Positive)

**Location:** Patient Registration – Section E (Medical Records)

**Description:**  
Section E shows a **green checkmark** (complete) even when no fields have been filled. Since Section E contains optional document availability checkboxes, it should show **incomplete** (red dot) until at least one checkbox is checked.

**Requirement:**

- Section E status MUST be "incomplete" (red dot / empty circle) by default.
- Status becomes "complete" (green checkmark) **only when at least one checkbox is checked**.

**Files to modify:**

- `components/config-driven-form/section-tab-bar.tsx`
- `lib/utils/config-driven-form.ts` (section completion logic)

---



### Issue 3: Passport Expiry Date – Missing Date Picker

**Location:** Patient Registration – Section A (Personal Information)

**Requirement:**

- Replace text input with a **date picker** (HTML5 `<input type="date">` or shadcn DatePicker).
- Must follow the app's dark theme (dark background, gold/champagne accents).

**Files to modify:**

- `components/config-driven-form/field-renderer.tsx` (for `type: "date"`)
- `components/config-driven-form/date-picker.tsx` (create if needed)

---



### Issue 4: Phone Number Validation – Must Start with "+"

**Location:** All phone number fields (`mobile_number`, `whatsapp`)

**Requirement:**

- If a phone number is entered **without** `+`, show validation error immediately.
- Auto-add `+` if user types digits only (e.g., `959123456789` → `+959123456789`).
- Show error message: "Phone number must start with '+'" with red border.

**Files to modify:**

- `components/config-driven-form/field-renderer.tsx`
- `lib/validations/patient-reg-client.ts` (add validation pattern: `^\+[1-9]\d{1,14}$`)

---



### Issue 5: Section C – Medical Services Checkboxes Not Ticking

**Location:** Patient Registration – Section C (Requested Medical Service)

**Description:**  
After selecting a category, the medical service checkboxes appear but clicking them does **not** toggle the checkbox.

**Requirement:**

- Medical service checkboxes MUST toggle (tick/un-tick) when clicked.
- Selected services must be submitted correctly.

**Files to modify:**

- `components/config-driven-form/field-renderer.tsx` (checkbox-group handling)
- Check `field.name` and `value` binding in react-hook-form

---



### Issue 6: Section G – Preferred Month of Travel – Missing Month Picker

**Location:** Patient Registration – Section G (Travel Information)

**Requirement:**

- Use a **month picker** (HTML5 `<input type="month">` or shadcn MonthPicker).
- **Constraint:** Only allow months **from today onward** (past months disabled).
- Format: `YYYY-MM` for submission.

**Files to modify:**

- `components/config-driven-form/field-renderer.tsx`
- `components/config-driven-form/month-picker.tsx` (create if needed)

---



### Issue 7: Section G – Assistance Checkboxes Not Ticking

**Location:** Patient Registration – Section G (Travel Information) – "Do you require assistance with:"

**Description:**  
The assistance checkboxes do **not** tick when clicked.

**Requirement:**

- Assistance checkboxes MUST toggle (tick/un-tick) when clicked.
- Selected options must be submitted correctly.

**Files to modify:**

- Same root cause as Issue 5 (checkbox-group handling).

---



### Issue 8: Required Fields – Missing Red `*` Indicator

**Location:** All sections (Patient Registration)

**Requirement:**

- Every `required: true` field MUST show a **red** `*` next to its label.
- Example: `Full Name *` (red asterisk).

**Files to modify:**

- `components/config-driven-form/field-renderer.tsx`
- `components/config-driven-form/form-label.tsx`

---



## Agent Registration (`/partner/register`) – Issues to Fix



### Issue 9: Missing "Copy Partner Registration Link" Button

**Location:** Admin Dashboard → Agent Page

**Requirement:**

- Add a **"Copy Partner Registration Link"** button on the Agent dashboard page.
- On click, copy `https://[domain]/partner/register` to clipboard.
- Show toast notification: "Partner registration link copied to clipboard!"

**Files to modify:**

- `app/dashboard/agents/page.tsx`
- `components/dashboard/agent-actions.tsx` (create if needed)

---



### Issue 10: Section E – Auto-Ticked Green Checkmark (False Positive)

**Location:** Agent Registration – Section E (Supporting Documents)

**Description:**  
Same as Issue 2 – Section E shows green checkmark even when no document checkboxes are checked.

**Requirement:**

- Section E status MUST be "incomplete" (red dot) by default.
- Status becomes "complete" (green checkmark) **only when at least one checkbox is checked**.

**Files to modify:**

- Same as Issue 2 (shared component logic)

---



### Issue 11: Agent Form – Required Fields Missing Red `*` Indicator

**Location:** All sections (Agent Registration)

**Requirement:**

- Same as Issue 8 – Every `required: true` field MUST show a red `*`.

**Files to modify:**

- Same as Issue 8 (shared component logic)

---



### Issue 12: Agent Form – Phone Number Validation

**Location:** Agent Registration – `mobile_number`, `whatsapp`

**Requirement:**

- Same as Issue 4 – Must start with `+`.

**Files to modify:**

- `lib/validations/agent-reg-client.ts` (add validation pattern)

---



### Issue 13: Agent Section C – Checkboxes Not Ticking

**Location:** Agent Registration – Section C (Referral Information)

**Description:**  
The following checkboxes do **not** tick when clicked:

- Which medical services are you most interested in referring to?
- Which countries are your patients primarily from?

**Requirement:**

- All checkboxes in Section C MUST toggle (tick/un-tick) when clicked.
- Selected options must be submitted correctly.

**Files to modify:**

- `components/config-driven-form/field-renderer.tsx` (checkbox-group handling)
- Check `field.name` and `value` binding in react-hook-form

---



## Dashboard UI Improvements



### Issue 14: Hide "Register Patient" Nav Link

**Location:** Dashboard navigation menu

**Requirement:**

- Remove/hide the "Register Patient" navigation link from the dashboard sidebar/menu.
- Staff should use the "Copy Patient Registration Link" button instead (Issue 1).

**Files to modify:**

- `components/dashboard/sidebar.tsx` or `components/dashboard/nav-menu.tsx`

---



## Config File Alignment Notes

If issues involve checkbox rendering, the following config files may need updates:


| Config File                         | Potential Changes                                                          |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `lib/constants/patient_reg_form.ts` | Fix `medical_services[]` checkbox field structure                          |
| `lib/constants/agent_reg_form.ts`   | Fix `referral_services[]` and `patient_origin_countries[]` checkbox fields |
| `lib/constants/form-types.ts`       | Ensure `checkbox-group` type is properly defined                           |


**Important:** The UI should be config-driven. If checkbox rendering fails, the issue is likely in the field renderer, not the config, but config may need alignment if field names or values are malformed.

---



## Implementation Order (Recommended)


| Priority | Issue                                     | Impact            |
| -------- | ----------------------------------------- | ----------------- |
| **P0**   | Issue 5 & 7 & 13 (Checkboxes not ticking) | Blocks data entry |
| **P0**   | Issue 2 & 10 (False green checkmark)      | Confuses users    |
| **P1**   | Issue 3 & 6 (Date pickers)                | Poor UX           |
| **P1**   | Issue 8 & 11 (Red `*` indicator)          | Poor UX           |
| **P1**   | Issue 4 & 12 (Phone validation)           | Data quality      |
| **P2**   | Issue 1 & 9 (Copy link buttons)           | Missing feature   |
| **P2**   | Issue 14 (Remove nav link)                | UI cleanup        |


---

## Notes for Cursor AI

1. **Read all related files before modifying:** `field-renderer.tsx`, `section-tab-bar.tsx`, config files, validation files.
2. **Fix checkbox issues first** – they are the most critical for data entry.
3. **Share component logic** between Patient and Agent forms where possible.
---

**Cursor:** Follow this specification exactly. Start with P0 issues (checkbox fixes), then proceed to P1, P2.Focus only on the issues listed above.