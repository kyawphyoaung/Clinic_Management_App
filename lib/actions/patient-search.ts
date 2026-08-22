"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export type PatientSuggestion = {
  id: string;
  label: string;
  matchType: "Patient Name" | "Patient ID" | "Visit ID" | "Phone";
  href: string;
  searchValue: string;
};

export async function suggestPatients(
  query: string
): Promise<PatientSuggestion[]> {
  await requireAuth();

  const q = query.trim();
  if (q.length < 1) return [];

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { preferredName: { contains: q, mode: "insensitive" } },
        { patientNumber: { contains: q, mode: "insensitive" } },
        { displayId: { contains: q, mode: "insensitive" } },
        { mobileNumber: { contains: q, mode: "insensitive" } },
        {
          visits: {
            some: { displayId: { contains: q, mode: "insensitive" } },
          },
        },
      ],
    },
    select: {
      id: true,
      fullName: true,
      patientNumber: true,
      displayId: true,
      mobileNumber: true,
      visits: {
        where: { displayId: { contains: q, mode: "insensitive" } },
        select: { displayId: true },
        take: 1,
      },
    },
    take: 8,
    orderBy: { fullName: "asc" },
  });

  const lower = q.toLowerCase();

  return patients.map((patient) => {
    let matchType: PatientSuggestion["matchType"] = "Patient Name";
    let searchValue = patient.fullName;

    if (patient.patientNumber.toLowerCase().includes(lower)) {
      matchType = "Patient ID";
      searchValue = patient.patientNumber;
    } else if (patient.displayId.toLowerCase().includes(lower)) {
      matchType = "Patient ID";
      searchValue = patient.displayId;
    } else if (patient.visits[0]?.displayId) {
      matchType = "Visit ID";
      searchValue = patient.visits[0].displayId;
    } else if (patient.mobileNumber?.toLowerCase().includes(lower)) {
      matchType = "Phone";
      searchValue = patient.mobileNumber;
    }

    return {
      id: patient.id,
      label: `${patient.fullName} · ${patient.patientNumber}`,
      matchType,
      href: `/dashboard/patients/${patient.id}`,
      searchValue,
    };
  });
}
