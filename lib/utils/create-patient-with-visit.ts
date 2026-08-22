import type { Prisma, VisitSource, VisitType } from "@/prisma/generated/prisma/client";
import {
  allocatePatientNumber,
  buildVisitDisplayId,
} from "@/lib/utils/display-id";

async function resolveClinic(
  tx: Prisma.TransactionClient,
  clinicId?: string | null
) {
  if (clinicId) {
    const clinic = await tx.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, code: true },
    });
    if (clinic) return clinic;
  }
  return tx.clinic.findFirst({
    select: { id: true, code: true },
    orderBy: { code: "asc" },
  });
}

export async function createPatientWithVisit(
  tx: Prisma.TransactionClient,
  patientData: Prisma.PatientUncheckedCreateInput,
  visit: {
    clinicId?: string | null;
    agentId?: string | null;
    agentCode?: string | null;
    source: VisitSource;
    visitType?: VisitType;
    visitDate?: Date;
  }
) {
  const clinic = await resolveClinic(tx, visit.clinicId ?? patientData.clinicId);
  if (!clinic) {
    throw new Error("Create a clinic before registering patients");
  }

  const patientNumber = await allocatePatientNumber(tx);
  const visitDate = visit.visitDate ?? new Date();
  const visitDisplayId = buildVisitDisplayId(
    clinic.code,
    visit.agentCode,
    patientNumber,
    visitDate
  );

  const { displayId: _displayId, patientNumber: _patientNumber, ...rest } = patientData;

  const patient = await tx.patient.create({
    data: {
      ...rest,
      patientNumber,
      displayId: visitDisplayId,
      clinicId: clinic.id,
    },
  });

  const visitRow = await tx.visit.create({
    data: {
      displayId: visitDisplayId,
      patientId: patient.id,
      clinicId: clinic.id,
      agentId: visit.agentId ?? null,
      visitDate,
      visitType: visit.visitType ?? "FIRST_VISIT",
      source: visit.source,
    },
  });

  return { patient, visit: visitRow };
}
