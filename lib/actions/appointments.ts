"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { requirePermission, hasPermission } from "@/lib/permissions";
import { getPartnerSessionAgentId } from "@/lib/partner-session";
import { encrypt } from "@/lib/utils/encryption";
import { createPatientWithVisit } from "@/lib/utils/create-patient-with-visit";
import { getFirstZodError } from "@/lib/utils/zod";
import {
  SLOT_MINUTES,
  isWithin24Hours,
  taiwanLocalToUtc,
} from "@/lib/utils/taiwan-time";
import {
  getAvailableSlotsForDate,
  SLOT_CONFLICT_MESSAGE,
} from "@/lib/utils/appointment-slots";
import { toPatientFacingId } from "@/lib/utils/patient-id";
import {
  publicBookingSchema,
  patientLinkBookingSchema,
  staffBookingSchema,
  rescheduleSchema,
} from "@/lib/validations/appointments";
import type {
  AppointmentCreatedByType,
  AppointmentStatus,
  Prisma,
} from "@/prisma/generated/prisma/client";

function newToken(): string {
  return randomBytes(24).toString("hex");
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

async function generateAppointmentDisplayId(
  tx: Prisma.TransactionClient
): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  for (let i = 0; i < 8; i++) {
    const suffix = randomBytes(2).toString("hex").toUpperCase();
    const displayId = `APT-${yy}${mm}${dd}-${suffix}`;
    const exists = await tx.appointment.findUnique({ where: { displayId } });
    if (!exists) return displayId;
  }
  return `APT-${yy}${mm}${dd}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function generateAppointmentPublicId(
  tx: Prisma.TransactionClient
): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let attempt = 0; attempt < 32; attempt++) {
    const bytes = randomBytes(4);
    let publicId = "";
    for (let i = 0; i < 4; i++) {
      publicId += chars[bytes[i]! % chars.length]!;
    }
    const exists = await tx.appointment.findUnique({ where: { publicId } });
    if (!exists) return publicId;
  }
  throw new Error("Failed to allocate appointment public ID");
}

async function assertSlotFree(
  doctorId: string,
  startsAt: Date,
  excludeId?: string
) {
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      startsAt,
      status: { not: "CANCELLED" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (conflict) {
    throw new Error(SLOT_CONFLICT_MESSAGE);
  }
}

export async function listDoctorsForBooking() {
  return prisma.user.findMany({
    where: { role: "DOCTOR", isActive: true },
    select: {
      id: true,
      fullName: true,
      specializations: {
        include: { specialization: { select: { id: true, name: true } } },
      },
      weeklyAvailability: {
        where: { isActive: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
    },
    orderBy: { fullName: "asc" },
  });
}

export async function listActiveClinicServices() {
  return prisma.clinicService.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, description: true },
  });
}

export async function getSlotsAction(doctorId: string, date: string) {
  if (!doctorId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return [] as { startMinutes: number; label: string; startsAt: string }[];
  }
  const slots = await getAvailableSlotsForDate(doctorId, date);
  return slots.map((s) => ({
    startMinutes: s.startMinutes,
    label: s.label,
    startsAt: s.startsAt.toISOString(),
  }));
}

export async function createPublicAppointment(input: unknown) {
  const parsed = publicBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;
  const startsAt = taiwanLocalToUtc(data.date, data.slotMinutes);
  const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60 * 1000);

  const slots = await getAvailableSlotsForDate(data.doctorId, data.date);
  if (!slots.some((s) => s.startMinutes === data.slotMinutes)) {
    return { success: false as const, error: "Selected slot is not available" };
  }

  try {
    await assertSlotFree(data.doctorId, startsAt);

    let agentId: string | null = null;
    if (data.referralCode?.trim()) {
      const agent = await prisma.agent.findFirst({
        where: {
          OR: [
            { partnerId: data.referralCode.trim() },
            { id: data.referralCode.trim() },
          ],
          status: "ACTIVE",
        },
      });
      agentId = agent?.id ?? null;
    }

    const appointment = await prisma.$transaction(async (tx) => {
      const bookingShareToken = newToken();
      const agent = agentId
        ? await tx.agent.findUnique({
            where: { id: agentId },
            select: { partnerId: true },
          })
        : null;
      const { patient } = await createPatientWithVisit(
        tx,
        {
          displayId: "pending",
          patientNumber: "pending",
          fullName: data.fullName,
          gender: data.gender,
          dateOfBirth: new Date(data.dateOfBirth),
          email: data.email,
          mobileNumber: encrypt(data.phone),
          source: "BOOKING",
          status: "APPOINTMENT_CONFIRMED",
          currentAgentId: agentId,
          partnerId: data.referralCode?.trim() || null,
          bookingShareToken,
          appointmentDate: startsAt,
          appointmentStatus: "CONFIRMED",
        },
        {
          agentId,
          agentCode: agent?.partnerId,
          source: agentId ? "AGENT_REFERRAL" : "WALKIN",
        }
      );

      const aptDisplayId = await generateAppointmentDisplayId(tx);
      const publicId = await generateAppointmentPublicId(tx);
      const apt = await tx.appointment.create({
        data: {
          displayId: aptDisplayId,
          publicId,
          patientId: patient.id,
          doctorId: data.doctorId,
          service: data.service,
          startsAt,
          endsAt,
          status: "CONFIRMED",
          notes: data.notes || null,
          preferredLanguage: data.preferredLanguage || null,
          phoneEncrypted: encrypt(data.phone),
          referralCode: data.referralCode?.trim() || null,
          shareToken: newToken(),
          rescheduleToken: newToken(),
          createdByType: "PUBLIC",
        },
      });
      return { apt, patient };
    });

    const doctor = await prisma.user.findUnique({
      where: { id: appointment.apt.doctorId },
      select: { fullName: true },
    });

    await prisma.patientStatusLog.create({
      data: {
        patientId: appointment.patient.id,
        oldStatus: "INQUIRY",
        newStatus: "APPOINTMENT_CONFIRMED",
        changedBy: "system:booking",
        remark: "Auto-updated on appointment booking",
      },
    });

    return {
      success: true as const,
      appointmentId: appointment.apt.id,
      displayId: appointment.apt.displayId,
      publicId: appointment.apt.publicId,
      rescheduleToken: appointment.apt.rescheduleToken,
      startsAt: appointment.apt.startsAt.toISOString(),
      endsAt: appointment.apt.endsAt.toISOString(),
      service: appointment.apt.service,
      doctorName: doctor?.fullName ?? "",
      patientName: appointment.patient.fullName,
      patientFacingId: toPatientFacingId(appointment.patient.patientNumber),
    };
  } catch (err) {
    if (isUniqueViolation(err) || (err instanceof Error && err.message === SLOT_CONFLICT_MESSAGE)) {
      return { success: false as const, error: SLOT_CONFLICT_MESSAGE };
    }
    console.error(err);
    return { success: false as const, error: "Failed to create appointment" };
  }
}

export async function createAppointmentViaPatientLink(input: unknown) {
  const parsed = patientLinkBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;
  const patient = await prisma.patient.findFirst({
    where: { bookingShareToken: data.patientToken },
  });
  if (!patient) {
    return { success: false as const, error: "Invalid booking link" };
  }

  const startsAt = taiwanLocalToUtc(data.date, data.slotMinutes);
  const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60 * 1000);
  const slots = await getAvailableSlotsForDate(data.doctorId, data.date);
  if (!slots.some((s) => s.startMinutes === data.slotMinutes)) {
    return { success: false as const, error: "Selected slot is not available" };
  }

  try {
    await assertSlotFree(data.doctorId, startsAt);
    const appointment = await prisma.$transaction(async (tx) => {
      const aptDisplayId = await generateAppointmentDisplayId(tx);
      const publicId = await generateAppointmentPublicId(tx);
      const apt = await tx.appointment.create({
        data: {
          displayId: aptDisplayId,
          publicId,
          patientId: patient.id,
          doctorId: data.doctorId,
          clinicId: patient.clinicId,
          service: data.service,
          startsAt,
          endsAt,
          status: "CONFIRMED",
          notes: data.notes || null,
          preferredLanguage: data.preferredLanguage || null,
          shareToken: newToken(),
          rescheduleToken: newToken(),
          createdByType: "PATIENT_LINK",
        },
      });
      await tx.patient.update({
        where: { id: patient.id },
        data: {
          appointmentDate: startsAt,
          appointmentStatus: "CONFIRMED",
        },
      });
      return apt;
    });

    const doctor = await prisma.user.findUnique({
      where: { id: appointment.doctorId },
      select: { fullName: true },
    });

    await markPatientAppointmentConfirmed(patient.id, startsAt);

    return {
      success: true as const,
      appointmentId: appointment.id,
      displayId: appointment.displayId,
      publicId: appointment.publicId,
      rescheduleToken: appointment.rescheduleToken,
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      service: appointment.service,
      doctorName: doctor?.fullName ?? "",
      patientName: patient.fullName,
      patientFacingId: toPatientFacingId(patient.patientNumber),
    };
  } catch (err) {
    if (isUniqueViolation(err) || (err instanceof Error && err.message === SLOT_CONFLICT_MESSAGE)) {
      return { success: false as const, error: SLOT_CONFLICT_MESSAGE };
    }
    return { success: false as const, error: "Failed to create appointment" };
  }
}

export async function createAppointmentForPatient(input: unknown) {
  const session = await requirePermission("appointments:write");
  const parsed = staffBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;
  const role = session.user.role;
  let createdByType: AppointmentCreatedByType = "STAFF";
  if (role === "DOCTOR") createdByType = "DOCTOR";
  if (role === "ADMIN") createdByType = "STAFF";

  const startsAt = taiwanLocalToUtc(data.date, data.slotMinutes);
  const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60 * 1000);
  const slots = await getAvailableSlotsForDate(data.doctorId, data.date);
  if (!slots.some((s) => s.startMinutes === data.slotMinutes)) {
    return { success: false as const, error: "Selected slot is not available" };
  }

  try {
    await assertSlotFree(data.doctorId, startsAt);
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });
    if (!patient) {
      return { success: false as const, error: "Patient not found" };
    }

    const appointment = await prisma.$transaction(async (tx) => {
      const aptDisplayId = await generateAppointmentDisplayId(tx);
      const publicId = await generateAppointmentPublicId(tx);
      const apt = await tx.appointment.create({
        data: {
          displayId: aptDisplayId,
          publicId,
          patientId: patient.id,
          doctorId: data.doctorId,
          clinicId: patient.clinicId,
          service: data.service,
          startsAt,
          endsAt,
          status: "CONFIRMED",
          notes: data.notes || null,
          preferredLanguage: data.preferredLanguage || null,
          shareToken: newToken(),
          rescheduleToken: newToken(),
          createdByType,
          createdById: session.user.id,
        },
      });
      await tx.patient.update({
        where: { id: patient.id },
        data: {
          appointmentDate: startsAt,
          appointmentStatus: "CONFIRMED",
        },
      });
      return apt;
    });

    revalidatePath("/dashboard/appointments");
    await markPatientAppointmentConfirmed(patient.id, startsAt);
    return {
      success: true as const,
      appointmentId: appointment.id,
      displayId: appointment.displayId,
      publicId: appointment.publicId,
    };
  } catch (err) {
    if (isUniqueViolation(err) || (err instanceof Error && err.message === SLOT_CONFLICT_MESSAGE)) {
      return { success: false as const, error: SLOT_CONFLICT_MESSAGE };
    }
    return { success: false as const, error: "Failed to create appointment" };
  }
}

export async function createAppointmentForAgent(input: unknown) {
  const agentId = await getPartnerSessionAgentId();
  if (!agentId) {
    return { success: false as const, error: "Not authenticated" };
  }
  const parsed = staffBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;

  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, currentAgentId: agentId },
  });
  if (!patient) {
    return {
      success: false as const,
      error: "You can only book for your referred patients",
    };
  }

  const startsAt = taiwanLocalToUtc(data.date, data.slotMinutes);
  const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60 * 1000);
  const slots = await getAvailableSlotsForDate(data.doctorId, data.date);
  if (!slots.some((s) => s.startMinutes === data.slotMinutes)) {
    return { success: false as const, error: "Selected slot is not available" };
  }

  try {
    await assertSlotFree(data.doctorId, startsAt);
    const appointment = await prisma.$transaction(async (tx) => {
      const aptDisplayId = await generateAppointmentDisplayId(tx);
      const publicId = await generateAppointmentPublicId(tx);
      const apt = await tx.appointment.create({
        data: {
          displayId: aptDisplayId,
          publicId,
          patientId: patient.id,
          doctorId: data.doctorId,
          clinicId: patient.clinicId,
          service: data.service,
          startsAt,
          endsAt,
          status: "CONFIRMED",
          notes: data.notes || null,
          preferredLanguage: data.preferredLanguage || null,
          referralCode: patient.partnerId,
          shareToken: newToken(),
          rescheduleToken: newToken(),
          createdByType: "AGENT",
          createdById: agentId,
        },
      });
      await tx.patient.update({
        where: { id: patient.id },
        data: {
          appointmentDate: startsAt,
          appointmentStatus: "CONFIRMED",
        },
      });
      return apt;
    });

    await markPatientAppointmentConfirmed(patient.id, startsAt);

    return {
      success: true as const,
      appointmentId: appointment.id,
      displayId: appointment.displayId,
      publicId: appointment.publicId,
    };
  } catch (err) {
    if (isUniqueViolation(err) || (err instanceof Error && err.message === SLOT_CONFLICT_MESSAGE)) {
      return { success: false as const, error: SLOT_CONFLICT_MESSAGE };
    }
    return { success: false as const, error: "Failed to create appointment" };
  }
}

async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  extra?: { cancelledAt?: Date; noShowAt?: Date }
) {
  await requirePermission("appointments:write");
  const apt = await prisma.appointment.update({
    where: { id },
    data: { status, ...extra },
  });
  if (apt.patientId) {
    await prisma.patient.update({
      where: { id: apt.patientId },
      data: {
        appointmentStatus: status,
        ...(status !== "CANCELLED" ? { appointmentDate: apt.startsAt } : {}),
      },
    });
  }
  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/${id}`);
  return apt;
}

