-- Phase 707: visits, patient/visit IDs, charge flags, deposits, doctor codes, password logs

-- Enums
CREATE TYPE "VisitType" AS ENUM ('FIRST_VISIT', 'REVISIT', 'FOLLOW_UP');
CREATE TYPE "VisitSource" AS ENUM ('AGENT_REFERRAL', 'WALKIN');
CREATE TYPE "PasswordActorType" AS ENUM ('AGENT', 'DOCTOR');

-- Sequence counters for short IDs
CREATE TABLE "sequence_counters" (
    "key" TEXT NOT NULL,
    "last_seq" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sequence_counters_pkey" PRIMARY KEY ("key")
);

-- Patient number
ALTER TABLE "patients" ADD COLUMN "patient_number" TEXT;

WITH numbered AS (
  SELECT
    id,
    to_char(("created_at" AT TIME ZONE 'Asia/Taipei'), 'YY')
      || lpad(
        row_number() OVER (
          PARTITION BY date_part('year', "created_at" AT TIME ZONE 'Asia/Taipei')
          ORDER BY "created_at"
        )::text,
        4,
        '0'
      ) AS num
  FROM "patients"
)
UPDATE "patients" p
SET "patient_number" = n.num
FROM numbered n
WHERE p.id = n.id;

-- Collision-safe unique fill for any leftover nulls
UPDATE "patients"
SET "patient_number" = lpad((floor(random() * 900000) + 100000)::int::text, 6, '0')
WHERE "patient_number" IS NULL;

DO $$
DECLARE
  rec RECORD;
  next_n INT := 1;
BEGIN
  FOR rec IN
    SELECT id FROM (
      SELECT id, patient_number, row_number() OVER (PARTITION BY patient_number ORDER BY created_at) AS rn
      FROM patients
    ) d
    WHERE rn > 1
  LOOP
    LOOP
      EXIT WHEN NOT EXISTS (SELECT 1 FROM patients WHERE patient_number = lpad(next_n::text, 6, '0'));
      next_n := next_n + 1;
    END LOOP;
    UPDATE patients SET patient_number = lpad(next_n::text, 6, '0') WHERE id = rec.id;
    next_n := next_n + 1;
  END LOOP;
END $$;

ALTER TABLE "patients" ALTER COLUMN "patient_number" SET NOT NULL;
CREATE UNIQUE INDEX "patients_patient_number_key" ON "patients"("patient_number");

-- Fallback clinic for visits without assignment
INSERT INTO "clinics" ("id", "code", "name")
SELECT gen_random_uuid()::text, '00', 'Unassigned'
WHERE NOT EXISTS (SELECT 1 FROM "clinics");

-- Visits table
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "display_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "visit_date" DATE NOT NULL,
    "visit_type" "VisitType" NOT NULL,
    "source" "VisitSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

INSERT INTO "visits" (
  "id", "display_id", "patient_id", "clinic_id", "agent_id",
  "visit_date", "visit_type", "source", "created_at", "updated_at"
)
SELECT
  gen_random_uuid()::text,
  lpad(COALESCE(c.code, '00'), 2, '0')
    || '-'
    || COALESCE(NULLIF(upper(left(a.partner_id, 4)), ''), '0000')
    || '-'
    || p.patient_number
    || '-'
    || to_char((COALESCE(p.created_at, NOW()) AT TIME ZONE 'Asia/Taipei'), 'YYMMDD'),
  p.id,
  COALESCE(p.clinic_id, (SELECT id FROM clinics ORDER BY code LIMIT 1)),
  p.current_agent_id,
  (COALESCE(p.created_at, NOW()) AT TIME ZONE 'Asia/Taipei')::date,
  'FIRST_VISIT',
  CASE WHEN p.source = 'AGENT' THEN 'AGENT_REFERRAL'::"VisitSource" ELSE 'WALKIN'::"VisitSource" END,
  NOW(),
  NOW()
