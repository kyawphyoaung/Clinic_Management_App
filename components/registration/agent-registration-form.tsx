"use client";

import { ConfigDrivenForm } from "@/components/config-driven-form/config-driven-form";
import { AGENT_REGISTRATION_FORM } from "@/lib/constants/agent_reg_form";
import {
  submitAgentRegistration,
  submitStaffAgentRegistration,
} from "@/lib/actions/agent-registration";

type AgentRegistrationFormProps = {
  mode?: "public" | "staff";
};

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function AgentRegistrationForm({ mode = "public" }: AgentRegistrationFormProps) {
  const sections =
    mode === "staff"
      ? AGENT_REGISTRATION_FORM.map((section) => ({
          ...section,
          fields: section.fields.filter(
            (field) =>
              ![
                "heading_signature",
                "use_master_signature",
                "signature_data",
                "applicant_name",
                "signature_date",
              ].includes(field.name)
          ),
        }))
      : AGENT_REGISTRATION_FORM;

  return (
    <ConfigDrivenForm
      sections={sections}
      formType="agent"
      mode={mode}
      title={mode === "staff" ? "Digitize Partner Registration" : "Partner Registration"}
      description={
        mode === "staff"
          ? "Staff-only form to digitize signed partner registrations."
          : "Apply to become an Authorized Referral Partner."
      }
      defaultOverrides={mode === "public" ? { signature_date: todayString() } : undefined}
      onSubmit={async (payload) => {
        const result =
          mode === "staff"
            ? await submitStaffAgentRegistration(payload)
            : await submitAgentRegistration(payload);
        return {
          success: result.success,
          error: result.error,
        };
      }}
    />
  );
}
