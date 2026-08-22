-- Phase 707.05: body diagram pins on patient notes
ALTER TABLE "patient_notes" ADD COLUMN IF NOT EXISTS "diagram_type" TEXT;
ALTER TABLE "patient_notes" ADD COLUMN IF NOT EXISTS "pins" JSONB;
