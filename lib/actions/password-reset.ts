"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { clientIpAddress, sendTransactionalEmail } from "@/lib/utils/mailer";

function plusHours(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

export async function requestDoctorPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      email: { equals: normalized, mode: "insensitive" },
      role: "DOCTOR",
      isActive: true,
    },
    select: { id: true, email: true, fullName: true },
  });

  if (user?.email) {
    const token = randomBytes(24).toString("hex");
    await prisma.userPasswordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: plusHours(new Date(), 24),
      },
    });
    const origin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
    await sendTransactionalEmail({
      to: user.email,
      subject: "Reset your clinic password",
      text: `Hello ${user.fullName},\n\nReset your password: ${origin}/reset-password?token=${token}\n\nThis link expires in 24 hours.`,
    });
  }

  return { success: true as const };
}

export async function resetDoctorPassword(token: string, password: string) {
  if (password.length < 8) {
    return { success: false as const, error: "Password must be at least 8 characters" };
  }
  const record = await prisma.userPasswordResetToken.findUnique({
    where: { token },
  });
  if (!record || record.expiresAt < new Date() || record.usedAt) {
    return { success: false as const, error: "Invalid or expired token" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const ip = await clientIpAddress();
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });
    await tx.userPasswordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    await tx.passwordChangeLog.create({
      data: {
        actorType: "DOCTOR",
        userId: record.userId,
        ipAddress: ip,
      },
    });
  });
  return { success: true as const };
}
