Project Overview

This project is Dark-themed Patient Management, Agent Tracking, and Clinical Survey Web Application designed for a Urology Clinic.
The core objectives are to collect patient responses via multilingual clinical questionnaires (ADAM, IPSS, EHS, PEDT, etc.), instantly show them their potential diagnosis in their chosen language, allow clinic admins to manage patient statuses, and provide external agents with secure, read-only public links to track their referred patients.

1. Tech Stack & Core Architecture

Framework: Next.js 14+ (App Router). Strictly use React Server Components (RSC) and Server Actions for data fetching and mutations. Limit independent API routes unless absolutely necessary.

Language: TypeScript (Strict mode enabled).

Styling: Tailwind CSS.

UI Components: shadcn/ui (Default Dark Mode, clean, no unnecessary clutter, classic professional look).

Database: Supabase (PostgreSQL).

ORM: Prisma.

Authentication: NextAuth.js (Auth.js) v5 (Credentials Provider ONLY).

Form Validation: Zod and React Hook Form.

2. Security & Authentication (Strict Rules)

No Frontend Links: The public frontend (Home, Survey pages) MUST NOT contain any buttons, links, or hidden menus pointing to the Admin Login page.

Obscured Admin Route: The login route MUST NOT be /login or /admin. Use a random/obscured route (e.g., /jamesHarry). This should be configurable via middleware.ts or folder structure.

Credentials Only: Admin/Staff login must rely solely on secure Username/Email and Password. (NO Google, Facebook, or other OAuth providers).

Anti-Hacking Practices:

All Server Actions must include strict Authorization checks (except for public survey submission).

Data validation using Zod schemas is mandatory for all inputs to prevent SQL Injection and malformed data.

Public Agent Links must be strictly read-only. No mutation logic should exist on these pages.

Leverage React's default escaping to prevent XSS.

3. Routing & Pages Workflow

3.1 Homepage (/) -> Form Directory Page

If a user navigates to the root URL (/), they must see a Form Directory Page.

Display elegantly designed cards/buttons for available questionnaires (e.g., ADAM, IPSS, EHS, PEDT). Clicking a card routes the user to /survey/[formId].

3.2 Survey Form Page (/survey/[formId]) - Hybrid Workflow

Dynamic Language Selection: The top of the page must feature a Language Selector (e.g., English, Myanmar, Chinese). The available options must be dynamically derived from the supported languages in questionnaires.ts.

Workflow Logic (Walk-in vs. Pre-registered):

Pre-registered (URL contains ?patientId=...):

Example: /survey/adam_v1?patientId=pt_123abc

Hide all patient demographic input fields. Display only the questionnaire.

Walk-in (No patientId in URL):

Example: /survey/adam_v1

The form MUST require the patient to fill in Name, Age, and Gender before or alongside the questionnaire.

Submission & Instant Diagnosis:

Upon submission, a Server Action is triggered.

For Walk-ins, the Server Action first creates a new Patient in the database (generating a unique ID).

The raw answers are saved to the SurveyResponse table linked to the Patient ID.

The Server Action calculates the score using questionnaires.ts and returns the calculated Diagnosis/Severity.

Result Display: The frontend immediately displays the calculated Diagnosis/Severity to the patient in the language they selected.

3.3 Obscured Admin Dashboard (/dashboard)

Patient Management: A master list of patients with robust Search (by name, phone) and Filter (by agent, status, source) functionalities.

Patient Registration: A manual registration form for admins. Fields: Name (Supports Trilingual text), Phone, Age, Gender, Source (Walk-in, Booking, Agent), Linked Agent, and Status.

Patient Detail View:

Displays basic demographics, current live status (e.g., Pending, Appointed, Treating, Completed), and the linked Agent.

Fetches rawAnswers from the database, runs the scoring logic on the fly, and clearly displays the clinical diagnosis, severity, and total score.

3.4 Agent Management & Public Share Link

Agent List: A dedicated view in the admin dashboard to manage Agents.

Public Share Link Generation: Admin can click a "Share" button on an Agent's profile to copy a secure, tokenized public URL (e.g., /shared/agent/abc-123-xyz) to the clipboard.

Agent Public View: When the Agent opens this URL, they see a read-only dashboard listing ONLY their referred patients and those patients' real-time statuses (e.g., Treatment Completed, Appointed). No login required.

4. Database Schema Requirements (Prisma)

enum PatientStatus {
  PENDING
  APPOINTED
  TREATING
  COMPLETED
}

enum PatientSource {
  AGENT
  BOOKING
  WALKIN
}

model Patient {
  id          String        @id @default(uuid())
  name        String        // Supports Trilingual characters
  phone       String?
  age         Int?
  gender      String?
  source      PatientSource @default(WALKIN)
  status      PatientStatus @default(PENDING)
  agentId     String?       // Nullable, linked if source is AGENT
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  agent       Agent?        @relation(fields: [agentId], references: [id])
  surveys     SurveyResponse[]
}