export async function approveAppointment(id: string) {
  try {
    await updateAppointmentStatus(id, "CONFIRMED");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to approve" };
  }
}

export async function cancelAppointment(id: string) {
  try {
    await updateAppointmentStatus(id, "CANCELLED", {
      cancelledAt: new Date(),
    });
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to cancel" };
  }
}

export async function markNoShow(id: string) {
  try {
    await updateAppointmentStatus(id, "NO_SHOW", { noShowAt: new Date() });
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to mark no-show" };
  }
}

export async function markArrived(id: string) {
  await requirePermission("appointments:write");
  try {
    const apt = await prisma.appointment.update({
      where: { id },
      data: { status: "ARRIVED", usedQRCode: true },
    });
    if (apt.patientId) {
      await prisma.patient.update({
        where: { id: apt.patientId },
        data: {
          appointmentStatus: "ARRIVED",
          appointmentDate: apt.startsAt,
          status: "PATIENT_ARRIVED",
        },
      });
    }
    revalidatePath("/dashboard/appointments");
    revalidatePath(`/dashboard/appointments/${id}`);
    if (apt.patientId) revalidatePath(`/dashboard/patients/${apt.patientId}`);
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to mark arrived" };
  }
}

export async function lookupAppointmentByPublicId(publicId: string) {
  await requirePermission("appointments:read");
  const trimmed = publicId.trim();
  if (!trimmed) {
    return {
      success: false as const,
      error: "No Appointment Found or Something Wrong!",
    };
  }
  const apt = await prisma.appointment.findFirst({
    where: { publicId: { equals: trimmed, mode: "insensitive" } },
    include: {
      patient: { select: { fullName: true } },
      doctor: { select: { fullName: true } },
    },
  });
  if (!apt) {
    return {
      success: false as const,
      error: "No Appointment Found or Something Wrong!",
    };
  }
  if (apt.usedQRCode) {
    return {
      success: false as const,
      error: "Sorry! This QR code is used.",
    };
  }
  return {
    success: true as const,
    id: apt.id,
    publicId: apt.publicId,
    status: apt.status,
    patientName: apt.patient?.fullName ?? null,
    doctorName: apt.doctor.fullName,
    startsAt: apt.startsAt.toISOString(),
  };
}

