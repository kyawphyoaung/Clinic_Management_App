-- Phase 502: publicId + specializations + clinic services

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "public_id" TEXT;

-- Backfill short public IDs for existing rows
DO $$
DECLARE
  r RECORD;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  candidate TEXT;
  ok BOOLEAN;
BEGIN
  FOR r IN SELECT id FROM appointments WHERE public_id IS NULL LOOP
    LOOP
      candidate := '';
      FOR i IN 1..4 LOOP
        candidate := candidate || substr(chars, 1 + floor(random() * 36)::int, 1);
      END LOOP;
      SELECT NOT EXISTS (
        SELECT 1 FROM appointments WHERE public_id = candidate
      ) INTO ok;
      EXIT WHEN ok;
    END LOOP;
    UPDATE appointments SET public_id = candidate WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE "appointments" ALTER COLUMN "public_id" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "appointments_public_id_key" ON "appointments"("public_id");

CREATE TABLE IF NOT EXISTS "specializations" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "specializations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "specializations_name_key" ON "specializations"("name");

CREATE TABLE IF NOT EXISTS "doctor_specializations" (
  "id" TEXT NOT NULL,
  "doctor_id" TEXT NOT NULL,
  "specialization_id" TEXT NOT NULL,
  CONSTRAINT "doctor_specializations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "doctor_specializations_doctor_id_specialization_id_key"
  ON "doctor_specializations"("doctor_id", "specialization_id");
CREATE INDEX IF NOT EXISTS "doctor_specializations_doctor_id_idx"
  ON "doctor_specializations"("doctor_id");
CREATE INDEX IF NOT EXISTS "doctor_specializations_specialization_id_idx"
  ON "doctor_specializations"("specialization_id");

ALTER TABLE "doctor_specializations"
  DROP CONSTRAINT IF EXISTS "doctor_specializations_doctor_id_fkey";
ALTER TABLE "doctor_specializations"
  ADD CONSTRAINT "doctor_specializations_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_specializations"
  DROP CONSTRAINT IF EXISTS "doctor_specializations_specialization_id_fkey";
ALTER TABLE "doctor_specializations"
  ADD CONSTRAINT "doctor_specializations_specialization_id_fkey"
  FOREIGN KEY ("specialization_id") REFERENCES "specializations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "clinic_services" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "clinic_services_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "clinic_services_name_key" ON "clinic_services"("name");
CREATE INDEX IF NOT EXISTS "clinic_services_is_active_sort_order_idx"
  ON "clinic_services"("is_active", "sort_order");
