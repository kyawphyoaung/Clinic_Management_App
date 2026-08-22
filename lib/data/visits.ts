import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function getVisitsForPatient(patientId: string) {
  await requireAuth();
  const visits = await prisma.visit.findMany({
    where: { patientId },
    include: {
      clinic: { select: { id: true, code: true, name: true } },
      agent: { select: { id: true, fullName: true, partnerId: true } },
      treatments: {
        select: { id: true, shortId: true },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { treatments: true } },
    },
    orderBy: { visitDate: "desc" },
  });

  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    select: {
      id: true,
      publicId: true,
      startsAt: true,
      status: true,
    },
    orderBy: { startsAt: "desc" },
  });

  return visits.map((visit) => {
    const day = visit.visitDate.toISOString().slice(0, 10);
    const appointment =
      appointments.find((a) => a.startsAt.toISOString().slice(0, 10) === day) ?? null;
    return { ...visit, appointment };
  });
}

export async function getVisitOptionsForPatient(patientId: string) {
  await requireAuth();
  return prisma.visit.findMany({
    where: { patientId },
    select: {
      id: true,
      displayId: true,
      visitDate: true,
      visitType: true,
      source: true,
      agentId: true,
    },
    orderBy: { visitDate: "desc" },
  });
}