/** Set patient workflow status after a successful booking. */
async function markPatientAppointmentConfirmed(
  patientId: string,
  startsAt: Date
) {
  const existing = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { status: true },
  });
  if (!existing) return;
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      status: "APPOINTMENT_CONFIRMED",
      appointmentStatus: "CONFIRMED",
      appointmentDate: startsAt,
    },
  });
  if (existing.status !== "APPOINTMENT_CONFIRMED") {
    await prisma.patientStatusLog.create({
      data: {
        patientId,
        oldStatus: existing.status,
        newStatus: "APPOINTMENT_CONFIRMED",
        changedBy: "system:booking",
        remark: "Auto-updated on appointment booking",
      },
    });
  }
}

export async function requestPatientReschedule(id: string) {
  try {
    const apt = await prisma.appointment.findUnique({ where: { id } });
    if (!apt) return { success: false as const, error: "Not found" };
    const token = apt.rescheduleToken || newToken();
    await prisma.appointment.update({
      where: { id },
      data: {
        status: "WAITING_FOR_PATIENT_RESCHEDULE",
        rescheduleToken: token,
      },
    });
    if (apt.patientId) {
      await prisma.patient.update({
        where: { id: apt.patientId },
        data: { appointmentStatus: "WAITING_FOR_PATIENT_RESCHEDULE" },
      });
    }
    revalidatePath("/dashboard/appointments");
    revalidatePath(`/dashboard/appointments/${id}`);
    return { success: true as const, rescheduleToken: token };
  } catch {
    return { success: false as const, error: "Failed to request reschedule" };
  }
}

