"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CashflowOverview } from "@/lib/data/cashflow";
import { formatMoney } from "@/lib/utils/money";
import {
  ClientTablePagination,
  paginateSlice,
} from "@/components/admin/client-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PIE_COLORS = [
  "#0f766e",
  "#0369a1",
  "#b45309",
  "#be123c",
  "#7c3aed",
  "#15803d",
  "#c2410c",
  "#0e7490",
];

type CashflowDashboardProps = {
  data: CashflowOverview;
  dateFrom?: string;
  dateTo?: string;
  year: number;
  month?: number;
};

function moneyTooltip(value: unknown) {
  return typeof value === "number" ? formatMoney(value) : String(value ?? "");
}

function KpiCard({
  title,
  value,
  tone = "neutral",
  note,
}: {
  title: string;
  value: string;
  tone?: "positive" | "negative" | "warning" | "neutral";
  note?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "negative"
        ? "text-red-600 dark:text-red-400"
        : tone === "warning"
          ? "text-amber-600 dark:text-amber-400"
          : "text-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-xl font-semibold ${toneClass}`}>{value}</p>
        {note ? (
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PieCard({
  title,
  data,
  emptyText,
}: {
  title: string;
  data: { name: string; value: number }[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => moneyTooltip(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function statusBadgeVariant(
  status: "Paid" | "Partial" | "Overdue"
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "Paid") return "default";
  if (status === "Overdue") return "destructive";
  return "secondary";
}

function statusToneClass(status: "Paid" | "Partial" | "Overdue") {
  if (status === "Paid") return "bg-emerald-600 text-white border-transparent";
  if (status === "Overdue") return "bg-red-600 text-white border-transparent";
  return "bg-amber-500 text-white border-transparent";
}

export function CashflowDashboard({
  data,
  dateFrom = "",
  dateTo = "",
  year,
  month,
}: CashflowDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "Paid" | "Partial" | "Overdue"
  >("ALL");
  const [patientPage, setPatientPage] = useState(1);
  const [patientPageSize, setPatientPageSize] = useState(20);

  const { kpis } = data;

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (!dateFrom && !dateTo) {
      params.set("year", String(year));
      if (month) params.set("month", String(month));
    }
    return `/dashboard/cashflow/export?${params.toString()}`;
  }, [dateFrom, dateTo, year, month]);

  const filteredPatients = useMemo(() => {
    if (statusFilter === "ALL") return data.patientPaymentStatus;
    return data.patientPaymentStatus.filter((r) => r.status === statusFilter);
  }, [data.patientPaymentStatus, statusFilter]);

  const pagedPatients = useMemo(
    () => paginateSlice(filteredPatients, patientPage, patientPageSize),
    [filteredPatients, patientPage, patientPageSize]
  );

  const chartSeries =
    data.monthlySeries.length > 0
      ? data.monthlySeries
      : Array.from({ length: 12 }, (_, i) => {
          const d = new Date();
          d.setUTCDate(1);
          d.setUTCMonth(d.getUTCMonth() - (11 - i));
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, "0");
          return {
            month: `${y}-${m}`,
            inflow: 0,
            outflow: 0,
            cumulative: 0,
          };
        });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cashflow Overview</h1>
          <p className="text-sm text-muted-foreground">
            Revenue, commissions, forecasts, and payment status.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <form method="GET" className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              From
              <input
                className="ml-2 h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                name="dateFrom"
                type="date"
                defaultValue={dateFrom}
              />
            </label>
            <label className="text-sm">
              To
              <input
                className="ml-2 h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                name="dateTo"
                type="date"
                defaultValue={dateTo}
              />
            </label>
            <span className="px-1 text-xs text-muted-foreground">or</span>
            <label className="text-sm">
              Year
              <input
                className="ml-2 h-9 w-24 rounded-md border border-input bg-transparent px-2 text-sm"
                name="year"
                type="number"
                defaultValue={year}
              />
            </label>
            <label className="text-sm">
              Month
              <input
                className="ml-2 h-9 w-20 rounded-md border border-input bg-transparent px-2 text-sm"
                name="month"
                type="number"
                min={1}
                max={12}
                defaultValue={month ?? ""}
                placeholder="All"
              />
            </label>
            <Button type="submit" variant="outline">
              Filter
            </Button>
          </form>
          <Button render={<Link href={exportHref} />} variant="outline">
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Total Revenue"
          value={formatMoney(kpis.totalRevenue)}
          tone="positive"
        />
        <KpiCard
          title="Agent Commission"
          value={formatMoney(kpis.totalCommission)}
          tone="negative"
        />
        <KpiCard
          title="Net Profit"
          value={formatMoney(kpis.netProfit)}
          tone={kpis.netProfit >= 0 ? "positive" : "negative"}
        />
        <KpiCard
          title="Operating Cash Flow"
          value={formatMoney(kpis.operatingCashFlow)}
          tone={kpis.operatingCashFlow >= 0 ? "positive" : "negative"}
        />
        <KpiCard
          title="DSO"
          value={kpis.dso != null ? `${kpis.dso} days` : "N/A"}
          tone="warning"
          note="Avg days to collect"
        />
        <KpiCard
          title="DPO"
          value="N/A"
          tone="warning"
          note="No supplier payables data"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Deposits held"
          value={formatMoney(kpis.totalDepositsHeld)}
        />
        <KpiCard
          title="Outstanding invoices"
          value={formatMoney(kpis.outstandingCharges)}
          tone={kpis.outstandingCharges > 0 ? "warning" : "neutral"}
        />
        <KpiCard
          title="Revenue collected"
          value={formatMoney(kpis.revenueCollected)}
          tone="positive"
        />
        <KpiCard
          title="Transferred to clinic"
          value={formatMoney(kpis.transferredToClinic)}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Monthly inflow &amp; outflow
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartSeries}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => moneyTooltip(v)} />
              <Legend />
              <Bar
                dataKey="inflow"
                name="Inflow"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="outflow"
                name="Outflow"
                fill="#dc2626"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Cumulative"
                stroke="#0369a1"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Cashflow forecast (next 6 months)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.forecast}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => moneyTooltip(v)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="inflow"
                name="Projected inflow"
                stroke="#16a34a"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="outflow"
                name="Projected outflow"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-muted-foreground">
            Projection uses the average of the last 3 months of inflow/outflow.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <PieCard
          title="Revenue by patient group"
          data={data.revenueBySource}
          emptyText="No revenue by source in this period."
        />
        <PieCard
          title="Revenue by treatment type"
          data={data.revenueByTreatmentType}
          emptyText="No treatment revenue in this period."
        />
        <PieCard
          title="Revenue by country"
          data={data.revenueByCountry}
          emptyText="No country revenue data in this period."
        />
        <PieCard
          title="Currency distribution (TWD eq.)"
          data={data.currencyDistributionPie}
          emptyText="No deposit currency data in this period."
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Multi-currency inflow</CardTitle>
        </CardHeader>
        <CardContent>
          {data.currencyBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No multi-currency deposits in this period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">TWD equivalent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.currencyBreakdown.map((row) => (
                  <TableRow key={row.currency}>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell className="text-right">
                      {row.originalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {row.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(row.amountTwd)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base">Patient payment status</CardTitle>
          <label className="text-sm text-muted-foreground">
            Status{" "}
            <select
              className="ml-1 h-9 rounded-md border border-input bg-transparent px-2 text-sm text-foreground"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(
                  e.target.value as "ALL" | "Paid" | "Partial" | "Overdue"
                );
                setPatientPage(1);
              }}
            >
              <option value="ALL">All</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
            </select>
          </label>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPatients.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              No patients match this filter for the selected period.
            </p>
          ) : (
            <>
              <div className="px-6 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient name</TableHead>
                      <TableHead className="text-right">Total deposits</TableHead>
                      <TableHead className="text-right">
                        Invoice payments
                      </TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedPatients.map((row) => (
                      <TableRow key={row.patientId}>
                        <TableCell className="font-medium">
                          {row.patientName}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.totalDeposits)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                          {formatMoney(row.totalPayments)}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            row.outstanding > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : ""
                          }`}
                        >
                          {formatMoney(row.outstanding)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusBadgeVariant(row.status)}
                            className={statusToneClass(row.status)}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ClientTablePagination
                page={patientPage}
                pageSize={patientPageSize}
                total={filteredPatients.length}
                onPageChange={setPatientPage}
                onPageSizeChange={setPatientPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By Deposit Receiver</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.receivers.length === 0 ? (
            <p className="text-muted-foreground">No deposit receivers yet.</p>
          ) : (
            data.receivers.map((r) => (
              <div
                key={r.id}
                className="flex justify-between border-b border-border py-2 last:border-0"
              >
                <span>{r.name}</span>
                <span>
                  Held {formatMoney(r.held)} · Clinic{" "}
                  {formatMoney(r.transferred)} · Balance{" "}
                  {formatMoney(r.balance)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
