"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { allocateShortId } from "@/lib/utils/display-id";
import type { UserRole } from "@/prisma/generated/prisma/client";

export async function getUsers() {
  await requirePermission("users:manage");
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getDoctorsForSelect() {
  await requirePermission("treatments:read");
  return prisma.user.findMany({
    where: { role: "DOCTOR", isActive: true },
    select: { id: true, fullName: true, doctorCode: true },
    orderBy: { fullName: "asc" },
  });
}

type CreateUserInput = {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  role: UserRole;
};

export async function createUser(input: CreateUserInput) {
  await requirePermission("users:manage");

  const username = input.username.trim();
  const password = input.password;
  const fullName = input.fullName.trim();

  if (!username || !password || !fullName) {
    return { success: false as const, error: "All required fields must be filled" };
  }
  if (password.length < 8) {
    return { success: false as const, error: "Password must be at least 8 characters" };
  }
  if (!["ADMIN", "DOCTOR", "STAFF"].includes(input.role)) {
    return { success: false as const, error: "Invalid role" };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { success: false as const, error: "Username already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const doctorCode =
    input.role === "DOCTOR"
      ? await prisma.$transaction((tx) => allocateShortId(tx, "doctor", "DR"))
      : null;
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      fullName,
      email: input.email?.trim() || null,
      role: input.role,
      doctorCode,
    },
  });

  revalidatePath("/dashboard/settings/users");
  return { success: true as const };
}

export async function setUserActive(userId: string, isActive: boolean) {
  const session = await requirePermission("users:manage");
  if (session.user.id === userId && !isActive) {
    return { success: false as const, error: "You cannot deactivate your own account" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  revalidatePath("/dashboard/settings/users");
  return { success: true as const };
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requirePermission("users:manage");

  if (newPassword.length < 8) {
    return { success: false as const, error: "Password must be at least 8 characters" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { clientIpAddress } = await import("@/lib/utils/mailer");
  const ip = await clientIpAddress();
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { role: true },
    });
    await tx.passwordChangeLog.create({
      data: {
        actorType: user.role === "DOCTOR" ? "DOCTOR" : "DOCTOR",
        userId,
        ipAddress: ip,
      },
    });
  });

  revalidatePath("/dashboard/settings/users");
  return { success: true as const };
}