FROM "patients" p
LEFT JOIN "clinics" c ON c.id = COALESCE(p.clinic_id, (SELECT id FROM clinics ORDER BY code LIMIT 1))
LEFT JOIN "agents" a ON a.id = p.current_agent_id;

CREATE UNIQUE INDEX "visits_display_id_key" ON "visits"("display_id");
CREATE INDEX "visits_patient_id_idx" ON "visits"("patient_id");
CREATE INDEX "visits_clinic_id_idx" ON "visits"("clinic_id");
CREATE INDEX "visits_agent_id_idx" ON "visits"("agent_id");
CREATE INDEX "visits_visit_date_idx" ON "visits"("visit_date");

ALTER TABLE "visits"
  ADD CONSTRAINT "visits_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visits"
  ADD CONSTRAINT "visits_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON UPDATE CASCADE;
ALTER TABLE "visits"
  ADD CONSTRAINT "visits_agent_id_fkey"
  FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON UPDATE CASCADE ON DELETE SET NULL;

-- Treatments: visit + short id
ALTER TABLE "treatments" ADD COLUMN "visit_id" TEXT;
ALTER TABLE "treatments" ADD COLUMN "short_id" TEXT;

UPDATE "treatments" t
SET "visit_id" = v.id
FROM (
  SELECT DISTINCT ON (patient_id) id, patient_id
  FROM visits
  ORDER BY patient_id, visit_date ASC, created_at ASC
) v
WHERE t.patient_id = v.patient_id;

UPDATE "treatments" t
SET "short_id" = 'TREAT-' || lpad(s.n::text, 3, '0')
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at) AS n FROM treatments
) s
WHERE t.id = s.id;

ALTER TABLE "treatments" ALTER COLUMN "visit_id" SET NOT NULL;
ALTER TABLE "treatments" ALTER COLUMN "short_id" SET NOT NULL;
CREATE UNIQUE INDEX "treatments_short_id_key" ON "treatments"("short_id");
CREATE INDEX "treatments_visit_id_idx" ON "treatments"("visit_id");
ALTER TABLE "treatments"
  ADD CONSTRAINT "treatments_visit_id_fkey"
  FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Charges: short id + agent flag
ALTER TABLE "treatment_charges" ADD COLUMN "short_id" TEXT;
ALTER TABLE "treatment_charges" ADD COLUMN "is_agent_related" BOOLEAN NOT NULL DEFAULT true;

UPDATE "treatment_charges" c
SET "short_id" = 'CHG-' || lpad(s.n::text, 3, '0')
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at) AS n FROM treatment_charges
) s
WHERE c.id = s.id;

UPDATE "treatment_charges" c
SET "is_agent_related" = (v.agent_id IS NOT NULL)
FROM "treatments" t
JOIN "visits" v ON v.id = t.visit_id
WHERE c.treatment_id = t.id;

ALTER TABLE "treatment_charges" ALTER COLUMN "short_id" SET NOT NULL;
CREATE UNIQUE INDEX "treatment_charges_short_id_key" ON "treatment_charges"("short_id");

-- Payments: deposit applied at payment stage
ALTER TABLE "treatment_payments"
  ADD COLUMN "deposit_applied_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Sync existing charge-level deposits onto a synthetic note (balance calc later uses payments)
UPDATE "treatment_payments" p
SET "deposit_applied_amount" = COALESCE((
  SELECT SUM(c.deposit_applied)
  FROM treatment_charges c
  WHERE c.treatment_id = p.treatment_id
), 0)
WHERE p.id IN (
  SELECT DISTINCT ON (treatment_id) id
  FROM treatment_payments
  ORDER BY treatment_id, created_at
);

-- Agent DOB
ALTER TABLE "agents" ADD COLUMN "date_of_birth" DATE;

-- Doctor codes
ALTER TABLE "users" ADD COLUMN "doctor_code" TEXT;
UPDATE "users" u
SET "doctor_code" = 'DR' || lpad(s.n::text, 3, '0')
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at) AS n
  FROM users
  WHERE role = 'DOCTOR'
) s
WHERE u.id = s.id;
CREATE UNIQUE INDEX "users_doctor_code_key" ON "users"("doctor_code");

