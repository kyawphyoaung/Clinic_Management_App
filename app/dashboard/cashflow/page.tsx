import type { Metadata } from "next";
import { getCashflowOverview } from "@/lib/data/cashflow";
import { CashflowDashboard } from "@/components/admin/cashflow-dashboard";

export const metadata: Metadata = { title: "Cashflow" };

type PageProps = {
  searchParams: Promise<{
    year?: string;
    month?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function CashflowPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const dateFrom = params.dateFrom?.trim() || undefined;
  const dateTo = params.dateTo?.trim() || undefined;
  const year = Number(params.year) || new Date().getFullYear();
  const month = params.month ? Number(params.month) : undefined;

  const data = await getCashflowOverview(
    dateFrom || dateTo
      ? { dateFrom, dateTo }
      : { year, month }
  );

  return (
    <CashflowDashboard
      data={data}
      dateFrom={dateFrom ?? ""}
      dateTo={dateTo ?? ""}
      year={year}
      month={month}
    />
  );
}
