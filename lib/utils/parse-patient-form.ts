import type { PatientFormInput } from "@/lib/validations/patient";
import type { PatientSource, PatientStatus } from "@/prisma/generated/prisma/enums";

export function parsePatientFormData(formData: FormData): PatientFormInput {
  const ageRaw = (formData.get("age") as string) || "";

  return {
    name: formData.get("name") as string,
    phone: (formData.get("phone") as string) || "",
    age: ageRaw,
    gender: (formData.get("gender") as string) || "",
    source: formData.get("source") as PatientSource,
    status: formData.get("status") as PatientStatus,
    agentId: (formData.get("agentId") as string) || "",
  };
}