-- Deposit receivers
CREATE TABLE "deposit_receivers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contact_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deposit_receivers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deposit_transfers" (
    "id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "amount_twd" DECIMAL(12,2) NOT NULL,
    "transferred_at" DATE NOT NULL,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deposit_transfers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deposit_transfers_receiver_id_idx" ON "deposit_transfers"("receiver_id");
CREATE INDEX "deposit_transfers_transferred_at_idx" ON "deposit_transfers"("transferred_at");

ALTER TABLE "deposit_transfers"
  ADD CONSTRAINT "deposit_transfers_receiver_id_fkey"
  FOREIGN KEY ("receiver_id") REFERENCES "deposit_receivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deposit_transfers"
  ADD CONSTRAINT "deposit_transfers_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "patient_deposits" ADD COLUMN "receiver_id" TEXT;
ALTER TABLE "patient_deposits" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'TWD';
ALTER TABLE "patient_deposits" ADD COLUMN "exchange_rate" DECIMAL(12,6) NOT NULL DEFAULT 1;
ALTER TABLE "patient_deposits" ADD COLUMN "amount_twd" DECIMAL(12,2);

UPDATE "patient_deposits" SET "amount_twd" = "amount" WHERE "amount_twd" IS NULL;
ALTER TABLE "patient_deposits" ALTER COLUMN "amount_twd" SET NOT NULL;
CREATE INDEX "patient_deposits_receiver_id_idx" ON "patient_deposits"("receiver_id");
ALTER TABLE "patient_deposits"
  ADD CONSTRAINT "patient_deposits_receiver_id_fkey"
  FOREIGN KEY ("receiver_id") REFERENCES "deposit_receivers"("id") ON UPDATE CASCADE ON DELETE SET NULL;

-- Password reset / change logs
CREATE TABLE "user_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_password_reset_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_password_reset_tokens_token_key" ON "user_password_reset_tokens"("token");
CREATE INDEX "user_password_reset_tokens_user_id_idx" ON "user_password_reset_tokens"("user_id");
ALTER TABLE "user_password_reset_tokens"
  ADD CONSTRAINT "user_password_reset_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "password_change_logs" (
    "id" TEXT NOT NULL,
    "actor_type" "PasswordActorType" NOT NULL,
    "user_id" TEXT,
    "agent_id" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_change_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "password_change_logs_user_id_idx" ON "password_change_logs"("user_id");
CREATE INDEX "password_change_logs_agent_id_idx" ON "password_change_logs"("agent_id");
CREATE INDEX "password_change_logs_created_at_idx" ON "password_change_logs"("created_at");
ALTER TABLE "password_change_logs"
  ADD CONSTRAINT "password_change_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_change_logs"
  ADD CONSTRAINT "password_change_logs_agent_id_fkey"
  FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed sequence counters from existing rows
INSERT INTO "sequence_counters" ("key", "last_seq")
VALUES
  ('treat', COALESCE((SELECT COUNT(*) FROM treatments), 0)),
  ('chg', COALESCE((SELECT COUNT(*) FROM treatment_charges), 0)),
  ('doctor', COALESCE((SELECT COUNT(*) FROM users WHERE role = 'DOCTOR'), 0))
ON CONFLICT ("key") DO UPDATE SET "last_seq" = EXCLUDED."last_seq";

-- Align yearly patient sequence with allocated numbers
INSERT INTO "yearly_patient_sequences" ("year", "last_seq")
SELECT
  date_part('year', NOW() AT TIME ZONE 'Asia/Taipei')::int,
  COALESCE((
    SELECT MAX(NULLIF(right(patient_number, 4), '')::int)
    FROM patients
    WHERE left(patient_number, 2) = to_char(NOW() AT TIME ZONE 'Asia/Taipei', 'YY')
  ), 0)
ON CONFLICT ("year") DO UPDATE SET "last_seq" = GREATEST("yearly_patient_sequences"."last_seq", EXCLUDED."last_seq");
