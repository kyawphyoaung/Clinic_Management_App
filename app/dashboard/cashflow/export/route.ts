import { NextResponse } from "next/server";
import { getCashflowOverview } from "@/lib/data/cashflow";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateFrom = url.searchParams.get("dateFrom") || undefined;
  const dateTo = url.searchParams.get("dateTo") || undefined;
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
  const monthRaw = url.searchParams.get("month");
  const month = monthRaw ? Number(monthRaw) : undefined;

  const data = await getCashflowOverview(
    dateFrom || dateTo ? { dateFrom, dateTo } : { year, month }
  );

  const rows = [
    ["Metric", "Amount (TWD)"],
    ["Total Revenue", String(data.kpis.totalRevenue)],
    ["Total Agent Commission", String(data.kpis.totalCommission)],
    ["Net Profit", String(data.kpis.netProfit)],
    ["Operating Cash Flow", String(data.kpis.operatingCashFlow)],
    ["DSO (days)", data.kpis.dso != null ? String(data.kpis.dso) : "N/A"],
    ["DPO", "N/A — No supplier payables data"],
    ["Deposits held", String(data.totalDepositsHeld)],
    ["Outstanding charges", String(data.outstandingCharges)],
    ["Revenue collected", String(data.revenueCollected)],
    ["Transferred to clinic", String(data.transferredToClinic)],
    [],
    ["Receiver", "Held", "Transferred", "Balance"],
    ...data.receivers.map((r) => [
      r.name,
      String(r.held),
      String(r.transferred),
      String(r.balance),
    ]),
    [],
    ["Patient", "Deposits", "Payments", "Outstanding", "Status"],
    ...data.patientPaymentStatus.map((p) => [
      p.patientName,
      String(p.totalDeposits),
      String(p.totalPayments),
      String(p.outstanding),
      p.status,
    ]),
  ];
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const filename =
    dateFrom || dateTo
      ? `cashflow-${dateFrom ?? "start"}-${dateTo ?? "end"}.csv`
      : `cashflow-${year}${month ? `-${month}` : ""}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
