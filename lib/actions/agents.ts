"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { agentFormSchema, type AgentFormInput } from "@/lib/validations/agent";
import { getFirstZodError } from "@/lib/utils/zod";

export async function createAgent(input: AgentFormInput) {
  await requireAuth();

  const parsed = agentFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: getFirstZodError(parsed.error),
    };
  }

  try {
    const agent = await prisma.agent.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
      },
    });

    revalidatePath("/dashboard/agents");
    return { success: true as const, agent };
  } catch {
    return { success: false as const, error: "Failed to create agent" };
  }
}

export async function getAgents() {
  await requireAuth();

  return prisma.agent.findMany({
    include: {
      _count: { select: { patients: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getAgentByShareToken(shareToken: string) {
  return prisma.agent.findUnique({
    where: { shareToken },
    include: {
      patients: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}

export async function getAgentsForSelect() {
  await requireAuth();
  return prisma.agent.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
