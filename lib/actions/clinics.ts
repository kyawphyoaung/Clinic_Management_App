"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

export async function getClinics() {
  await requirePermission("clinics:manage");
  return prisma.clinic.findMany({
    include: {
      _count: { select: { patients: true } },
    },
    orderBy: { code: "asc" },
  });
}

export async function createClinic(formData: FormData) {
  await requirePermission("clinics:manage");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!/^\d{2}$/.test(code)) {
    return { success: false as const, error: "Clinic ID must be exactly 2 digits" };
  }
  if (!name) {
    return { success: false as const, error: "Clinic name is required" };
  }

  try {
    await prisma.clinic.create({ data: { name, code } });
    revalidatePath("/dashboard/clinics");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Clinic ID must be unique" };
  }
}

export async function getClinicById(id: string) {
  await requirePermission("clinics:manage");
  return prisma.clinic.findUnique({
    where: { id },
    include: {
      patients: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          displayId: true,
          fullName: true,
          preferredName: true,
          status: true,
          countryOfResidence: true,
          currentAgent: {
            select: { partnerId: true, fullName: true },
          },
        },
      },
    },
  });
}
