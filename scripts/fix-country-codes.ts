/**
 * One-time script: map ISO country codes to full English names.
 * Run: npx tsx scripts/fix-country-codes.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../prisma/generated/prisma/client";

const COUNTRY_MAP: Record<string, string> = {
  MM: "Myanmar",
  TW: "Taiwan",
  US: "United States",
  JP: "Japan",
  KR: "South Korea",
  SG: "Singapore",
  MY: "Malaysia",
  TH: "Thailand",
  VN: "Vietnam",
  PH: "Philippines",
  CN: "China",
  HK: "Hong Kong",
  AU: "Australia",
  GB: "United Kingdom",
  ID: "Indonesia",
  IN: "India",
  CA: "Canada",
  AE: "United Arab Emirates",
  OTHER: "Other",
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function mapCode(value: string | null | undefined): string | null {
  if (!value) return null;
  return COUNTRY_MAP[value] ?? value;
}

async function main() {
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      nationality: true,
      countryOfResidence: true,
      physicianCountry: true,
    },
  });

  let patientUpdates = 0;
  for (const patient of patients) {
    const nationality = mapCode(patient.nationality);
    const countryOfResidence = mapCode(patient.countryOfResidence);
    const physicianCountry = mapCode(patient.physicianCountry);

    if (
      nationality !== patient.nationality ||
      countryOfResidence !== patient.countryOfResidence ||
      physicianCountry !== patient.physicianCountry
    ) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: { nationality, countryOfResidence, physicianCountry },
      });
      patientUpdates += 1;
    }
  }

  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      countryOfResidence: true,
      patientOriginCountries: true,
    },
  });

  let agentUpdates = 0;
  for (const agent of agents) {
    const countryOfResidence = mapCode(agent.countryOfResidence);
    const patientOriginCountries = agent.patientOriginCountries.map(
      (code) => COUNTRY_MAP[code] ?? code
    );
    const originsChanged =
      patientOriginCountries.length !== agent.patientOriginCountries.length ||
      patientOriginCountries.some(
        (v, i) => v !== agent.patientOriginCountries[i]
      );

    if (countryOfResidence !== agent.countryOfResidence || originsChanged) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { countryOfResidence, patientOriginCountries },
      });
      agentUpdates += 1;
    }
  }

  console.log(
    `Updated ${patientUpdates} patient(s) and ${agentUpdates} agent(s).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
