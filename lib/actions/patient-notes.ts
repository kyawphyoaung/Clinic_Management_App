"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { getFirstZodError } from "@/lib/utils/zod";

const createNoteSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional().nullable(),
  bloodPressure: z.string().optional().nullable(),
  heartRate: z.coerce.number().int().positive().optional().nullable(),
  weight: z.coerce.number().positive().optional().nullable(),
  height: z.coerce.number().positive().optional().nullable(),
  bodyTemperature: z.coerce.number().positive().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable(),
  treatmentId: z.string().uuid().optional().nullable(),
});

function serializeNote<T extends {
  weight: unknown;
  height: unknown;
  bodyTemperature: unknown;
  createdAt: Date;
}>(note: T) {
  return {
    ...note,
    weight: note.weight == null ? null : Number(note.weight),
    height: note.height == null ? null : Number(note.height),
    bodyTemperature:
      note.bodyTemperature == null ? null : Number(note.bodyTemperature),
    createdAt: note.createdAt.toISOString(),
  };
}

export async function listPatientNotes(patientId: string) {
  await requirePermission("patients:read");
  const rows = await prisma.patientNote.findMany({
    where: { patientId },
    include: {
      createdBy: { select: { id: true, fullName: true } },
      appointment: { select: { id: true, publicId: true, startsAt: true } },
      treatment: { select: { id: true, diagnosis: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeNote);
}

export async function listNotesForTreatment(treatmentId: string) {
  await requirePermission("treatments:read");
  const rows = await prisma.patientNote.findMany({
    where: { treatmentId },
    include: {
      createdBy: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeNote);
}

export async function createPatientNote(input: unknown) {
  const session = await requirePermission("patients:write");
  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;

  const note = await prisma.patientNote.create({
    data: {
      patientId: data.patientId,
      title: data.title.trim(),
      content: data.content?.trim() || null,
      bloodPressure: data.bloodPressure?.trim() || null,
      heartRate: data.heartRate ?? null,
      weight: data.weight ?? null,
      height: data.height ?? null,
      bodyTemperature: data.bodyTemperature ?? null,
      appointmentId: data.appointmentId || null,
      treatmentId: data.treatmentId || null,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/dashboard/patients/${data.patientId}`);
  if (data.treatmentId) {
    revalidatePath(`/dashboard/treatments/${data.treatmentId}`);
  }
  return { success: true as const, id: note.id };
}
