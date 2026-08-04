// prisma/seed.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";
import {
  PrismaClient,
  PatientStatus,
  TreatmentStatus,
  ConsentSource,
  CommissionReviewStatus,
  PaymentMethod,
  ServiceCategory,
  AgentStatus,
} from "./generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ============================================================
// Helper Functions
// ============================================================

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================
// Static Data
// ============================================================

const GENDERS = ['male', 'female', 'other'];
const NATIONALITIES = ['US', 'MM', 'TW', 'JP', 'KR', 'SG', 'MY', 'TH', 'VN', 'PH', 'CN', 'HK', 'AU', 'GB'];
const SERVICE_CATEGORIES = ['mens_health_urology', 'executive_screening', 'medical_aesthetics', 'hair_restoration', 'womens_health', 'neurology_wellness', 'preventive_medicine'];
const REFERRAL_SOURCES = ['referral_partner', 'friend_family', 'facebook', 'instagram', 'google_search', 'youtube', 'website', 'other'];
const ASSISTANCE_TYPES = ['airport_transfer', 'hotel_reservation', 'medical_interpreter', 'local_transportation', 'travel_info_only'];
const BUSINESS_TYPES = ['medical_clinic', 'hospital', 'medical_tourism_agency', 'travel_agency', 'insurance_broker', 'corporate_wellness', 'aesthetic_clinic', 'healthcare_consultant', 'community_org', 'health_influencer'];
const PATIENT_ORIGIN = ['US', 'MM', 'CA', 'AU', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'JP', 'KR', 'CN', 'HK', 'IN', 'GB'];
const MEDICAL_SERVICES = ['erectile_dysfunction', 'testosterone_therapy', 'circumcision', 'vasectomy', 'prostate_bladder', 'hair_restoration', 'skin_tightening', 'laser_hair_removal', 'body_sculpting', 'executive_screening', 'preventive_medicine', 'pelvic_floor', 'sleep_disorders', 'chronic_pain', 'cognitive_health'];
const MEDICAL_DOCS = ['medical_reports', 'lab_results', 'imaging', 'medication_list', 'referral_letter', 'surgical_records', 'other'];
const SUPPORTING_DOCS = ['business_registration', 'professional_license', 'company_profile', 'business_card', 'government_id', 'other'];
const COUNTRIES = ['US', 'MM', 'TW', 'JP', 'KR', 'SG', 'MY', 'TH', 'VN', 'PH', 'CN', 'HK', 'AU', 'GB', 'CA', 'IN', 'ID'];

// ============================================================
// Agent Data
// ============================================================