export async function staffRescheduleAppointment(input: {
  appointmentId: string;
  doctorId: string;
  date: string;
  slotMinutes: number;
}) {
  try {
    await requirePermission("appointments:write");
    const existing = await prisma.appointment.findUnique({
      where: { id: input.appointmentId },
    });
    if (!existing || existing.status === "CANCELLED") {
      return { success: false as const, error: "Appointment not found" };
    }
    const startsAt = taiwanLocalToUtc(input.date, input.slotMinutes);
    const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60 * 1000);
    const slots = await getAvailableSlotsForDate(input.doctorId, input.date);
    if (!slots.some((s) => s.startMinutes === input.slotMinutes)) {
      return { success: false as const, error: "Selected slot is not available" };
    }
    await assertSlotFree(input.doctorId, startsAt, existing.id);
    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: existing.id },
        data: {
          doctorId: input.doctorId,
          startsAt,
          endsAt,
          status: "RESCHEDULED",
          rescheduleToken: newToken(),
        },
      });
      if (existing.patientId) {
        await tx.patient.update({
          where: { id: existing.patientId },
          data: {
            appointmentDate: startsAt,
            appointmentStatus: "RESCHEDULED",
          },
        });
      }
    });
    revalidatePath("/dashboard/appointments");
    revalidatePath(`/dashboard/appointments/${input.appointmentId}`);
    return { success: true as const };
  } catch (err) {
    if (isUniqueViolation(err) || (err instanceof Error && err.message === SLOT_CONFLICT_MESSAGE)) {
      return { success: false as const, error: SLOT_CONFLICT_MESSAGE };
    }
    return { success: false as const, error: "Failed to reschedule" };
  }
}

