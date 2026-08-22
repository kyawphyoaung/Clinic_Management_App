"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { getFirstZodError } from "@/lib/utils/zod";
import type { Prisma } from "@/prisma/generated/prisma/client";

const pinSchema = z.object({
  label: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  description: z.string(),
});

const createNoteSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional().nullable(),
  subjective: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
  assessment: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  bloodPressure: z.string().optional().nullable(),
  heartRate: z.coerce.number().int().positive().optional().nullable(),
  weight: z.coerce.number().positive().optional().nullable(),
  height: z.coerce.number().positive().optional().nullable(),
  bodyTemperature: z.coerce.number().positive().optional().nullable(),
  diagramType: z.string().optional().nullable(),
  pins: z.array(pinSchema).optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable(),
  treatmentId: z.string().uuid().optional().nullable(),
});

const updateNoteSchema = createNoteSchema.extend({
  noteId: z.string().uuid(),
});

function serializeNote<
  T extends {
    weight: unknown;
    height: unknown;
    bodyTemperature: unknown;
    createdAt: Date;
    updatedAt?: Date;
    pins?: unknown;
  },
>(note: T) {
  return {
    ...note,
    weight: note.weight == null ? null : Number(note.weight),
    height: note.height == null ? null : Number(note.height),
    bodyTemperature:
      note.bodyTemperature == null ? null : Number(note.bodyTemperature),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt ? note.updatedAt.toISOString() : undefined,
    pins: note.pins ?? null,
  };
}

export async function listPatientNotes(patientId: string) {
  await requirePermission("patients:read");
  let rows;
  try {
    rows = await prisma.patientNote.findMany({
      where: { patientId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        appointment: { select: { id: true, publicId: true, startsAt: true } },
        treatment: { select: { id: true, diagnosis: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throw error;
  }
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

export async function getPatientNote(noteId: string) {
  await requirePermission("patients:read");
  const note = await prisma.patientNote.findUnique({
    where: { id: noteId },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          dateOfBirth: true,
          countryOfResidence: true,
          nationality: true,
        },
      },
      createdBy: { select: { id: true, fullName: true } },
      treatment: {
        select: { id: true, diagnosis: true, shortId: true },
      },
    },
  });
  if (!note) return null;
  return serializeNote(note);
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
      subjective: data.subjective?.trim() || null,
      objective: data.objective?.trim() || null,
      assessment: data.assessment?.trim() || null,
      plan: data.plan?.trim() || null,
      bloodPressure: data.bloodPressure?.trim() || null,
      heartRate: data.heartRate ?? null,
      weight: data.weight ?? null,
      height: data.height ?? null,
      bodyTemperature: data.bodyTemperature ?? null,
      diagramType: data.diagramType?.trim() || null,
      pins: (data.pins ?? null) as Prisma.InputJsonValue,
      appointmentId: data.appointmentId || null,
      treatmentId: data.treatmentId || null,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/dashboard/patients/${data.patientId}`);
  if (data.treatmentId) {
    revalidatePath(`/dashboard/treatments/${data.treatmentId}`);
    revalidatePath(`/dashboard/treatments/${data.treatmentId}/notes/${note.id}`);
  }
  return { success: true as const, id: note.id };
}

export async function updatePatientNote(input: unknown) {
  await requirePermission("patients:write");
  const parsed = updateNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;
  await prisma.patientNote.update({
    where: { id: data.noteId },
    data: {
      title: data.title.trim(),
      content: data.content?.trim() || null,
      subjective: data.subjective?.trim() || null,
      objective: data.objective?.trim() || null,
      assessment: data.assessment?.trim() || null,
      plan: data.plan?.trim() || null,
      bloodPressure: data.bloodPressure?.trim() || null,
      heartRate: data.heartRate ?? null,
      weight: data.weight ?? null,
      height: data.height ?? null,
      bodyTemperature: data.bodyTemperature ?? null,
      diagramType: data.diagramType?.trim() || null,
      pins: (data.pins ?? null) as Prisma.InputJsonValue,
    },
  });
  revalidatePath(`/dashboard/patients/${data.patientId}`);
  if (data.treatmentId) {
    revalidatePath(`/dashboard/treatments/${data.treatmentId}`);
    revalidatePath(`/dashboard/treatments/${data.treatmentId}/notes/${data.noteId}`);
  }
  return { success: true as const };
}

export async function deletePatientNote(noteId: string) {
  await requirePermission("patients:write");
  const note = await prisma.patientNote.findUnique({
    where: { id: noteId },
    select: { id: true, patientId: true, treatmentId: true },
  });
  if (!note) return { success: false as const, error: "Note not found" };
  await prisma.patientNote.delete({ where: { id: note.id } });
  revalidatePath(`/dashboard/patients/${note.patientId}`);
  if (note.treatmentId) revalidatePath(`/dashboard/treatments/${note.treatmentId}`);
  return { success: true as const };
}
