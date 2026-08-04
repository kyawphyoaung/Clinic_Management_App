-- Phase 501: Appointment system rewrite + doctor availability

-- Remap AppointmentStatus enum (stub SCHEDULED/COMPLETED → PENDING/RESCHEDULED)
ALTER TABLE "patients" ALTER COLUMN "appointment_status" DROP DEFAULT;
ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "AppointmentStatus_new" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'RESCHEDULED',
  'CANCELLED',
  'NO_SHOW'
);

ALTER TABLE "patients"
  ALTER COLUMN "appointment_status" TYPE "AppointmentStatus_new"
  USING (
    CASE
      WHEN "appointment_status"::text = 'SCHEDULED' THEN 'PENDING'::"AppointmentStatus_new"
      WHEN "appointment_status"::text = 'CONFIRMED' THEN 'CONFIRMED'::"AppointmentStatus_new"
      WHEN "appointment_status"::text = 'COMPLETED' THEN 'CONFIRMED'::"AppointmentStatus_new"
      WHEN "appointment_status"::text = 'CANCELLED' THEN 'CANCELLED'::"AppointmentStatus_new"
      WHEN "appointment_status"::text = 'NO_SHOW' THEN 'NO_SHOW'::"AppointmentStatus_new"
      WHEN "appointment_status"::text = 'PENDING' THEN 'PENDING'::"AppointmentStatus_new"
      WHEN "appointment_status"::text = 'RESCHEDULED' THEN 'RESCHEDULED'::"AppointmentStatus_new"
      ELSE NULL
    END
  );

-- Drop stub appointments table (unused) and recreate with full schema
DROP TABLE IF EXISTS "appointments";

DROP TYPE "AppointmentStatus";
ALTER TYPE "AppointmentStatus_new" RENAME TO "AppointmentStatus";

CREATE TYPE "AppointmentCreatedByType" AS ENUM (
  'PUBLIC',
  'PATIENT_LINK',
  'AGENT',
  'STAFF',
  'DOCTOR'
);

ALTER TABLE "patients"
  ADD COLUMN IF NOT EXISTS "booking_share_token" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "patients_booking_share_token_key"
  ON "patients"("booking_share_token");

CREATE TABLE "appointments" (
  "id" TEXT NOT NULL,
  "display_id" TEXT NOT NULL,
  "patient_id" TEXT,
  "doctor_id" TEXT NOT NULL,
  "clinic_id" TEXT,
  "service" TEXT NOT NULL,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "preferred_language" TEXT,
  "phone_encrypted" TEXT,
  "referral_code" TEXT,
  "share_token" TEXT,
  "reschedule_token" TEXT,
  "created_by_type" "AppointmentCreatedByType" NOT NULL,
  "created_by_id" TEXT,
  "cancelled_at" TIMESTAMPTZ,
  "no_show_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "appointments_display_id_key" ON "appointments"("display_id");
CREATE UNIQUE INDEX "appointments_share_token_key" ON "appointments"("share_token");
CREATE UNIQUE INDEX "appointments_reschedule_token_key" ON "appointments"("reschedule_token");
CREATE INDEX "appointments_doctor_id_starts_at_idx" ON "appointments"("doctor_id", "starts_at");
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");
CREATE INDEX "appointments_starts_at_idx" ON "appointments"("starts_at");

-- Partial unique: one active booking per doctor+start (cancelled slots can be reused)
CREATE UNIQUE INDEX "appointments_doctor_starts_active_key"
  ON "appointments"("doctor_id", "starts_at")
  WHERE "status" <> 'CANCELLED';

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "doctor_weekly_availability" (
  "id" TEXT NOT NULL,
  "doctor_id" TEXT NOT NULL,
  "day_of_week" INTEGER NOT NULL,
  "start_time" INTEGER NOT NULL,
  "end_time" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "doctor_weekly_availability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "doctor_weekly_availability_doctor_id_day_of_week_start_time_end_time_key"
  ON "doctor_weekly_availability"("doctor_id", "day_of_week", "start_time", "end_time");
CREATE INDEX "doctor_weekly_availability_doctor_id_idx"
  ON "doctor_weekly_availability"("doctor_id");

ALTER TABLE "doctor_weekly_availability"
  ADD CONSTRAINT "doctor_weekly_availability_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "doctor_availability_overrides" (
  "id" TEXT NOT NULL,
  "doctor_id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "is_blocked" BOOLEAN NOT NULL DEFAULT false,
  "start_time" INTEGER,
  "end_time" INTEGER,
  "reason" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "doctor_availability_overrides_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "doctor_availability_overrides_doctor_id_date_idx"
  ON "doctor_availability_overrides"("doctor_id", "date");

ALTER TABLE "doctor_availability_overrides"
  ADD CONSTRAINT "doctor_availability_overrides_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
