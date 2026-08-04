-- AlterTable treatments: add end_date
ALTER TABLE "treatments" ADD COLUMN IF NOT EXISTS "end_date" DATE;

CREATE INDEX IF NOT EXISTS "treatments_end_date_idx" ON "treatments"("end_date");

-- Drop old unique on commission_payments (agent_id, patient_id)
DROP INDEX IF EXISTS "commission_payments_agent_id_patient_id_key";

-- Clear existing commission rows (schema shape change; seed will recreate)
DELETE FROM "commission_payments";

-- Add treatment_id (required after backfill — table empty so NOT NULL is fine)
ALTER TABLE "commission_payments" ADD COLUMN IF NOT EXISTS "treatment_id" TEXT;

-- Make treatment_id NOT NULL if column already existed as nullable from a partial run
ALTER TABLE "commission_payments" ALTER COLUMN "treatment_id" SET NOT NULL;

-- Default currency NTD
ALTER TABLE "commission_payments" ALTER COLUMN "currency" SET DEFAULT 'NTD';
UPDATE "commission_payments" SET "currency" = 'NTD' WHERE "currency" IS NULL OR "currency" = 'USD';

-- Unique + FK for treatment-based commissions
CREATE UNIQUE INDEX IF NOT EXISTS "commission_payments_agent_id_treatment_id_key"
  ON "commission_payments"("agent_id", "treatment_id");

CREATE INDEX IF NOT EXISTS "commission_payments_treatment_id_idx"
  ON "commission_payments"("treatment_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commission_payments_treatment_id_fkey'
  ) THEN
    ALTER TABLE "commission_payments"
      ADD CONSTRAINT "commission_payments_treatment_id_fkey"
      FOREIGN KEY ("treatment_id") REFERENCES "treatments"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable commission_payouts
CREATE TABLE IF NOT EXISTS "commission_payouts" (
  "id" TEXT NOT NULL,
  "agent_id" TEXT NOT NULL,
  "period_month" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NTD',
  "method" "PaymentMethod" NOT NULL,
  "paid_at" TIMESTAMP(3) NOT NULL,
  "remark" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commission_payouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "commission_payouts_agent_id_idx" ON "commission_payouts"("agent_id");
CREATE INDEX IF NOT EXISTS "commission_payouts_period_month_idx" ON "commission_payouts"("period_month");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commission_payouts_agent_id_fkey'
  ) THEN
    ALTER TABLE "commission_payouts"
      ADD CONSTRAINT "commission_payouts_agent_id_fkey"
      FOREIGN KEY ("agent_id") REFERENCES "agents"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