export async function requestReschedule(input: unknown) {
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;
  const existing = await prisma.appointment.findFirst({
    where: { rescheduleToken: data.token },
  });
  if (!existing || existing.status === "CANCELLED") {
    return { success: false as const, error: "Appointment not found" };
  }
  if (isWithin24Hours(existing.startsAt)) {
    return {
      success: false as const,
      error: "Rescheduling is not allowed within 24 hours of the appointment",
    };
  }

  const startsAt = taiwanLocalToUtc(data.date, data.slotMinutes);
  const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60 * 1000);
  const slots = await getAvailableSlotsForDate(data.doctorId, data.date);
  if (!slots.some((s) => s.startMinutes === data.slotMinutes)) {
    return { success: false as const, error: "Selected slot is not available" };
  }

  try {
    await assertSlotFree(data.doctorId, startsAt, existing.id);
    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: existing.id },
        data: {
          doctorId: data.doctorId,
          startsAt,
          endsAt,
          status: "RESCHEDULED",
          rescheduleToken: newToken(),
        },
      });
      if (existing.patientId) {
        await tx.patient.update({
          where: { id: existing.patientId },
          data: {
            appointmentDate: startsAt,
            appointmentStatus: "RESCHEDULED",
          },
        });
      }
    });
    return { success: true as const };
  } catch (err) {
    if (isUniqueViolation(err) || (err instanceof Error && err.message === SLOT_CONFLICT_MESSAGE)) {
      return { success: false as const, error: SLOT_CONFLICT_MESSAGE };
    }
    return { success: false as const, error: "Failed to reschedule" };
  }
}

