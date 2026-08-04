-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'ARRIVED';

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "used_qr_code" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "treatment_charges" ADD COLUMN     "deposit_applied" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "patient_deposits" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "payment_date" DATE NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_deposits_patient_id_idx" ON "patient_deposits"("patient_id");

-- CreateIndex
CREATE INDEX "patient_deposits_payment_date_idx" ON "patient_deposits"("payment_date");

-- AddForeignKey
ALTER TABLE "patient_deposits" ADD CONSTRAINT "patient_deposits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_deposits" ADD CONSTRAINT "patient_deposits_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
