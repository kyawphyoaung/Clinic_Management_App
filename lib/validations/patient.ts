import { z } from "zod";
import { PatientSource, PatientStatus } from "@/prisma/generated/prisma/enums";

export const patientFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  phone: z.string().max(30).optional().or(z.literal("")),
  age: z.string().optional(),
  gender: z.string().optional().or(z.literal("")),
  source: z.nativeEnum(PatientSource),
  status: z.nativeEnum(PatientStatus),
  agentId: z.string().uuid().optional().or(z.literal("")),
});

export const patientUpdateStatusSchema = z.object({
  patientId: z.string().uuid(),
  status: z.nativeEnum(PatientStatus),
});

export const patientSearchSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(PatientStatus).optional(),
  source: z.nativeEnum(PatientSource).optional(),
  agentId: z.string().uuid().optional(),
});

export type PatientFormInput = z.infer<typeof patientFormSchema>;
