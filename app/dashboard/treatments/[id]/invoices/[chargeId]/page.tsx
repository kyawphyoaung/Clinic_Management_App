import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTreatmentById } from "@/lib/actions/treatments";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/utils/encryption";
import { InvoiceEditor } from "@/components/admin/invoice-editor";
import { Button } from "@/components/ui/button";
import type { ServiceCategory } from "@/prisma/generated/prisma/enums";

type PageProps = {
  params: Promise<{ id: string; chargeId: string }>;
};

export const metadata: Metadata = {
  title: "Invoice",
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

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id: treatmentId, chargeId } = await params;
  const treatment = await getTreatmentById(treatmentId);
  if (!treatment) notFound();

  const charge = treatment.charges.find((c) => c.id === chargeId);
  if (!charge) notFound();

  const patient = await prisma.patient.findUnique({
    where: { id: treatment.patient.id },
    select: {
      fullName: true,
      streetAddress: true,
      city: true,
      countryOfResidence: true,
      mobileNumber: true,
    },
  });
  if (!patient) notFound();

  const initialLines = charge.lines.map((l, i) => ({
    key: `${l.id ?? i}`,
    serviceCategory: l.serviceCategory as ServiceCategory,
    customName:
      l.serviceCategory === "OTHER" && l.notes ? l.notes : "",
    quantity: Number(l.quantity),
    unitPrice: Number(l.unitPrice),
  }));

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
          <h1 className="text-2xl font-semibold">Invoice {charge.shortId}</h1>
          <p className="text-sm text-muted-foreground">
            {patient.fullName}
            {treatment.shortId ? ` · ${treatment.shortId}` : ""}
          </p>
        </div>
      </div>

      <InvoiceEditor
        mode="edit"
        treatmentId={treatmentId}
        chargeId={charge.id}
        previewInvoiceId={charge.shortId}
        initialLines={initialLines}
        initialDiscountAmount={Number(charge.discount)}
        initialIsAgentRelated={charge.isAgentRelated !== false}
        initialInvoiceDate={
          charge.createdAt
            ? new Date(charge.createdAt).toISOString().slice(0, 10)
            : undefined
        }
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
