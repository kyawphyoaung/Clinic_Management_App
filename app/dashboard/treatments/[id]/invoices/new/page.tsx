import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTreatmentById } from "@/lib/actions/treatments";
import { prisma } from "@/lib/db";
import { peekNextInvoiceId } from "@/lib/utils/display-id";
import { decrypt } from "@/lib/utils/encryption";
import { InvoiceEditor } from "@/components/admin/invoice-editor";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "New Invoice",
};

function maybeDecrypt(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.includes(":")) return value;
  try {
    return decrypt(value);
  } catch {
    return value;
  }
}

export default async function NewInvoicePage({ params }: PageProps) {
  const { id: treatmentId } = await params;
  const treatment = await getTreatmentById(treatmentId);
  if (!treatment) notFound();

  const [patient, previewInvoiceId] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: treatment.patient.id },
      select: {
        fullName: true,
        streetAddress: true,
        city: true,
        countryOfResidence: true,
        mobileNumber: true,
      },
    }),
    peekNextInvoiceId(prisma),
  ]);
  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={`/dashboard/treatments/${treatmentId}`} />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Invoice</h1>
          <p className="text-sm text-muted-foreground">
            {patient.fullName}
            {treatment.shortId ? ` · ${treatment.shortId}` : ""}
          </p>
        </div>
      </div>

      <InvoiceEditor
        treatmentId={treatmentId}
        previewInvoiceId={previewInvoiceId}
        defaultAgentRelated={Boolean(treatment.visit?.agentId)}
        patient={{
          fullName: patient.fullName,
          streetAddress: maybeDecrypt(patient.streetAddress),
          city: maybeDecrypt(patient.city),
          countryOfResidence: patient.countryOfResidence,
          mobileNumber: maybeDecrypt(patient.mobileNumber),
        }}
      />
    </div>
  );
}
