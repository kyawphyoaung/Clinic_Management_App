-- CreateTable
CREATE TABLE "treatment_charge_lines" (
    "id" TEXT NOT NULL,
    "charge_id" TEXT NOT NULL,
    "service_category" "ServiceCategory" NOT NULL,
    "notes" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_charge_lines_pkey" PRIMARY KEY ("id")
);

-- Migrate legacy flat charge fields into one line each
INSERT INTO "treatment_charge_lines" ("id", "charge_id", "service_category", "notes", "quantity", "unit_price", "created_at")
SELECT
    gen_random_uuid()::text,
    tc."id",
    tc."service_category",
    COALESCE(NULLIF(tc."notes", ''), NULLIF(tc."description", '')),
    tc."quantity",
    tc."unit_price",
    tc."created_at"
FROM "treatment_charges" tc;

-- Add total_price (from qty * unit before dropping columns)
ALTER TABLE "treatment_charges" ADD COLUMN "total_price" DECIMAL(12,2);

UPDATE "treatment_charges"
SET "total_price" = ("quantity" * "unit_price");

ALTER TABLE "treatment_charges" ALTER COLUMN "total_price" SET NOT NULL;

-- Drop legacy parent columns
ALTER TABLE "treatment_charges" DROP COLUMN "service_category";
ALTER TABLE "treatment_charges" DROP COLUMN "description";
ALTER TABLE "treatment_charges" DROP COLUMN "quantity";
ALTER TABLE "treatment_charges" DROP COLUMN "unit_price";
ALTER TABLE "treatment_charges" DROP COLUMN "notes";

-- CreateIndex
CREATE INDEX "treatment_charge_lines_charge_id_idx" ON "treatment_charge_lines"("charge_id");

-- AddForeignKey
ALTER TABLE "treatment_charge_lines" ADD CONSTRAINT "treatment_charge_lines_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "treatment_charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
