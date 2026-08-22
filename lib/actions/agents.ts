"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
function plusHours(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}


export async function getAgents() {
  await requirePermission("agents:read");

  return prisma.agent.findMany({
    select: {
      id: true,
      fullName: true,
      companyName: true,
      partnerId: true,
      status: true,
      mobileNumber: true,
      email: true,
      _count: { select: { patients: true } },
    },
    where: { status: { in: ["PENDING", "ACTIVE", "REJECTED"] } },
    orderBy: { fullName: "asc" },
  });
}

export async function getAgentByIdForAdmin(id: string) {
  await requirePermission("agents:read");
  return prisma.agent.findUnique({
    where: { id },
    include: {
      commissionPayments: {
        include: {
          patient: {
            select: { displayId: true, fullName: true },
          },
        },
        orderBy: { calculatedAt: "desc" },
      },
      setPasswordTokens: {
        where: { expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      patients: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          displayId: true,
          patientNumber: true,
          fullName: true,
          preferredName: true,
          countryOfResidence: true,
          status: true,
          treatments: {
            select: { diagnosis: true },
            orderBy: { treatmentDate: "desc" },
          },
        },
      },
      _count: { select: { patients: true } },
    },
  });
}

export async function getAgentByShareToken(token: string) {
  return prisma.agent.findFirst({
    where: {
      OR: [{ partnerId: token.toUpperCase() }, { id: token }],
    },
    include: {
      patients: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          displayId: true,
          fullName: true,
          preferredName: true,
          mobileNumber: true,
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
  await requirePermission("agents:read");
  return prisma.agent.findMany({
    select: { id: true, fullName: true, partnerId: true },
    orderBy: { fullName: "asc" },
  });
}

function makePartnerId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function generateUniquePartnerId() {
  for (let i = 0; i < 40; i++) {
    const candidate = makePartnerId();
    const exists = await prisma.agent.findUnique({
      where: { partnerId: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new Error("Failed to generate unique partner ID");
}

export async function approveAgent(agentId: string) {
  const session = await requirePermission("agents:write");
  const partnerId = await generateUniquePartnerId();
  const token = randomBytes(24).toString("hex");
  const expiresAt = plusHours(new Date(), 24);

  const approved = await prisma.$transaction(async (tx) => {
    const agent = await tx.agent.update({
      where: { id: agentId },
      data: {
        status: "ACTIVE",
        partnerId,
        approvedAt: new Date(),
        approvedBy: session.user.id,
      },
      select: { id: true, email: true, fullName: true, partnerId: true },
    });

    await tx.agentSetPasswordToken.create({
      data: {
        agentId: agent.id,
        token,
        expiresAt,
      },
    });

    return agent;
  });

  revalidatePath("/dashboard/agents");
  revalidatePath(`/dashboard/agents/${agentId}`);
  return {
    success: true as const,
    partnerId: approved.partnerId,
    email: approved.email,
    fullName: approved.fullName,
    setPasswordPath: `/partner/set-password?token=${token}`,
  };
}

export async function rejectAgent(agentId: string) {
  await requirePermission("agents:write");
  await prisma.agent.update({
    where: { id: agentId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/dashboard/agents");
  revalidatePath(`/dashboard/agents/${agentId}`);
  return { success: true as const };
}

export async function setPartnerPassword(token: string, password: string) {
  const record = await prisma.agentSetPasswordToken.findUnique({
    where: { token },
    include: { agent: true },
  });
  if (!record || record.expiresAt < new Date()) {
    return { success: false as const, error: "Invalid or expired token" };
  }

  const hashed = await bcrypt.hash(password, 10);
  const { clientIpAddress } = await import("@/lib/utils/mailer");
  const ip = await clientIpAddress();
  await prisma.$transaction(async (tx) => {
    await tx.agent.update({
      where: { id: record.agentId },
      data: { passwordHash: hashed },
    });
    await tx.passwordChangeLog.create({
      data: {
        actorType: "AGENT",
        agentId: record.agentId,
        ipAddress: ip,
      },
    });
    await tx.agentSetPasswordToken.delete({ where: { id: record.id } });
  });
  return { success: true as const };
}

export async function requestPartnerPasswordReset(input: {
  email: string;
  dateOfBirth: string;
}) {
  const email = input.email.trim().toLowerCase();
  const dob = input.dateOfBirth;
  const agent = await prisma.agent.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      status: "ACTIVE",
      dateOfBirth: dob ? new Date(dob) : undefined,
    },
    select: { id: true, email: true, fullName: true, partnerId: true, dateOfBirth: true },
  });

  if (agent?.dateOfBirth) {
    const token = randomBytes(24).toString("hex");
    await prisma.agentSetPasswordToken.create({
      data: {
        agentId: agent.id,
        token,
        expiresAt: plusHours(new Date(), 24),
      },
    });
    const { sendTransactionalEmail } = await import("@/lib/utils/mailer");
    const origin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
    await sendTransactionalEmail({
      to: agent.email,
      subject: "Reset your partner password",
      text: `Hello ${agent.fullName},\n\nReset your password: ${origin}/partner/set-password?token=${token}\n\nThis link expires in 24 hours.`,
    });
  }

  return { success: true as const };
}

export async function requestAdminAgentPasswordReset(agentId: string) {
  await requirePermission("agents:write");
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true, email: true, fullName: true, partnerId: true },
  });
  if (!agent) {
    return { success: false as const, error: "Agent not found" };
  }
  const token = randomBytes(24).toString("hex");
  await prisma.agentSetPasswordToken.create({
    data: {
      agentId: agent.id,
      token,
      expiresAt: plusHours(new Date(), 24),
    },
  });
  const origin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const resetPath = `/partner/set-password?token=${token}`;
  return {
    success: true as const,
    resetPath,
    resetUrl: origin ? `${origin}${resetPath}` : resetPath,
    email: agent.email,
  };
}

export async function verifyPartnerLogin(partnerId: string, password: string) {
  const agent = await prisma.agent.findFirst({
    where: { partnerId: partnerId.toUpperCase(), status: "ACTIVE" },
  });
  if (!agent?.passwordHash) return null;
  const ok = await bcrypt.compare(password, agent.passwordHash);
  return ok ? { id: agent.id, partnerId: agent.partnerId, fullName: agent.fullName } : null;
}

export async function getPartnerDashboard(agentId: string) {
  return prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      patients: {
        orderBy: { createdAt: "desc" },
        include: {
          treatments: {
            select: {
              id: true,
              status: true,
              diagnosis: true,
              treatmentDate: true,
              endDate: true,
            },
            orderBy: { treatmentDate: "desc" },
          },
          deposits: {
            select: { amountTwd: true, paymentDate: true },
            orderBy: { paymentDate: "desc" },
          },
          requestedDeposits: {
            select: {
              amount: true,
              amountTwd: true,
              status: true,
              requestedAt: true,
            },
            orderBy: { requestedAt: "desc" },
            take: 1,
          },
        },
      },
      commissionPayments: {
        include: {
          patient: {
            select: {
              id: true,
              displayId: true,
              fullName: true,
              preferredName: true,
              status: true,
            },
          },
          treatment: {
            select: { endDate: true, status: true, diagnosis: true },
          },
        },
        orderBy: { calculatedAt: "desc" },
      },
    },
  });
}

export async function approveCommission(commissionId: string) {
  await requirePermission("agents:write");
  await prisma.commissionPayment.update({
    where: { id: commissionId },
    data: { reviewStatus: "APPROVED" },
  });
  revalidatePath("/dashboard/agents");
  return { success: true as const };
}

export async function markCommissionPaid(commissionId: string) {
  await requirePermission("agents:write");
  await prisma.commissionPayment.update({
    where: { id: commissionId },
    data: {
      reviewStatus: "PAID",
      paidAt: new Date(),
    },
  });
  revalidatePath("/dashboard/agents");
  return { success: true as const };
}

export async function createAgentPlaceholder(input: {
  fullName: string;
  email: string;
  mobileNumber?: string;
}) {
  await requirePermission("agents:write");

  try {
    const agent = await prisma.agent.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        mobileNumber: input.mobileNumber ?? null,
      },
    });

    revalidatePath("/dashboard/agents");
    return { success: true as const, agent };
  } catch {
    return { success: false as const, error: "Failed to create agent" };
  }
}