const agents = [
  {
    fullName: 'Aung Ko Ko',
    companyName: 'Golden Health Travel Co., Ltd',
    jobTitle: 'Director',
    countryOfResidence: 'MM',
    businessAddress: 'No. 123, Bogyoke Road, Yangon, Myanmar',
    mobileNumber: '+959123456789',
    whatsapp: '+959123456789',
    lineId: 'aungko.health',
    email: 'aungko@goldenhealth.com',
    website: 'https://goldenhealth.com',
    socialFacebook: 'https://facebook.com/goldenhealth',
    socialInstagram: 'https://instagram.com/goldenhealth',
    socialLinkedin: 'https://linkedin.com/in/aungko',
    socialOther: '',
    businessType: ['medical_tourism_agency', 'travel_agency'],
    businessTypeOther: '',
    yearsInBusiness: '4_to_7',
    monthlyClients: '31_to_50',
    referralServices: ['mens_health_urology', 'executive_screening', 'hair_restoration'],
    referralServicesOther: '',
    patientOriginCountries: ['MM', 'TH', 'SG'],
    patientOriginOther: '',
    estimatedMonthlyReferrals: '11_to_20',
    confirmNoMedicalAdvice: true,
    confirmCustomPackagePrices: true,
    confirmNoOutcomeGuarantees: true,
    confirmPatientPrivacy: true,
    confirmCompliance: true,
    supportingDocuments: ['business_registration', 'company_profile', 'business_card'],
    commissionTierPreference: 'tier_6_10',
    remarks: 'Experienced medical tourism partner with strong network in Southeast Asia.',
    useMasterSignature: true,
    signatureImageUrl: 'https://example.com/signatures/aungko_ko_signature.png',
    declarationAccurateInfo: true,
    declarationNoGuaranteeApproval: true,
    declarationComplianceAgreement: true,
    applicantName: 'Aung Ko Ko',
    signatureDate: new Date('2026-01-15'),
    commissionPercent: 10,
  },
  {
    fullName: 'Thiri Hlaing',
    companyName: 'Wellness Connect Pte Ltd',
    jobTitle: 'CEO & Founder',
    countryOfResidence: 'SG',
    businessAddress: '10 Anson Road, #15-01 International Plaza, Singapore 079903',
    mobileNumber: '+6591234567',
    whatsapp: '+6591234567',
    lineId: 'thiri.wellness',
    email: 'thiri@wellnessconnect.sg',
    website: 'https://wellnessconnect.sg',
    socialFacebook: 'https://facebook.com/wellnessconnect',
    socialInstagram: 'https://instagram.com/wellnessconnect',
    socialLinkedin: 'https://linkedin.com/in/thirihlaing',
    socialOther: '',
    businessType: ['medical_clinic', 'healthcare_consultant'],
    businessTypeOther: '',
    yearsInBusiness: 'more_than_7',
    monthlyClients: '51_to_100',
    referralServices: ['medical_aesthetics', 'womens_health', 'preventive_medicine'],
    referralServicesOther: '',
    patientOriginCountries: ['SG', 'MY', 'ID', 'CN', 'HK'],
    patientOriginOther: '',
    estimatedMonthlyReferrals: 'more_than_20',
    confirmNoMedicalAdvice: true,
    confirmCustomPackagePrices: true,
    confirmNoOutcomeGuarantees: true,
    confirmPatientPrivacy: true,
    confirmCompliance: true,
    supportingDocuments: ['business_registration', 'professional_license', 'company_profile', 'business_card', 'government_id'],
    commissionTierPreference: 'tier_20_plus',
    remarks: 'Premium wellness provider with strong corporate client base.',
    useMasterSignature: true,
    signatureImageUrl: 'https://example.com/signatures/thiri_hlaing_signature.png',
    declarationAccurateInfo: true,
    declarationNoGuaranteeApproval: true,
    declarationComplianceAgreement: true,
    applicantName: 'Thiri Hlaing',
    signatureDate: new Date('2026-01-20'),
    commissionPercent: 12,
  },
];

// ============================================================
// First Names & Last Names for Patients
// ============================================================

