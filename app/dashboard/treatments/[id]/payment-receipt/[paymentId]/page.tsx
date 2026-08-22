import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTreatmentById } from "@/lib/actions/treatments";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/utils/encryption";
import { PaymentReceiptView } from "@/components/admin/payment-receipt-view";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string; paymentId: string }>;
};

export const metadata: Metadata = {
  title: "Payment Receipt",
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

export default async function ReceiptPage({ params }: PageProps) {
  const { id, paymentId } = await params;
  const treatment = await getTreatmentById(id);
  if (!treatment) notFound();

  const payment = treatment.payments.find((p) => p.id === paymentId);
  if (!payment) notFound();

  const patientRow = await prisma.patient.findUnique({
    where: { id: treatment.patient.id },
    select: {
      fullName: true,
      streetAddress: true,
      city: true,
      countryOfResidence: true,
      mobileNumber: true,
    },
  });
  if (!patientRow) notFound();

  const allocatedChargeIds = new Set(
    (payment.allocations ?? []).map((a) => a.chargeId)
  );
  const linkedCharges = treatment.charges.filter((c) =>
    allocatedChargeIds.size > 0
      ? allocatedChargeIds.has(c.id)
      : false
  );

  const lines =
    linkedCharges.length > 0
      ? linkedCharges.flatMap((c) =>
          c.lines.map((l) => ({
            description:
              l.serviceCategory === "OTHER" && l.notes
                ? l.notes
                : l.serviceCategory,
            unitPrice: Number(l.unitPrice),
            quantity: Number(l.quantity),
          }))
        )
      : [
          {
            description: "Payment",
            unitPrice: Number(payment.amount) + Number(payment.depositAppliedAmount ?? 0),
            quantity: 1,
          },
        ];

  const subtotal = linkedCharges.reduce(
    (s, c) => s + Number(c.totalPrice),
    0
  );
  const discount = linkedCharges.reduce((s, c) => s + Number(c.discount), 0);
  const total =
    linkedCharges.length > 0
      ? linkedCharges.reduce((s, c) => s + Number(c.netPrice), 0)
      : Number(payment.amount) + Number(payment.depositAppliedAmount ?? 0);

  const primaryId =
    linkedCharges[0]?.shortId ??
    `PAY-${paymentId.slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={`/dashboard/treatments/${id}`} />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Payment Receipt</h1>
          <p className="text-sm text-muted-foreground">
            {patientRow.fullName} · {treatment.patient.displayId}
          </p>
        </div>
      </div>

      <PaymentReceiptView
        invoiceId={primaryId}
        issueDate={payment.paymentDate.toLocaleDateString()}
        patient={{
          fullName: patientRow.fullName,
          streetAddress: maybeDecrypt(patientRow.streetAddress),
          city: maybeDecrypt(patientRow.city),
          countryOfResidence: patientRow.countryOfResidence,
          mobileNumber: maybeDecrypt(patientRow.mobileNumber),
        }}
        lines={lines}
        subtotal={subtotal || total}
        discount={discount}
        total={total}
        amountPaid={
          Number(payment.amount) + Number(payment.depositAppliedAmount ?? 0)
        }
        paymentMethod={payment.method}
        paymentDate={payment.paymentDate.toLocaleDateString()}
        reference={payment.reference}
      />
    </div>
  );
}
