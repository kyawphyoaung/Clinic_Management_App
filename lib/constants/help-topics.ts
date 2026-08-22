export type HelpTopic = {
  id: string;
  title: string;
  keywords: string[];
  explanation: string;
  paths: string[];
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "patients",
    title: "Patients",
    keywords: ["patient", "registration", "patient id"],
    explanation:
      "A patient is the person receiving care. Each patient has a permanent 6-digit Patient ID used across clinics and visits.",
    paths: ["Dashboard Sidebar → Patients"],
  },
  {
    id: "visits",
    title: "Visits",
    keywords: ["visit", "display id", "walk-in", "referral"],
    explanation:
      "A visit is one physical attendance at a clinic. Commission eligibility is decided per visit (agent referral vs walk-in). The Display ID belongs to the visit, not the patient.",
    paths: ["Choose a Patient → Visits → New Visit"],
  },
  {
    id: "treatments",
    title: "Treatments",
    keywords: ["treatment", "diagnosis", "treat"],
    explanation:
      "Treatments record clinical work for a specific visit. Each treatment has a short ID such as TREAT-001.",
    paths: [
      "Dashboard Sidebar → Treatments",
      "Choose a Patient → Choose a Visit → Treatments → Make New Treatment",
    ],
  },
  {
    id: "charges",
    title: "Charges",
    keywords: ["charge", "chg", "price", "line item"],
    explanation:
      "Charges are billed line items on a treatment. Staff can mark whether a charge is agent-related for commission. Click a charge row to see details, then edit or delete unpaid charges.",
    paths: ["Choose a Patient → Choose a Visit → Choose a Treatment → Charges"],
  },
  {
    id: "payments",
    title: "Make New Payment",
    keywords: ["payment", "receipt", "pay"],
    explanation:
      "Payments settle selected charges. Deposit balance can be applied at payment time. Commission is calculated on original charge amounts, not after deposit.",
    paths: ["Choose a Patient → Choose a Visit → Choose a Treatment → Make New Payment"],
  },
  {
    id: "deposits",
    title: "Deposits",
    keywords: ["deposit", "receiver", "currency"],
    explanation:
      "Each patient has a deposit balance. Record deposits against a Deposit Receiver. Apply deposits when making a payment, not when adding a charge.",
    paths: [
      "Choose a Patient → Deposits",
      "Dashboard Sidebar → Deposit Receivers",
    ],
  },
  {
    id: "appointments",
    title: "Appointments",
    keywords: ["appointment", "booking", "calendar"],
    explanation:
      "Appointments can be created by staff, doctors, partners, or public booking links.",
    paths: ["Dashboard Sidebar → Appointments"],
  },
  {
    id: "agents",
    title: "Agents / Partners",
    keywords: ["agent", "partner", "referral"],
    explanation:
      "Partners refer patients. Commission is earned only for treatments completed during visits they referred.",
    paths: ["Dashboard Sidebar → Agents"],
  },
  {
    id: "commission",
    title: "Commission",
    keywords: ["commission", "agent billing"],
    explanation:
      "Commission = sum of (charge amount × agent rate) for charges flagged isAgentRelated on an agent-referred visit.",
    paths: ["Dashboard Sidebar → Agent Billing", "Dashboard Sidebar → Commission Payments"],
  },
  {
    id: "cashflow",
    title: "Cashflow",
    keywords: ["cashflow", "excel", "finance"],
    explanation:
      "The cashflow dashboard summarizes deposits held, outstanding charges, revenue collected, and transfers to the clinic. Export as CSV/Excel.",
    paths: ["Dashboard Sidebar → Cashflow"],
  },
];
