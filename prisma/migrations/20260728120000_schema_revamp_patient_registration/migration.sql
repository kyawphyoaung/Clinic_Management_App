-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('INQUIRY', 'QUOTATION_SENT', 'BOOKING_DEPOSIT_RECEIVED', 'TELEMEDICINE_SCHEDULED', 'APPOINTMENT_CONFIRMED', 'TRAVELING', 'PATIENT_ARRIVED', 'TREATMENT', 'COMPLETED', 'RESCHEDULED_FOR_FOLLOW_UP', 'TREATMENT_CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PatientSource" AS ENUM ('AGENT', 'BOOKING', 'WALKIN');

-- CreateEnum
CREATE TYPE "ConsentSource" AS ENUM ('DIGITAL', 'PAPER');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "CashflowType" AS ENUM ('DEPOSIT', 'CHARGE', 'PAYMENT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK', 'CASH', 'CARD');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "display_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "preferred_name" TEXT,
    "gender" TEXT,
    "date_of_birth" DATE NOT NULL,
    "nationality" TEXT,
    "passport_number" TEXT,
    "passport_expiry" DATE,
    "country_of_residence" TEXT,
    "street_address" TEXT,
    "city" TEXT,
    "state_province" TEXT,
    "postal_code" TEXT,
    "mobile_number" TEXT,
    "whatsapp" TEXT,
    "line_id" TEXT,
    "email" TEXT,
    "emergency_name" TEXT,
    "emergency_relationship" TEXT,
    "emergency_phone" TEXT,
    "emergency_email" TEXT,
    "service_category" TEXT,
    "medical_services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medical_services_other" TEXT,
    "previous_treatment" TEXT,
    "previous_treatment_description" TEXT,
    "under_physician_care" TEXT,
    "physician_name" TEXT,
    "physician_country" TEXT,
    "has_medical_reports" BOOLEAN NOT NULL DEFAULT false,
    "has_lab_results" BOOLEAN NOT NULL DEFAULT false,
    "has_imaging" BOOLEAN NOT NULL DEFAULT false,
    "has_medication_list" BOOLEAN NOT NULL DEFAULT false,
    "has_referral_letter" BOOLEAN NOT NULL DEFAULT false,
    "has_surgical_records" BOOLEAN NOT NULL DEFAULT false,
    "has_other_medical_docs" BOOLEAN NOT NULL DEFAULT false,
    "want_telemedicine" TEXT,
    "telemedicine_language" TEXT,
    "telemedicine_other_language" TEXT,
    "preferred_consultation_time" TEXT,
    "preferred_travel_month" TEXT,
    "estimated_stay" TEXT,
    "travel_with_companion" TEXT,
    "companion_count" INTEGER,
    "assistance_required" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "referral_source" TEXT,
    "referral_source_other" TEXT,
    "partner_name" TEXT,
    "partner_id" TEXT,
    "use_master_signature" BOOLEAN NOT NULL DEFAULT false,
    "consent_info_accurate" BOOLEAN NOT NULL DEFAULT false,
    "consent_treatment_understanding" BOOLEAN NOT NULL DEFAULT false,
    "consent_comprehensive" BOOLEAN NOT NULL DEFAULT false,
    "signature_name" TEXT,
    "signature_image_url" TEXT,
    "consent_date" DATE,
    "clinic_id" TEXT,
    "current_agent_id" TEXT,
    "digitized_by" TEXT,
    "digitized_at" TIMESTAMP(3),
    "source" "PatientSource" NOT NULL DEFAULT 'BOOKING',
    "status" "PatientStatus" NOT NULL DEFAULT 'INQUIRY',
    "appointment_date" TIMESTAMP(3),
    "appointment_status" "AppointmentStatus",
    "registration_language" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT,
    "status" "AgentStatus" NOT NULL DEFAULT 'PENDING',
    "full_name" TEXT NOT NULL,
    "company_name" TEXT,
    "job_title" TEXT,
    "country_of_residence" TEXT,
    "business_address" TEXT,
    "mobile_number" TEXT,
    "whatsapp" TEXT,
    "line_id" TEXT,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "social_facebook" TEXT,
    "social_instagram" TEXT,
    "social_linkedin" TEXT,
    "social_other" TEXT,
    "business_type" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "business_type_other" TEXT,
    "years_in_business" TEXT,
    "monthly_clients" TEXT,
    "referral_services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "referral_services_other" TEXT,
    "patient_origin_countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "patient_origin_other" TEXT,
    "estimated_monthly_referrals" TEXT,
    "confirm_no_medical_advice" BOOLEAN NOT NULL DEFAULT false,
    "confirm_custom_package_prices" BOOLEAN NOT NULL DEFAULT false,
    "confirm_no_outcome_guarantees" BOOLEAN NOT NULL DEFAULT false,
    "confirm_patient_privacy" BOOLEAN NOT NULL DEFAULT false,
    "confirm_compliance" BOOLEAN NOT NULL DEFAULT false,
    "supporting_documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commission_tier_preference" TEXT,
    "remarks" TEXT,
    "use_master_signature" BOOLEAN NOT NULL DEFAULT false,
    "signature_image_url" TEXT,
    "declaration_accurate_info" BOOLEAN NOT NULL DEFAULT false,
    "declaration_no_guarantee_approval" BOOLEAN NOT NULL DEFAULT false,
    "declaration_compliance_agreement" BOOLEAN NOT NULL DEFAULT false,
    "applicant_name" TEXT,
    "signature_date" DATE,
    "password_hash" TEXT,
    "commission_percent" DOUBLE PRECISION,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "registration_language" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_logs" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT,
    "agent_id" TEXT,
    "document_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "source" "ConsentSource" NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "staff_id" TEXT,
    "physical_location" TEXT,
    "signature_image_url" TEXT,
    "staff_declaration" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yearly_patient_sequences" (
    "year" INTEGER NOT NULL,
    "last_seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "yearly_patient_sequences_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "agent_set_password_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_set_password_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashflows" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "type" "CashflowType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "bank_account_id" TEXT,
    "remark" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cashflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_status_logs" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "old_status" "PatientStatus" NOT NULL,
    "new_status" "PatientStatus" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "remark" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_payments" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "payment_method" "PaymentMethod",
    "remark" TEXT,

    CONSTRAINT "commission_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "form_type" TEXT NOT NULL,
    "raw_answers" JSONB NOT NULL,
    "language" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_display_id_key" ON "patients"("display_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinics_code_key" ON "clinics"("code");

-- CreateIndex
CREATE UNIQUE INDEX "agents_partner_id_key" ON "agents"("partner_id");

-- CreateIndex
CREATE INDEX "consent_logs_patient_id_idx" ON "consent_logs"("patient_id");

-- CreateIndex
CREATE INDEX "consent_logs_agent_id_idx" ON "consent_logs"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_set_password_tokens_token_key" ON "agent_set_password_tokens"("token");

-- CreateIndex
CREATE INDEX "agent_set_password_tokens_agent_id_idx" ON "agent_set_password_tokens"("agent_id");

-- CreateIndex
CREATE INDEX "cashflows_patient_id_idx" ON "cashflows"("patient_id");

-- CreateIndex
CREATE INDEX "patient_status_logs_patient_id_idx" ON "patient_status_logs"("patient_id");

-- CreateIndex
CREATE INDEX "commission_payments_agent_id_idx" ON "commission_payments"("agent_id");

-- CreateIndex
CREATE INDEX "commission_payments_patient_id_idx" ON "commission_payments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_date_idx" ON "appointments"("date");

-- CreateIndex
CREATE INDEX "survey_responses_patient_id_idx" ON "survey_responses"("patient_id");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_current_agent_id_fkey" FOREIGN KEY ("current_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_set_password_tokens" ADD CONSTRAINT "agent_set_password_tokens_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashflows" ADD CONSTRAINT "cashflows_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashflows" ADD CONSTRAINT "cashflows_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_status_logs" ADD CONSTRAINT "patient_status_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
