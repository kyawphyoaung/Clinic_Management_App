DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RequestedDepositStatus') THEN
    CREATE TYPE "RequestedDepositStatus" AS ENUM ('REQUESTED', 'SENT', 'PAID', 'CANCELLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "requested_deposits" (
  "id" TEXT PRIMARY KEY,
  "patient_id" TEXT NOT NULL,
  "treatment_id" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TWD',
  "exchange_rate" DECIMAL(12,6) NOT NULL DEFAULT 1,
  "amount_twd" DECIMAL(12,2) NOT NULL,
  "status" "RequestedDepositStatus" NOT NULL DEFAULT 'REQUESTED',
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paid_at" TIMESTAMP(3),
  "reference" TEXT,
  "notes" TEXT,
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "requested_deposits_patient_id_idx" ON "requested_deposits"("patient_id");
CREATE INDEX IF NOT EXISTS "requested_deposits_treatment_id_idx" ON "requested_deposits"("treatment_id");
CREATE INDEX IF NOT EXISTS "requested_deposits_status_idx" ON "requested_deposits"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'requested_deposits_patient_id_fkey'
  ) THEN
    ALTER TABLE "requested_deposits"
      ADD CONSTRAINT "requested_deposits_patient_id_fkey"
      FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'requested_deposits_treatment_id_fkey'
  ) THEN
    ALTER TABLE "requested_deposits"
      ADD CONSTRAINT "requested_deposits_treatment_id_fkey"
      FOREIGN KEY ("treatment_id") REFERENCES "treatments"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'requested_deposits_created_by_id_fkey'
  ) THEN
    ALTER TABLE "requested_deposits"
      ADD CONSTRAINT "requested_deposits_created_by_id_fkey"
      FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
