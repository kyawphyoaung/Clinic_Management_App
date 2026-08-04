import { z } from "zod";

export const publicBookingSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  phone: z
    .string()
    .min(8, "Phone is required")
    .regex(/^\+?[0-9\s-]{8,20}$/, "Invalid phone number"),
  email: z.string().email("Valid email is required"),
  preferredLanguage: z.string().optional(),
  notes: z.string().optional(),
  referralCode: z.string().optional(),
  service: z.string().min(1, "Service is required"),
  doctorId: z.string().uuid("Select a doctor"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  slotMinutes: z.coerce.number().int().min(0).max(24 * 60 - 30),
});

export const patientLinkBookingSchema = z.object({
  patientToken: z.string().min(1),
  preferredLanguage: z.string().optional(),
  notes: z.string().optional(),
  service: z.string().min(1, "Service is required"),
  doctorId: z.string().uuid("Select a doctor"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  slotMinutes: z.coerce.number().int().min(0).max(24 * 60 - 30),
});

export const staffBookingSchema = z.object({
  patientId: z.string().uuid("Select a patient"),
  service: z.string().min(1, "Service is required"),
  doctorId: z.string().uuid("Select a doctor"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  slotMinutes: z.coerce.number().int().min(0).max(24 * 60 - 30),
  notes: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

export const rescheduleSchema = z.object({
  token: z.string().min(1),
  doctorId: z.string().uuid("Select a doctor"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  slotMinutes: z.coerce.number().int().min(0).max(24 * 60 - 30),
});

export const weeklyAvailabilitySchema = z.object({
  doctorId: z.string().uuid(),
  windows: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.number().int().min(0).max(24 * 60),
      endTime: z.number().int().min(0).max(24 * 60),
      isActive: z.boolean().default(true),
    })
  ),
});

export const availabilityOverrideSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isBlocked: z.boolean(),
  startTime: z.number().int().min(0).max(24 * 60).optional().nullable(),
  endTime: z.number().int().min(0).max(24 * 60).optional().nullable(),
  reason: z.string().optional().nullable(),
});
