import { AgentRegistrationForm } from "@/components/registration/agent-registration-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Registration",
};

export default function PartnerRegisterPage() {
  return (
    <main className="container mx-auto max-w-[100vw] overflow-x-hidden px-3 py-8 sm:px-4 sm:py-10">
      <AgentRegistrationForm />
    </main>
  );
}