export async function getCalendarAppointments(from: string, to: string) {
  await requirePermission("appointments:read");
  const start = new Date(from);
  const end = new Date(to);
  return prisma.appointment.findMany({
    where: {
      startsAt: { gte: start, lt: end },
      status: { not: "CANCELLED" },
    },
    include: {
      patient: { select: { id: true, fullName: true, displayId: true } },
      doctor: { select: { id: true, fullName: true } },
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function getAppointmentById(id: string) {
  await requirePermission("appointments:read");
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          displayId: true,
          email: true,
          bookingShareToken: true,
          currentAgent: { select: { id: true, fullName: true } },
        },
      },
      doctor: { select: { id: true, fullName: true } },
      clinic: { select: { id: true, name: true, code: true } },
    },
  });
}

export async function getAppointmentByRescheduleToken(token: string) {
  return prisma.appointment.findFirst({
    where: { rescheduleToken: token },
    include: {
      patient: { select: { fullName: true, displayId: true } },
      doctor: { select: { id: true, fullName: true } },
    },
  });
}

export async function getPatientByBookingToken(token: string) {
  return prisma.patient.findFirst({
    where: { bookingShareToken: token },
    select: {
      id: true,
      fullName: true,
      displayId: true,
      gender: true,
      dateOfBirth: true,
      email: true,
      preferredName: true,
    },
  });
}

/** Upcoming appointment for patient booking link (not cancelled / no-show). */
export async function getUpcomingAppointmentForPatient(patientId: string) {
  return prisma.appointment.findFirst({
    where: {
      patientId,
      startsAt: { gte: new Date() },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    include: {
      doctor: { select: { fullName: true } },
    },
    orderBy: { startsAt: "asc" },
  });
}

/** All appointments for a patient (dashboard). */
export async function getAppointmentsForPatient(patientId: string) {
  await requirePermission("appointments:read");
  return prisma.appointment.findMany({
    where: { patientId },
    include: {
      doctor: { select: { id: true, fullName: true } },
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function ensurePatientBookingToken(patientId: string) {
  await requireAuth();
  const existing = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { bookingShareToken: true },
  });
  if (existing?.bookingShareToken) return existing.bookingShareToken;
  const token = newToken();
  await prisma.patient.update({
    where: { id: patientId },
    data: { bookingShareToken: token },
  });
  return token;
}

export async function listPatientsForBooking(search?: string) {
  await requirePermission("appointments:write");
  return prisma.patient.findMany({
    where: search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { displayId: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: { id: true, fullName: true, displayId: true },
    orderBy: { fullName: "asc" },
    take: 50,
  });
}

export async function listAgentPatientsForBooking() {
  const agentId = await getPartnerSessionAgentId();
  if (!agentId) return [];
  return prisma.patient.findMany({
    where: { currentAgentId: agentId },
    select: { id: true, fullName: true, displayId: true },
    orderBy: { fullName: "asc" },
  });
}

export async function getPartnerCalendarAppointments(from: string, to: string) {
  const agentId = await getPartnerSessionAgentId();
  if (!agentId) return [];
  const start = new Date(from);
  const end = new Date(to);
  return prisma.appointment.findMany({
    where: {
      startsAt: { gte: start, lt: end },
      status: { not: "CANCELLED" },
      patient: { currentAgentId: agentId },
    },
    include: {
      patient: { select: { id: true, fullName: true, displayId: true } },
      doctor: { select: { id: true, fullName: true } },
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function canManageAppointments(role: string | null | undefined) {
  return hasPermission(role, "appointments:read");
}
