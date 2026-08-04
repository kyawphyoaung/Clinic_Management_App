-- CreateEnum
CREATE TYPE "CommissionReviewStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'PAID');

-- AlterTable CommissionPayment
ALTER TABLE "commission_payments" ADD COLUMN IF NOT EXISTS "review_status" "CommissionReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW';

UPDATE "commission_payments" SET "review_status" = 'PAID' WHERE "paid_at" IS NOT NULL;

-- Deduplicate commission_payments before unique constraint (keep latest per agent+patient)
DELETE FROM "commission_payments" a
USING "commission_payments" b
WHERE a.agent_id = b.agent_id
  AND a.patient_id = b.patient_id
  AND a.id <> b.id
  AND a.calculated_at < b.calculated_at;

CREATE UNIQUE INDEX IF NOT EXISTS "commission_payments_agent_id_patient_id_key"
  ON "commission_payments"("agent_id", "patient_id");

-- Remap TreatmentStatus enum: ACTIVE/COMPLETED/CANCELLED -> ONGOING/COMPLETED/FOLLOW_UP_SCHEDULED
ALTER TABLE "treatments" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "TreatmentStatus_new" AS ENUM ('ONGOING', 'COMPLETED', 'FOLLOW_UP_SCHEDULED');

ALTER TABLE "treatments"
  ALTER COLUMN "status" TYPE "TreatmentStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'ACTIVE' THEN 'ONGOING'::"TreatmentStatus_new"
      WHEN "status"::text = 'CANCELLED' THEN 'FOLLOW_UP_SCHEDULED'::"TreatmentStatus_new"
      WHEN "status"::text = 'COMPLETED' THEN 'COMPLETED'::"TreatmentStatus_new"
      WHEN "status"::text = 'ONGOING' THEN 'ONGOING'::"TreatmentStatus_new"
      WHEN "status"::text = 'FOLLOW_UP_SCHEDULED' THEN 'FOLLOW_UP_SCHEDULED'::"TreatmentStatus_new"
      ELSE 'ONGOING'::"TreatmentStatus_new"
    END
  );

DROP TYPE "TreatmentStatus";
ALTER TYPE "TreatmentStatus_new" RENAME TO "TreatmentStatus";

ALTER TABLE "treatments" ALTER COLUMN "status" SET DEFAULT 'ONGOING'::"TreatmentStatus";
