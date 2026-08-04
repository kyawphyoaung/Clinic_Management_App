import { PatientRegistrationForm } from "@/components/registration/patient-registration-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patient Registration",
};

type PageProps = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const { ref } = await searchParams;

  return (
    <main className="container mx-auto max-w-[100vw] overflow-x-hidden px-3 py-8 sm:px-4 sm:py-10">
      <PatientRegistrationForm partnerRef={ref} />
    </main>
  );
}