const firstNames = ['John', 'Mary', 'David', 'Sarah', 'Mike', 'Emma', 'James', 'Lisa', 'Robert', 'Emily', 'William', 'Olivia', 'Thomas', 'Sophia', 'Daniel', 'Mia', 'Henry', 'Charlotte', 'Samuel', 'Amelia', 'Alexander', 'Ava', 'Benjamin', 'Ella', 'Matthew', 'Grace', 'Oliver', 'Ruby', 'Lucas', 'Lily'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen'];

// ============================================================
// Patient Status Distribution
// ============================================================

const allStatuses: PatientStatus[] = [
  PatientStatus.INQUIRY,
  PatientStatus.QUOTATION_SENT,
  PatientStatus.BOOKING_DEPOSIT_RECEIVED,
  PatientStatus.TELEMEDICINE_SCHEDULED,
  PatientStatus.APPOINTMENT_CONFIRMED,
  PatientStatus.TRAVELING,
  PatientStatus.PATIENT_ARRIVED,
  PatientStatus.TREATMENT,
  PatientStatus.COMPLETED,
  PatientStatus.RESCHEDULED_FOR_FOLLOW_UP,
];

function getRandomStatus(): PatientStatus {
  return pickOne(allStatuses);
}

// ============================================================
// Generate Patient
// ============================================================

function generatePatient(agentId: string, customStatus?: PatientStatus): any {
  const firstName = pickOne(firstNames);
  const lastName = pickOne(lastNames);
  const fullName = `${firstName} ${lastName}`;
  const gender = pickOne(GENDERS);
  const nationality = pickOne(NATIONALITIES);
  const country = pickOne(COUNTRIES);
  const dob = randomDate(new Date('1960-01-01'), new Date('2005-12-31'));
  const isCompleted = customStatus === PatientStatus.COMPLETED;

  // Consent booleans - all true
  const consents = {
    useMasterSignature: true,
    consentInfoAccurate: true,
    consentTreatmentUnderstanding: true,
    consentComprehensive: true,
  };

  return {
    displayId: `00-000-${String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0')}`,
    fullName,
    preferredName: firstName,
    gender,
    dateOfBirth: dob,
    nationality,
    passportNumber: `P${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
    passportExpiry: randomDate(new Date('2027-01-01'), new Date('2035-12-31')),
    countryOfResidence: country,
    streetAddress: `${getRandomInt(100, 999)} ${pickOne(['Main St', 'Oak Ave', 'Maple Rd', 'Cedar Ln', 'Pine Dr'])}`,
    city: pickOne(['Yangon', 'Singapore', 'Kuala Lumpur', 'Bangkok', 'Ho Chi Minh', 'Taipei', 'Tokyo', 'Seoul', 'Hong Kong', 'New York']),
    stateProvince: pickOne(['State A', 'Region B', 'Province C', 'State D']),
    postalCode: String(Math.floor(Math.random() * 90000) + 10000),
    mobileNumber: `+${getRandomInt(60, 99)}9${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
    whatsapp: `+${getRandomInt(60, 99)}9${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
    lineId: `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    emergencyName: `${pickOne(firstNames)} ${pickOne(lastNames)}`,
    emergencyRelationship: pickOne(['Spouse', 'Parent', 'Sibling', 'Child']),
    emergencyPhone: `+${getRandomInt(60, 99)}9${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
    emergencyEmail: `${pickOne(firstNames).toLowerCase()}.${pickOne(lastNames).toLowerCase()}@example.com`,
    serviceCategory: pickOne(SERVICE_CATEGORIES),
    medicalServices: [pickOne(MEDICAL_SERVICES)],
    medicalServicesOther: '',
    previousTreatment: pickOne(['yes', 'no']),
    previousTreatmentDescription: 'Previous treatment was done in home country.',
    underPhysicianCare: pickOne(['yes', 'no']),
    physicianName: pickOne(['Dr. Smith', 'Dr. Lee', 'Dr. Tan', 'Dr. Wong']),
    physicianCountry: pickOne(COUNTRIES),
    hasMedicalReports: pickOne([true, false]),
    hasLabResults: pickOne([true, false]),
    hasImaging: pickOne([true, false]),
    hasMedicationList: pickOne([true, false]),
    hasReferralLetter: pickOne([true, false]),
    hasSurgicalRecords: pickOne([true, false]),
    hasOtherMedicalDocs: pickOne([true, false]),
    wantTelemedicine: pickOne(['yes', 'no']),
    telemedicineLanguage: pickOne(['en', 'mm', 'zh']),
    telemedicineOtherLanguage: '',
    preferredConsultationTime: 'Weekdays 10:00 AM - 2:00 PM',
    preferredTravelMonth: `2026-${String(getRandomInt(6, 12)).padStart(2, '0')}`,
    estimatedStay: `${getRandomInt(5, 14)} days`,
    travelWithCompanion: pickOne(['yes', 'no']),
    companionCount: getRandomInt(0, 3),
    assistanceRequired: pickOne(ASSISTANCE_TYPES) ? [pickOne(ASSISTANCE_TYPES)] : [],
    referralSource: pickOne(REFERRAL_SOURCES),
    referralSourceOther: '',
    partnerName: '',
    partnerId: '',
    ...consents,
    signatureName: fullName,
    signatureImageUrl: `https://example.com/signatures/${fullName.replace(' ', '_').toLowerCase()}_signature.png`,
    consentDate: randomDate(new Date('2026-01-01'), new Date('2026-07-31')),
    currentAgentId: agentId,
    source: 'AGENT',
    status: customStatus || getRandomStatus(),
    registrationLanguage: 'en',
  };
}

// ============================================================
// Generate Treatment & Charges
// ============================================================

const DIAGNOSES = [
  'Erectile Dysfunction',
  'Low Testosterone',
  'Hair Loss',
  'Male Infertility',
  'Prostate Enlargement',
  'Urinary Incontinence',
  'Chronic Kidney Disease',
  'Benign Prostatic Hyperplasia',
];

function generateTreatments(patientId: string, startDate: Date, endDate?: Date): any[] {
  const isCompleted = !!endDate;
  const treatments = [];
  const numTreatments = getRandomInt(1, 3);

  for (let i = 0; i < numTreatments; i++) {
    const treatmentStart = new Date(startDate);
    treatmentStart.setDate(treatmentStart.getDate() + i * getRandomInt(3, 7));

    const treatmentEnd = isCompleted ? new Date(endDate) : undefined;
    if (treatmentEnd) {
      treatmentEnd.setDate(treatmentEnd.getDate() + getRandomInt(7, 14));
    }

    const status: TreatmentStatus = isCompleted ? TreatmentStatus.COMPLETED : TreatmentStatus.ONGOING;

    treatments.push({
      patientId,
      treatmentDate: treatmentStart,
      endDate: treatmentEnd ?? null,
      diagnosis: pickOne(DIAGNOSES),
      doctorId: null, // will create a doctor user in seed
      notes: `Treatment session ${i + 1} for ${pickOne(DIAGNOSES)}`,
      status: status,
    });
  }

  return treatments;
}

function generateCharges(treatmentId: string): any[] {
  const charges = [];
  const numCharges = getRandomInt(1, 4);
  const serviceCategories = Object.values(ServiceCategory);

  for (let i = 0; i < numCharges; i++) {
    const unitPrice = getRandomInt(100, 5000);
    const quantity = getRandomInt(1, 3);
    const totalPrice = unitPrice * quantity;
    const category = pickOne(serviceCategories);

    charges.push({
      treatmentId,
      totalPrice,
      discount: 0,
      depositApplied: 0,
      netPrice: totalPrice,
      lines: {
        create: [
          {
            serviceCategory: category,
            notes: `${pickOne(['Consultation', 'Procedure', 'Medication', 'Lab Test', 'Imaging', 'Accommodation', 'Other'])} - ${pickOne(['Basic', 'Standard', 'Premium', 'Advanced'])}`,
            quantity,
            unitPrice,
          },
        ],
      },
    });
  }

  return charges;
}

function generatePayment(
  treatmentId: string,
  amount: number,
  date: Date,
  recordedById: string,
): any {
  const methods = Object.values(PaymentMethod);
  return {
    treatmentId,
    amount,
    method: pickOne(methods),
    paymentDate: date,
    reference: `PAY-${String(Math.floor(Math.random() * 90000) + 10000)}`,
    notes: "Payment received",
    recordedById,
  };
}

// ============================================================
// Main Seed Function
// ============================================================

async function main() {
  console.log('🌱 Seeding database...');

  // --- Step 1: Create Users ---
  console.log('  👤 Creating users...');

  const adminPassword = await bcrypt.hash('admin123!@#', 10);
  const doctorPassword = await bcrypt.hash('doctor2026', 10);
  const staffPassword = await bcrypt.hash('staff123!@#', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@clinic.com',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Keep legacy doctor1 inactive if treatments/appointments still reference it
  await prisma.user.upsert({
    where: { username: 'doctor1' },
    update: { isActive: false, passwordHash: doctorPassword },
    create: {
      username: 'doctor1',
      email: 'doctor@clinic.com',
      passwordHash: doctorPassword,
      fullName: 'Dr. James Wilson',
      role: 'DOCTOR',
      isActive: false,
    },
  });

  type DoctorSeed = {
    username: string;
    fullName: string;
    email: string;
    specialization: string;
    windows: { dayOfWeek: number; startTime: number; endTime: number }[];
  };

  const doctorSeeds: DoctorSeed[] = [
    {
      username: 'draungmaythu',
      fullName: 'Dr. Aung Myat Thu',
      email: 'draungmaythu@clinic.com',
      specialization: 'Urology',
      windows: [
        { dayOfWeek: 1, startTime: 10 * 60, endTime: 13 * 60 },
        { dayOfWeek: 6, startTime: 10 * 60, endTime: 13 * 60 },
        { dayOfWeek: 2, startTime: 17 * 60, endTime: 20 * 60 },
        { dayOfWeek: 4, startTime: 17 * 60, endTime: 20 * 60 },
        { dayOfWeek: 0, startTime: 10 * 60, endTime: 13 * 60 },
        { dayOfWeek: 0, startTime: 14 * 60, endTime: 17 * 60 },
      ],
    },
    {
      username: 'drsweswehtet',
      fullName: 'Dr. Swe Swe Htet',
      email: 'drsweswehtet@clinic.com',
      specialization: 'Neurology',
      windows: [
        { dayOfWeek: 4, startTime: 17 * 60, endTime: 20 * 60 },
        { dayOfWeek: 0, startTime: 14 * 60, endTime: 17 * 60 },
      ],
    },
    {
      username: 'drnini',
      fullName: 'Dr. Chiang I-Ni',
      email: 'drnini@clinic.com',
      specialization: "Men's Health Self-Pay",
      windows: [
        { dayOfWeek: 1, startTime: 15 * 60 + 30, endTime: 19 * 60 },
        { dayOfWeek: 2, startTime: 7 * 60 + 30, endTime: 18 * 60 },
        { dayOfWeek: 3, startTime: 7 * 60 + 30, endTime: 18 * 60 + 30 },
        { dayOfWeek: 4, startTime: 7 * 60 + 30, endTime: 18 * 60 },
        { dayOfWeek: 5, startTime: 7 * 60 + 30, endTime: 15 * 60 },
        { dayOfWeek: 6, startTime: 9 * 60 + 30, endTime: 15 * 60 },
      ],
    },
  ];

  const seededDoctors: { id: string; username: string; specialization: string }[] = [];
  for (const d of doctorSeeds) {
    const user = await prisma.user.upsert({
      where: { username: d.username },
      update: {
        fullName: d.fullName,
        email: d.email,
        passwordHash: doctorPassword,
        role: 'DOCTOR',
        isActive: true,
      },
      create: {
        username: d.username,
        email: d.email,
        passwordHash: doctorPassword,
        fullName: d.fullName,
        role: 'DOCTOR',
        isActive: true,
      },
    });
    seededDoctors.push({ id: user.id, username: d.username, specialization: d.specialization });

    await prisma.doctorWeeklyAvailability.deleteMany({ where: { doctorId: user.id } });
    if (d.windows.length > 0) {
      await prisma.doctorWeeklyAvailability.createMany({
        data: d.windows.map((w) => ({
          doctorId: user.id,
          dayOfWeek: w.dayOfWeek,
          startTime: w.startTime,
          endTime: w.endTime,
          isActive: true,
        })),
      });
    }
  }

  // Prefer first seeded doctor for treatment/patient fixtures that need a doctorId
  const doctor = await prisma.user.findUniqueOrThrow({
    where: { username: 'draungmaythu' },
  });

  const staff = await prisma.user.upsert({
    where: { username: 'staff1' },
    update: {},
    create: {
      username: 'staff1',
      email: 'staff@clinic.com',
      passwordHash: staffPassword,
      fullName: 'Jane Staff',
      role: 'STAFF',
      isActive: true,
    },
  });

  console.log(`  ✅ Users created: Admin, 3 Doctors, Staff`);
  console.log('  ✅ Doctor weekly availability seeded (Taiwan minutes)');

  // --- Step 1c: Specializations & services ---
  console.log('  🩺 Seeding specializations and clinic services...');
  const specDefs = [
    { name: 'Urology', description: 'Urological consultation and procedures' },
    { name: 'Neurology', description: 'Neurology and wellness' },
    { name: "Men's Health Self-Pay", description: "Men's health self-pay clinic" },
  ];
  const specByName = new Map<string, string>();
  for (const s of specDefs) {
    const row = await prisma.specialization.upsert({
      where: { name: s.name },
      update: { isActive: true, description: s.description },
      create: { ...s, isActive: true },
    });
    specByName.set(s.name, row.id);
  }
  for (const d of seededDoctors) {
    const specializationId = specByName.get(d.specialization);
    if (!specializationId) continue;
    await prisma.doctorSpecialization.upsert({
      where: {
        doctorId_specializationId: {
          doctorId: d.id,
          specializationId,
        },
      },
      update: {},
      create: {
        doctorId: d.id,
        specializationId,
      },
    });
  }

  const serviceDefs = [
    { name: 'Consultation', description: 'Initial consultation', sortOrder: 1 },
    { name: 'Follow-up', description: 'Follow-up visit', sortOrder: 2 },
    { name: 'Telemedicine', description: 'Remote consultation', sortOrder: 3 },
    { name: 'Procedure', description: 'In-clinic procedure', sortOrder: 4 },
  ];
  for (const s of serviceDefs) {
    await prisma.clinicService.upsert({
      where: { name: s.name },
      update: { isActive: true, sortOrder: s.sortOrder, description: s.description },
      create: { ...s, isActive: true },
    });
  }
  console.log('  ✅ Specializations + clinic services seeded');

  // --- Step 2: Create Clinics ---
  console.log('  🏥 Creating clinics...');

  const clinic1 = await prisma.clinic.upsert({
    where: { code: '11' },
    update: {},
    create: { code: '11', name: 'Chunsen Clinic' },
  });

  const clinic2 = await prisma.clinic.upsert({
    where: { code: '12' },
    update: {},
    create: { code: '12', name: 'Revivora Clinic' },
  });

  console.log(`  ✅ Clinics created: ${clinic1.name}, ${clinic2.name}`);

  // --- Step 3: Create Agents ---
  console.log('  🤝 Creating agents...');

  for (const agentData of agents) {
    const existing = await prisma.agent.findFirst({
      where: { email: agentData.email },
    });

    if (!existing) {
      await prisma.agent.create({
        data: {
          ...agentData,
          passwordHash: await bcrypt.hash('admin123!@#', 10),
          status: AgentStatus.ACTIVE,
          partnerId: agentData.fullName.includes('Aung') ? 'ZA1W' : 'ZB2X',
          approvedAt: new Date('2026-01-20'),
          approvedBy: admin.id,
          registrationLanguage: 'en',
        },
      });
    }
  }

  const agentList = await prisma.agent.findMany({
    where: { email: { in: agents.map((a) => a.email) } },
    orderBy: { createdAt: "asc" },
  });

  if (agentList.length < 2) {
    throw new Error(
      `Expected 2 seed agents, found ${agentList.length}. Check agent emails in seed data.`,
    );
  }

  console.log(`  ✅ Agents ready: ${agentList.map((a) => a.fullName).join(", ")}`);

  // --- Step 4: Create Patients with Treatments ---
  console.log('  👥 Creating patients and treatments...');

  const agent1 = agentList[0];
  const agent2 = agentList[1];

  const allPatients = [];

  // --- Agent 1: 6 patients (3 completed, 3 various) ---
  const agent1Patients = [];

  // 3 completed patients for Agent 1
  for (let i = 0; i < 3; i++) {
    const startMonth = 3; // March
    const endMonth = i === 0 ? 5 : i === 1 ? 3 : 4; // May, March, April
    const startDate = new Date(2026, startMonth - 1, getRandomInt(1, 10));
    const endDate = new Date(2026, endMonth - 1, getRandomInt(20, 28));

    const patientData = generatePatient(agent1.id, PatientStatus.COMPLETED);
    // Override dates for completed patients
    patientData.createdAt = startDate;
    patientData.updatedAt = endDate;
    patientData.clinicId = clinic1.id;
    // Set signature date within range
    patientData.consentDate = randomDate(startDate, endDate);

    const patient = await prisma.patient.create({ data: patientData });
    allPatients.push(patient);
    agent1Patients.push({ patient, startDate, endDate, isCompleted: true });
  }

  // 3 non-completed patients for Agent 1 (various statuses)
  const nonCompletedStatuses = [
    PatientStatus.INQUIRY,
    PatientStatus.TRAVELING,
    PatientStatus.TREATMENT,
  ];

  for (let i = 0; i < 3; i++) {
    const startDate = new Date(2026, 6, getRandomInt(1, 15)); // July
    const patientData = generatePatient(agent1.id, nonCompletedStatuses[i]);
    patientData.createdAt = startDate;
    patientData.updatedAt = startDate;
    patientData.clinicId = clinic1.id;
    patientData.consentDate = randomDate(startDate, new Date(2026, 6, 20));

    const patient = await prisma.patient.create({ data: patientData });
    allPatients.push(patient);
    agent1Patients.push({ patient, startDate, endDate: undefined, isCompleted: false });
  }

  // --- Agent 2: 4 patients (2 completed, 2 various) ---
  const agent2Patients = [];

  // 2 completed patients for Agent 2
  for (let i = 0; i < 2; i++) {
    const startMonth = 3 + i; // March, April
    const endMonth = startMonth + 1; // April, May
    const startDate = new Date(2026, startMonth - 1, getRandomInt(1, 15));
    const endDate = new Date(2026, endMonth - 1, getRandomInt(20, 28));

    const patientData = generatePatient(agent2.id, PatientStatus.COMPLETED);
    patientData.createdAt = startDate;
    patientData.updatedAt = endDate;
    patientData.clinicId = clinic2.id;
    patientData.consentDate = randomDate(startDate, endDate);

    const patient = await prisma.patient.create({ data: patientData });
    allPatients.push(patient);
    agent2Patients.push({ patient, startDate, endDate, isCompleted: true });
  }

  // 2 non-completed patients for Agent 2
  const nonCompletedStatuses2 = [
    PatientStatus.APPOINTMENT_CONFIRMED,
    PatientStatus.QUOTATION_SENT,
  ];

  for (let i = 0; i < 2; i++) {
    const startDate = new Date(2026, 6, getRandomInt(10, 25)); // July
    const patientData = generatePatient(agent2.id, nonCompletedStatuses2[i]);
    patientData.createdAt = startDate;
    patientData.updatedAt = startDate;
    patientData.clinicId = clinic2.id;
    patientData.consentDate = randomDate(startDate, new Date(2026, 6, 28));

    const patient = await prisma.patient.create({ data: patientData });
    allPatients.push(patient);
    agent2Patients.push({ patient, startDate, endDate: undefined, isCompleted: false });
  }

  console.log(`  ✅ ${allPatients.length} patients created`);

  // --- Step 5: Create Treatments, Charges, Payments ---
  console.log('  💊 Creating treatments, charges, and payments...');

  const allTreatments = [];

  // Process Agent 1 patients
  for (const { patient, startDate, endDate, isCompleted } of agent1Patients) {
    const treatments = generateTreatments(patient.id, startDate, endDate);
    for (const treatmentData of treatments) {
      const treatment = await prisma.treatment.create({
        data: {
          ...treatmentData,
          doctorId: doctor.id,
          status: isCompleted ? TreatmentStatus.COMPLETED : TreatmentStatus.ONGOING,
        },
      });
      allTreatments.push(treatment);

      // Create charges
      const charges = generateCharges(treatment.id);
      for (const chargeData of charges) {
        await prisma.treatmentCharge.create({ data: chargeData });
      }

      // Create payment if completed and chance (50%)
      if (isCompleted && Math.random() > 0.5) {
        const totalCharge = charges.reduce((sum, c) => sum + c.netPrice, 0);
        const paymentDate = new Date(endDate || startDate);
        paymentDate.setDate(paymentDate.getDate() + getRandomInt(1, 7));
        const paymentData = generatePayment(
          treatment.id,
          totalCharge,
          paymentDate,
          admin.id,
        );
        await prisma.treatmentPayment.create({ data: paymentData });
      }
    }
  }

  // Process Agent 2 patients
  for (const { patient, startDate, endDate, isCompleted } of agent2Patients) {
    const treatments = generateTreatments(patient.id, startDate, endDate);
    for (const treatmentData of treatments) {
      const treatment = await prisma.treatment.create({
        data: {
          ...treatmentData,
          doctorId: doctor.id,
          status: isCompleted ? TreatmentStatus.COMPLETED : TreatmentStatus.ONGOING,
        },
      });
      allTreatments.push(treatment);

      const charges = generateCharges(treatment.id);
      for (const chargeData of charges) {
        await prisma.treatmentCharge.create({ data: chargeData });
      }

      if (isCompleted && Math.random() > 0.4) {
        const totalCharge = charges.reduce((sum, c) => sum + c.netPrice, 0);
        const paymentDate = new Date(endDate || startDate);
        paymentDate.setDate(paymentDate.getDate() + getRandomInt(1, 5));
        const paymentData = generatePayment(
          treatment.id,
          totalCharge,
          paymentDate,
          admin.id,
        );
        await prisma.treatmentPayment.create({ data: paymentData });
      }
    }
  }

  console.log(`  ✅ ${allTreatments.length} treatments created`);

  // --- Step 6: Create Commission Payments for Completed Treatments ---
  console.log('  💰 Creating commission payments...');

  const completedTreatments = await prisma.treatment.findMany({
    where: { status: TreatmentStatus.COMPLETED, endDate: { not: null } },
    include: {
      charges: true,
      patient: { select: { id: true, currentAgentId: true, displayId: true } },
    },
  });

  let commissionCount = 0;
  for (const treatment of completedTreatments) {
    const agentId = treatment.patient.currentAgentId;
    if (!agentId) continue;

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) continue;

    const totalCharges = treatment.charges.reduce(
      (sum, c) => sum + Number(c.netPrice),
      0
    );
    if (totalCharges === 0) continue;

    const commissionAmount =
      (totalCharges * (agent.commissionPercent || 10)) / 100;

    const existingCommission = await prisma.commissionPayment.findUnique({
      where: {
        agentId_treatmentId: {
          agentId: agent.id,
          treatmentId: treatment.id,
        },
      },
    });

    if (!existingCommission) {
      await prisma.commissionPayment.create({
        data: {
          agentId: agent.id,
          patientId: treatment.patientId,
          treatmentId: treatment.id,
          amount: commissionAmount,
          currency: "NTD",
          calculatedAt: treatment.endDate ?? new Date(),
          reviewStatus: CommissionReviewStatus.PENDING_REVIEW,
          paidAt: null,
          paymentMethod: null,
          remark: `Commission for treatment ${treatment.id.slice(0, 8)} (${treatment.patient.displayId})`,
        },
      });
      commissionCount++;
    }
  }

  console.log(`  ✅ ${commissionCount} commission payments created for completed treatments`);

  // --- Step 7: Create ConsentLogs ---
  console.log('  📝 Creating consent logs...');

  for (const patient of allPatients) {
    const consentData = [
      { documentType: 'privacy_policy', version: 'v1' },
      { documentType: 'data_transfer', version: 'v1' },
      { documentType: 'telemedicine_informed_consent', version: 'v1' },
      { documentType: 'booking_refund_policy', version: 'v1' },
    ];

    const consentedAt = patient.consentDate || new Date();

    for (const consent of consentData) {
      await prisma.consentLog.create({
        data: {
          patientId: patient.id,
          documentType: consent.documentType,
          version: consent.version,
          source: ConsentSource.DIGITAL,
          consentedAt: consentedAt,
          ipAddress: '127.0.0.1',
          userAgent: 'Seed Script',
          signatureImageUrl: patient.signatureImageUrl,
        },
      });
    }
  }

  console.log(`  ✅ Consent logs created for all patients`);

  // --- Summary ---
  console.log('\n✅ Seeding complete!');
  console.log(`   - ${agentList.length} agents created`);
  console.log(`   - ${allPatients.length} patients created`);
  console.log(`   - ${allTreatments.length} treatments created`);
  console.log(`   - ${commissionCount} treatment commission payments`);

  console.log('\n📊 Login Credentials:');
  console.log('   Admin:   admin / admin123!@#');
  console.log('   Doctor:  draungmaythu / doctor2026');
  console.log('   Doctor:  drsweswehtet / doctor2026');
  console.log('   Doctor:  drnini / doctor2026');
  console.log('   Staff:   staff1 / staff123!@#');

  console.log('\n   Agent 1: Aung Ko Ko / admin123!@# (Partner ID: ZA1W)');
  console.log('   Agent 2: Thiri Hlaing / admin123!@# (Partner ID: ZB2X)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });