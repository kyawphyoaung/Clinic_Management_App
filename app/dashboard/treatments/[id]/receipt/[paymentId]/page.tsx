import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTreatmentById } from "@/lib/actions/treatments";
import { summarizeTreatment } from "@/lib/utils/treatment-summary";
import { ReceiptView } from "@/components/admin/receipt-view";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string; paymentId: string }>;
};

export const metadata: Metadata = {
  title: "Payment Receipt",
};

export default async function ReceiptPage({ params }: PageProps) {
  const { id, paymentId } = await params;
  const treatment = await getTreatmentById(id);
  if (!treatment) notFound();

  const payment = treatment.payments.find((p) => p.id === paymentId);
  if (!payment) notFound();

  const summary = summarizeTreatment(treatment);
  const paymentBalance = summary.paymentsWithBalance.find((p) => p.id === paymentId);

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
            {treatment.patient.fullName} · {treatment.patient.displayId}
          </p>
        </div>
      </div>

      <ReceiptView
        receipt={{
          patientName: treatment.patient.fullName,
          patientDisplayId: treatment.patient.displayId,
          treatmentDate: treatment.treatmentDate.toLocaleDateString(),
          diagnosis: treatment.diagnosis ?? "—",
          paymentAmount: Number(payment.amount),
          paymentMethod: payment.method,
          paymentDate: payment.paymentDate.toLocaleDateString(),
          paymentTime: payment.createdAt.toLocaleTimeString(),
          reference: payment.reference ?? "—",
          remainingBalance: paymentBalance?.balanceAfter ?? summary.balance,
          totalCharges: summary.totalCharges,
          totalPaid: summary.totalPaid,
        }}
      />
    </div>
  );
}