model Agent {
  id          String    @id @default(uuid())
  name        String
  phone       String?
  shareToken  String    @unique @default(uuid()) // For secure public read-only link
  patients    Patient[]
}

model SurveyResponse {
  id          String   @id @default(uuid())
  patientId   String
  formType    String   // e.g., "adam_v1", "ipss_v1" to support versioning
  rawAnswers  Json     // e.g., {"q1": 1, "q2": 0}
  language    String   // Language used to fill the form (e.g., "mm")
  createdAt   DateTime @default(now())
  
  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
}


5. Questionnaires & Scoring Architecture (questionnaires.ts)

ALL questionnaire structures and scoring logic MUST be hardcoded in lib/constants/questionnaires.ts. This ensures no complex expression engines are needed in the database and allows for strict versioning (e.g., adam_v1, adam_v2).

Required Data Structure Format

export type SupportedLanguage = 'en' | 'mm' | 'zh';

export interface QuestionnaireDefinition {
  id: string; // e.g., "adam_v1"
  title: Record<SupportedLanguage, string>;
  questions: Array<{
    id: string;
    type: "radio" | "select";
    text: Record<SupportedLanguage, string>;
    options: Array<{
      value: number | string;
      label: Record<SupportedLanguage, string>;
    }>;
  }>;
  // Scoring logic configuration
  scoringRules: {
    // Calculates score and returns Multilingual results to show the patient
    calculate: (rawAnswers: Record<string, any>) => { 
      totalScore: number; 
      severity: Record<SupportedLanguage, string>;
      clinicalNote?: Record<SupportedLanguage, string>;
    };
  };
}

// Example Implementation
export const QUESTIONNAIRES: Record<string, QuestionnaireDefinition> = {
  adam_v1: {
    id: "adam_v1",
    title: {
      en: "ADAM Questionnaire",
      mm: "ADAM မေးခွန်းလွှာ",
      zh: "ADAM 问卷"
    },
    questions: [
      {
        id: "q1",
        type: "radio",
        text: {
          en: "Do you have a decrease in libido (sex drive)?",
          mm: "၁။ သင့်တွင် လိင်စိတ်ဆန္ဒ လျော့နည်းလာပါသလား။",
          zh: "1. 您的性欲是否减退？"
        },
        options: [
          { value: 1, label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: 0, label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } }
        ]
      }
      // ... more questions
    ],
    scoringRules: {
      calculate: (answers) => {
        let isPositive = false;
        // Non-linear logic example
        const sumOfOthers = [answers.q2, answers.q3, answers.q4, answers.q5, answers.q6, answers.q8, answers.q9, answers.q10].filter(val => val === 1).length;
        
        if (answers.q1 === 1 || answers.q7 === 1 || sumOfOthers >= 3) {
          isPositive = true;
        }

        return {
          totalScore: isPositive ? 1 : 0,
          severity: {
            en: isPositive ? "Positive Screen (Possible Low Testosterone)" : "Negative",
            mm: isPositive ? "ကျားဟော်မုန်းလျော့နည်းနိုင်ခြေရှိပါသည်" : "ပုံမှန်ဖြစ်ပါသည်။",
            zh: isPositive ? "阳性筛查 (可能低睾酮)" : "阴性"
          },
          clinicalNote: {
            en: "Requires a morning serum total testosterone blood test.",
            mm: "မနက်ပိုင်းတွင် ကျားဟော်မုန်းပမာဏကို သွေးဖောက်စစ်ဆေးရန် လိုအပ်ပါသည်။",
            zh: "需要进行晨间血清总睾酮血液测试。"
          }
        };
      }
    }
  }
};


6. Strict Implementation Guidelines for AI Assistant

Read this document completely. Understand the separation of raw data collection vs. server-side calculation, and the Walk-in vs. Pre-registered workflows.

Initialize Project: Next.js (App Router), Tailwind, shadcn/ui.

Setup Database: Implement the exact Prisma schema defined above.

Implement Constants: Create lib/constants/questionnaires.ts and define at least one complete form (e.g., adam_v1) using the exact multilingual structure provided.

Build Public Survey Route (app/survey/[formId]/page.tsx):

Implement dynamic language selector.

Check for ?patientId. If absent, render Name, Age, Gender fields.

Submit via Server Action. Upon success, display the severity from the calculate function in the selected language.

Implement Obscured Auth: Setup NextAuth credentials at the obscured route (e.g., /jamesHarry).

Build Admin Dashboard: Create layouts, sidebars, and Patient Management views with Search/Filter.

Patient Detail View: Dynamically import scoring logic to compute and display results from rawAnswers. Update patient statuses.

Build Agent Share Feature: Implement /shared/agent/[shareToken]/page.tsx displaying a read-only list of the agent's patients and their current statuses.