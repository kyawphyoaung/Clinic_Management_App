"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function getSurveyResponses() {
  await requireAuth();

  return prisma.surveyResponse.findMany({
    include: {
      patient: {
        select: {
          id: true,
          displayId: true,
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSurveyResponseById(id: string) {
  await requireAuth();

  return prisma.surveyResponse.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          displayId: true,
          fullName: true,
        },
      },
    },
  });
}
