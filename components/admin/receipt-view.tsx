"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMoney } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ReceiptViewProps = {
  receipt: {
    patientName: string;
    patientDisplayId: string;
    treatmentDate: string;
    diagnosis: string;
    paymentAmount: number;
    paymentMethod: string;
    paymentDate: string;
    paymentTime: string;
    reference: string;
    remainingBalance: number;
    totalCharges: number;
    totalPaid: number;
    depositApplied?: number;
    charges?: { description: string; amount: number }[];
  };
};

export function ReceiptView({ receipt }: ReceiptViewProps) {
  function handlePrint() {
    window.print();
  }

  function handleDownloadPdf() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Payment Receipt", 14, 20);
    doc.setFontSize(11);
    doc.text(`Patient: ${receipt.patientName}`, 14, 32);
    doc.text(`Patient ID: ${receipt.patientDisplayId}`, 14, 38);
    doc.text(`Treatment Date: ${receipt.treatmentDate}`, 14, 44);
    doc.text(`Diagnosis: ${receipt.diagnosis}`, 14, 50);

    autoTable(doc, {
      startY: 58,
      head: [["Field", "Value"]],
      body: [
        ["Payment Amount", formatMoney(receipt.paymentAmount)],
        ["Deposit Applied", formatMoney(receipt.depositApplied ?? 0)],
        ["Payment Method", receipt.paymentMethod],
        ["Date", receipt.paymentDate],
        ["Time", receipt.paymentTime],
        ["Reference", receipt.reference],
        ["Total Charges", formatMoney(receipt.totalCharges)],
        ["Total Paid", formatMoney(receipt.totalPaid)],
        ["Remaining Balance", formatMoney(receipt.remainingBalance)],
      ],
    });

    doc.save(`receipt-${receipt.patientDisplayId}.pdf`);
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex gap-2">
        <Button type="button" onClick={handlePrint}>
          Print
        </Button>
        <Button type="button" variant="outline" onClick={handleDownloadPdf}>
          Download PDF
        </Button>
      </div>

      <Card id="receipt-print-area">
        <CardHeader>
          <CardTitle>Payment Receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Patient Name</p>
              <p className="font-medium">{receipt.patientName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Patient ID</p>
              <p className="font-medium">{receipt.patientDisplayId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Treatment Date</p>
              <p className="font-medium">{receipt.treatmentDate}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Diagnosis</p>
              <p className="font-medium">{receipt.diagnosis}</p>
            </div>
          </div>

          <div className="rounded-md border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Payment Amount</p>
                <p className="text-lg font-semibold">
                  {formatMoney(receipt.paymentAmount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Deposit Applied</p>
                <p className="font-medium">
                  {formatMoney(receipt.depositApplied ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">{receipt.paymentMethod}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date & Time</p>
                <p className="font-medium">
                  {receipt.paymentDate} {receipt.paymentTime}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Reference</p>
                <p className="font-medium">{receipt.reference}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Total Charges</p>
              <p className="font-medium">{formatMoney(receipt.totalCharges)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Paid</p>
              <p className="font-medium text-success">
                {formatMoney(receipt.totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Remaining Balance</p>
              <p className="font-medium">
                {formatMoney(receipt.remainingBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
