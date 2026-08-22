"use client";

import { ConfigDrivenForm } from "@/components/config-driven-form/config-driven-form";
import { PATIENT_REGISTRATION_FORM } from "@/lib/constants/patient_reg_form";
import {
  submitPublicPatientRegistration,
  submitStaffPatientRegistration,
} from "@/lib/actions/patient-registration";

type PatientRegistrationFormProps = {
  partnerRef?: string;
  mode?: "public" | "staff";
};

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function PatientRegistrationForm({
  partnerRef,
  mode = "public",
}: PatientRegistrationFormProps) {
  const refCode = partnerRef?.trim().toUpperCase();
  const sections =
    mode === "staff"
      ? PATIENT_REGISTRATION_FORM.map((section) => ({
          ...section,
          fields: section.fields.filter(
            (field) =>
              ![
                "use_master_signature",
                "signature_name",
                "signature_data",
                "consent_date",
              ].includes(field.name)
          ),
        }))
      : PATIENT_REGISTRATION_FORM;

  return (
    <ConfigDrivenForm
      sections={sections}
      formType="patient"
      mode={mode}
      title={
        mode === "staff"
          ? "Digitize Paper Registration"
          : "Patient Registration"
      }
      description={
        mode === "staff"
          ? "Enter details from the signed paper form and upload the paper signature."
          : "Complete all sections to register for medical tourism services."
      }
      defaultOverrides={{
        ...(refCode ? { partner_id: refCode } : {}),
        ...(mode === "public" ? { consent_date: todayString() } : {}),
      }}
      readOnlyOverrides={refCode ? { partner_id: true } : undefined}
      onSubmit={async (payload) => {
        if (mode === "staff") {
          const result = await submitStaffPatientRegistration(payload);
          return {
            success: result.success,
            displayId: result.displayId,
            patientNumber: result.patientNumber,
            error: result.error,
          };
        }

        const result = await submitPublicPatientRegistration(payload);
        return {
          success: result.success,
          displayId: result.displayId,
          patientNumber: result.patientNumber,
          error: result.error,
        };
      }}
    />
  );
}
