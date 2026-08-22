"use client";

import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";

type ReceiptLine = {
  description: string;
  unitPrice: number;
  quantity: number;
};

type Props = {
  invoiceId: string;
  issueDate: string;
  patient: {
    fullName: string;
    streetAddress?: string | null;
    city?: string | null;
    countryOfResidence?: string | null;
    mobileNumber?: string | null;
  };
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  paymentMethod: string;
  paymentDate: string;
  reference?: string | null;
};

export function PaymentReceiptView({
  invoiceId,
  issueDate,
  patient,
  lines,
  subtotal,
  discount,
  total,
  amountPaid,
  paymentMethod,
  paymentDate,
  reference,
}: Props) {
  const router = useRouter();
  const addressLine = [patient.streetAddress, patient.city]
    .filter(Boolean)
    .join(", ");
  const discountPct = subtotal > 0 ? Math.round((discount / subtotal) * 10000) / 100 : 0;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap gap-2">
        <Button type="button" onClick={() => window.print()}>
          Print
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Done
        </Button>
      </div>

      <div className="flex justify-center bg-[#d6e4f0] py-8 print:bg-white print:py-0">
        <article
          className="invoice-sheet relative w-[210mm] max-w-full overflow-hidden px-10 py-8 text-slate-900 shadow-md print:shadow-none"
          style={{ minHeight: "297mm", backgroundColor: "#e8f1f8" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/main_logo.svg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[55%] w-auto -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.07] grayscale"
          />

          <div className="relative z-10">
            <header className="flex items-start justify-between gap-6 border-b border-slate-400/60 pb-6">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/main_logo.svg"
                  alt="Revivora Medical Tourism"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold tracking-wide text-slate-800 sm:text-3xl">
                  Medical Billing Invoice
                </h1>
                <p className="mt-1 font-mono text-sm text-slate-600">
                  Receipt {invoiceId}
                </p>
              </div>
            </header>

            <div className="mt-8 flex flex-wrap justify-between gap-6">
              <div className="space-y-1 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bill To
                </p>
                <p className="text-base font-semibold">{patient.fullName}</p>
                {addressLine ? <p>{addressLine}</p> : null}
                <p>{patient.countryOfResidence || "—"}</p>
                <p>{patient.mobileNumber || "—"}</p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Issue Date
                </p>
                <p>{issueDate}</p>
                <p className="pt-2 text-xs uppercase tracking-wide text-slate-500">
                  Payment
                </p>
                <p>
                  {paymentDate} · {paymentMethod}
                </p>
                {reference ? <p>Ref: {reference}</p> : null}
              </div>
            </div>

            <div className="mt-10 border border-slate-800 bg-white/50">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-800 px-3 py-2 text-left font-semibold">
                      Description
                    </th>
                    <th className="border-b border-slate-800 px-3 py-2 text-right font-semibold">
                      Price
                    </th>
                    <th className="border-b border-slate-800 px-3 py-2 text-right font-semibold">
                      Qty
                    </th>
                    <th className="border-b border-slate-800 px-3 py-2 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-8 text-center text-slate-400"
                      >
                        No line items
                      </td>
                    </tr>
                  ) : (
                    lines.map((l, i) => (
                      <tr key={`${l.description}-${i}`}>
                        <td className="px-3 py-3">{l.description}</td>
                        <td className="px-3 py-3 text-right">
                          {formatMoney(l.unitPrice)}
                        </td>
                        <td className="px-3 py-3 text-right">{l.quantity}</td>
                        <td className="px-3 py-3 text-right">
                          {formatMoney(l.quantity * l.unitPrice)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="relative border-t border-slate-800 px-3 py-4">
                <div className="ml-auto w-56 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount {discountPct}%</span>
                    <span>{formatMoney(discount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(total)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Amount Paid</span>
                    <span>{formatMoney(amountPaid)}</span>
                  </div>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/paid.webp"
                  alt="Paid"
                  className="pointer-events-none absolute bottom-2 right-4 h-24 w-auto object-contain opacity-90"
                />
              </div>
            </div>

            <footer className="mt-12 flex flex-wrap items-end justify-between gap-4 border-t border-slate-300/80 pt-6 text-xs text-slate-600">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/main_logo.svg"
                  alt="Revivora"
                  className="h-8 w-auto object-contain"
                />
                <p className="mt-1">www.revivoratw.com</p>
              </div>
              <p className="max-w-sm text-right leading-relaxed">
                For more information or any issues or concerns, email us at{" "}
                <span className="font-medium">uroadrian.tw@gmail.com</span>
              </p>
            </footer>
          </div>
        </article>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-sheet, .invoice-sheet * { visibility: visible; }
          .invoice-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
    </div>
  );
}
