"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { getFirstZodError } from "@/lib/utils/zod";

const specializationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  doctorIds: z.array(z.string().uuid()).default([]),
});

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

async function requireCatalogWrite() {
  const session = await requirePermission("availability:manage");
  if (session.user.role === "DOCTOR") {
    throw new Error("Only Admin or Staff can manage the catalog");
  }
  return session;
}

export async function listSpecializations() {
  await requirePermission("availability:manage");
  return prisma.specialization.findMany({
    include: {
      doctors: {
        include: {
          doctor: { select: { id: true, fullName: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function listClinicServicesAdmin() {
  await requirePermission("availability:manage");
  return prisma.clinicService.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function upsertSpecialization(input: unknown) {
  try {
    await requireCatalogWrite();
  } catch {
    return { success: false as const, error: "Only Admin or Staff can manage the catalog" };
  }
  const parsed = specializationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const spec = data.id
        ? await tx.specialization.update({
            where: { id: data.id },
            data: {
              name: data.name,
              description: data.description ?? null,
              isActive: data.isActive,
            },
          })
        : await tx.specialization.create({
            data: {
              name: data.name,
              description: data.description ?? null,
              isActive: data.isActive,
            },
          });

      await tx.doctorSpecialization.deleteMany({
        where: { specializationId: spec.id },
      });
      if (data.doctorIds.length > 0) {
        await tx.doctorSpecialization.createMany({
          data: data.doctorIds.map((doctorId) => ({
            doctorId,
            specializationId: spec.id,
          })),
        });
      }
    });
    revalidatePath("/dashboard/availability");
    revalidatePath("/book");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to save specialization" };
  }
}

export async function deleteSpecialization(id: string) {
  try {
    await requireCatalogWrite();
  } catch {
    return { success: false as const, error: "Only Admin or Staff can manage the catalog" };
  }
  await prisma.specialization.delete({ where: { id } });
  revalidatePath("/dashboard/availability");
  revalidatePath("/book");
  return { success: true as const };
}

export async function upsertClinicService(input: unknown) {
  try {
    await requireCatalogWrite();
  } catch {
    return { success: false as const, error: "Only Admin or Staff can manage the catalog" };
  }
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;
  try {
    if (data.id) {
      await prisma.clinicService.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description ?? null,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        },
      });
    } else {
      await prisma.clinicService.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        },
      });
    }
    revalidatePath("/dashboard/availability");
    revalidatePath("/book");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to save service" };
  }
}

export async function deleteClinicService(id: string) {
  try {
    await requireCatalogWrite();
  } catch {
    return { success: false as const, error: "Only Admin or Staff can manage the catalog" };
  }
  await prisma.clinicService.delete({ where: { id } });
  revalidatePath("/dashboard/availability");
  revalidatePath("/book");
  return { success: true as const };
}
