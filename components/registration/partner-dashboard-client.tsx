"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { logoutPartner } from "@/lib/actions/partner-auth";
import { CopyRegistrationLink } from "@/components/registration/copy-registration-link";
import { formatMoney } from "@/lib/utils/money";
import {
  formatMonthLabel,
  toBillingId,
  toPeriodMonth,
} from "@/lib/utils/commission";
import {
  getPartnerDict,
  type PartnerLang,
} from "@/lib/partner-i18n";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import {
  ClientTablePagination,
  paginateSlice,
} from "@/components/admin/client-table-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PartnerPatient = {
  id: string;
  displayId: string;
  patientNumber?: string | null;
  fullName: string;
  preferredName: string | null;
  status: string;
  createdAt: string;
  depositAmount: number;
  depositStatus: "awaiting" | "received" | "none";
  treatments: Array<{
    id: string;
    status: string;
    diagnosis: string | null;
  }>;
};

type PartnerCommission = {
  id: string;
  patientId: string;
  amount: number;
  reviewStatus: string;
  paidAt: string | null;
  endDate: string | null;
};

type PartnerDashboardClientProps = {
  agent: {
    id: string;
    fullName: string;
    partnerId: string | null;
    companyName: string | null;
    commissionPercent: number;
  };
  patients: PartnerPatient[];
  commissions: PartnerCommission[];
};

function numericPatientId(displayId: string) {
  const digits = displayId.replace(/\D/g, "");
  return digits.slice(-5) || displayId.slice(-5);
}

function currentPeriodMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function patientSearchId(patient: PartnerPatient) {
  return (
    patient.patientNumber ?? numericPatientId(patient.displayId)
  ).toLowerCase();
}

export function PartnerDashboardClient({
  agent,
  patients,
  commissions,
}: PartnerDashboardClientProps) {
  const [lang, setLang] = useState<PartnerLang>("en");
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientPage, setPatientPage] = useState(1);
  const [patientPageSize, setPatientPageSize] = useState(20);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(20);
  const t = getPartnerDict(lang);
  const periodMonth = currentPeriodMonth();
  const monthName = formatMonthLabel(periodMonth);
  const rate = agent.commissionPercent;

  const commissionByPatient = useMemo(() => {
    const map = new Map<
      string,
      { amount: number; paid: boolean; hasRows: boolean }
    >();
    for (const c of commissions) {
      const prev = map.get(c.patientId) ?? {
        amount: 0,
        paid: true,
        hasRows: false,
      };
      prev.amount += c.amount;
      prev.hasRows = true;
      prev.paid = prev.paid && Boolean(c.paidAt);
      map.set(c.patientId, prev);
    }
    return map;
  }, [commissions]);

  const thisMonthCommissions = commissions.filter((c) => {
    if (!c.endDate) return false;
    return toPeriodMonth(new Date(c.endDate)) === periodMonth;
  });

  const thisMonthAmount = thisMonthCommissions.reduce(
    (s, c) => s + c.amount,
    0
  );
  const thisMonthCompletedTreatments = thisMonthCommissions.length;
  const thisMonthCommissionColor = (() => {
    if (thisMonthCommissions.length === 0) return "#6b7280";
    const allPaid = thisMonthCommissions.every((c) => c.reviewStatus === "PAID");
    if (allPaid) return "#10b981";
    return "#f59e0b"; // pending review / pending payment
  })();

  const monthlyRows = useMemo(() => {
    const map = new Map<
      string,
      {
        amount: number;
        patients: Set<string>;
        statuses: string[];
      }
    >();

    for (const c of commissions) {
      if (!c.endDate) continue;
      const key = toPeriodMonth(new Date(c.endDate));
      const bucket = map.get(key) ?? {
        amount: 0,
        patients: new Set<string>(),
        statuses: [],
      };
      bucket.amount += c.amount;
      bucket.patients.add(c.patientId);
      bucket.statuses.push(c.reviewStatus);
      map.set(key, bucket);
    }

    return [...map.entries()]
      .map(([key, bucket]) => {
        const hasPending = bucket.statuses.some((s) => s === "PENDING_REVIEW");
        const allPaid = bucket.statuses.every((s) => s === "PAID");
        const review = hasPending
          ? "PENDING_REVIEW"
          : allPaid
            ? "PAID"
            : "APPROVED";
        return {
          key,
          billingId: agent.partnerId
            ? toBillingId(key, agent.partnerId)
            : null,
          amount: Math.round(bucket.amount * 100) / 100,
          patientCount: bucket.patients.size,
          review,
          payment: allPaid ? "PAID" : "PENDING",
        };
      })
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [commissions, agent.partnerId]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const name = p.fullName.toLowerCase();
      const preferred = (p.preferredName ?? "").toLowerCase();
      const id = patientSearchId(p);
      const display = p.displayId.toLowerCase();
      return (
        name.includes(q) ||
        preferred.includes(q) ||
        id.includes(q) ||
        display.includes(q)
      );
    });
  }, [patients, patientSearch]);

  const pagedPatients = useMemo(
    () => paginateSlice(filteredPatients, patientPage, patientPageSize),
    [filteredPatients, patientPage, patientPageSize]
  );

  const pagedMonthlyRows = useMemo(
    () => paginateSlice(monthlyRows, historyPage, historyPageSize),
    [monthlyRows, historyPage, historyPageSize]
  );

  function renderPatientRow(patient: PartnerPatient) {
    const completedCount = patient.treatments.filter(
      (tx) => tx.status === "COMPLETED"
    ).length;
    const commission = commissionByPatient.get(patient.id);
    const amount = commission?.amount ?? 0;
    const color = !commission?.hasRows
      ? "#6b7280"
      : commission.paid
        ? "#10b981"
        : "#f59e0b";
    const depositColor =
      patient.depositStatus === "awaiting"
        ? "#ef4444"
        : patient.depositStatus === "received"
          ? "#10b981"
          : "#6b7280";
    return (
      <TableRow key={patient.id}>
        <TableCell className="font-mono text-xs">
          {patient.patientNumber ?? numericPatientId(patient.displayId)}
        </TableCell>
        <TableCell>{patient.fullName}</TableCell>
        <TableCell>{patient.status}</TableCell>
        <TableCell>
          {new Date(patient.createdAt).toLocaleDateString()}
        </TableCell>
        <TableCell
          className="font-medium"
          style={{
            color: depositColor,
            backgroundColor:
              patient.depositStatus === "awaiting"
                ? "rgba(239,68,68,0.08)"
                : patient.depositStatus === "received"
                  ? "rgba(16,185,129,0.08)"
                  : undefined,
          }}
        >
          {patient.depositStatus === "none"
            ? "—"
            : formatMoney(patient.depositAmount)}
        </TableCell>
        <TableCell>{completedCount}</TableCell>
        <TableCell style={{ color }} className="font-medium">
          {formatMoney(amount)}
        </TableCell>
      </TableRow>
    );
  }

  function renderPatientCard(patient: PartnerPatient) {
    const completedCount = patient.treatments.filter(
      (tx) => tx.status === "COMPLETED"
    ).length;
    const commission = commissionByPatient.get(patient.id);
    const amount = commission?.amount ?? 0;
    const color = !commission?.hasRows
      ? "#6b7280"
      : commission.paid
        ? "#10b981"
        : "#f59e0b";
    const depositColor =
      patient.depositStatus === "awaiting"
        ? "#ef4444"
        : patient.depositStatus === "received"
          ? "#10b981"
          : "#6b7280";
    return (
      <Card key={patient.id} className="shadow-sm">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{patient.fullName}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {patient.patientNumber ?? numericPatientId(patient.displayId)}
            </p>
          </div>
          <MobileField label={t.status}>{patient.status}</MobileField>
          <MobileField label={t.registeredAt}>
            {new Date(patient.createdAt).toLocaleDateString()}
          </MobileField>
          <MobileField label="Deposit Amount">
            <span style={{ color: depositColor }} className="font-medium">
              {patient.depositStatus === "none"
                ? "—"
                : formatMoney(patient.depositAmount)}
            </span>
          </MobileField>
          <MobileField label={t.completedTx}>{completedCount}</MobileField>
          <MobileField label={t.commissionAmount}>
            <span style={{ color }} className="font-medium">
              {formatMoney(amount)}
            </span>
          </MobileField>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="partner-luxury mx-auto w-full max-w-6xl space-y-6 px-3 py-6 sm:px-4 sm:py-8">
      <style>{`
        .partner-luxury {
          --partner-gold: #c9a227;
          --partner-champagne: #f5e6c8;
        }
        .partner-luxury .serif-name {
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
        }
      `}</style>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.2em] text-[color:var(--partner-gold)] uppercase">
            {t.brand}
          </p>
          <h1 className="serif-name mt-1 text-2xl font-semibold text-[color:var(--partner-champagne)] sm:text-3xl">
            {agent.fullName}
          </h1>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {t.partnerId}: {agent.partnerId ?? t.pendingId}
            {agent.companyName ? ` · ${agent.companyName}` : ""}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <label className="text-xs text-muted-foreground">{t.language}</label>
          <select
            className="h-10 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 text-sm sm:h-9 sm:flex-none"
            value={lang}
            onChange={(e) => setLang(e.target.value as PartnerLang)}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
          <form action={logoutPartner} className="w-full sm:w-auto">
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              {t.signOut}
            </Button>
          </form>
        </div>
      </div>

      {agent.partnerId && (
        <Card className="border-[color:var(--partner-gold)]/30">
          <CardHeader className="py-3">
            <CardTitle className="text-base text-[color:var(--partner-gold)]">
              {t.registrationLink}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CopyRegistrationLink partnerId={agent.partnerId} />
          </CardContent>
        </Card>
      )}

      <Card className="border-[color:var(--partner-gold)]/30">
        <CardHeader className="py-3">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setMarketingOpen((v) => !v)}
          >
            <div>
              <CardTitle className="text-base text-[color:var(--partner-gold)]">
                {t.marketing}
              </CardTitle>
              <CardDescription>{t.marketingHint}</CardDescription>
            </div>
            {marketingOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </CardHeader>
        {marketingOpen && (
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {[t.brochure, t.flyer, t.presentation].map((label) => (
              <div
                key={label}
                className="rounded-md border border-border/60 px-3 py-4 text-center text-sm"
              >
                <p>{label}</p>
                <Button type="button" variant="outline" size="sm" className="mt-2" disabled>
                  {t.download}
                </Button>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalReferrals}</CardDescription>
            <CardTitle className="text-3xl">{patients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {t.totalCommission} ({monthName})
            </CardDescription>
            <CardTitle
              className="text-3xl"
              style={{ color: thisMonthCommissionColor }}
            >
              {formatMoney(thisMonthAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {t.completedTreatments} ({monthName})
            </CardDescription>
            <CardTitle className="text-3xl">
              {thisMonthCompletedTreatments}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">{t.referredPatients}</CardTitle>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-medium text-foreground">Deposit Amount:</span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block size-2 rounded-full bg-red-500"
                  aria-hidden
                />
                Awaiting
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block size-2 rounded-full bg-emerald-500"
                  aria-hidden
                />
                Received
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-medium text-foreground">
                Commission Amount:
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block size-2 rounded-full bg-amber-500"
                  aria-hidden
                />
                Under Review
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block size-2 rounded-full bg-emerald-500"
                  aria-hidden
                />
                Paid
              </span>
            </span>
          </div>
          <input
            type="search"
            value={patientSearch}
            onChange={(e) => {
              setPatientSearch(e.target.value);
              setPatientPage(1);
            }}
            placeholder="Search by name or patient ID…"
            className="h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 text-sm"
          />
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveList
            table={
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.patientId}</TableHead>
                    <TableHead>{t.fullName}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.registeredAt}</TableHead>
                    <TableHead>Deposit Amount</TableHead>
                    <TableHead>{t.completedTx}</TableHead>
                    <TableHead>{t.commissionAmount}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {patients.length === 0
                          ? t.noPatients
                          : "No matching patients."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedPatients.map(renderPatientRow)
                  )}
                </TableBody>
              </Table>
            }
            cards={
              <div className="space-y-3 p-4">
                {filteredPatients.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {patients.length === 0
                      ? t.noPatients
                      : "No matching patients."}
                  </p>
                ) : (
                  pagedPatients.map(renderPatientCard)
                )}
              </div>
            }
          />
          {filteredPatients.length > 0 ? (
            <ClientTablePagination
              page={patientPage}
              pageSize={patientPageSize}
              total={filteredPatients.length}
              onPageChange={setPatientPage}
              onPageSizeChange={setPatientPageSize}
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.monthlyHistory}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveList
            table={
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.billingId}</TableHead>
                    <TableHead>{t.month}</TableHead>
                    <TableHead>{t.completedPatients}</TableHead>
                    <TableHead>{t.rate}</TableHead>
                    <TableHead>{t.amount}</TableHead>
                    <TableHead>{t.review}</TableHead>
                    <TableHead>{t.payment}</TableHead>
                    <TableHead>{t.view}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {t.noHistory}
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedMonthlyRows.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell className="font-mono text-xs">
                          {row.billingId ?? "—"}
                        </TableCell>
                        <TableCell>{formatMonthLabel(row.key)}</TableCell>
                        <TableCell>{row.patientCount}</TableCell>
                        <TableCell>{rate}%</TableCell>
                        <TableCell>{formatMoney(row.amount)}</TableCell>
                        <TableCell>
                          {row.review === "PENDING_REVIEW" ? (
                            <Badge className="bg-warning/20 text-warning-foreground">
                              {t.pendingReview}
                            </Badge>
                          ) : (
                            <Badge className="bg-success/20 text-success">
                              {t.approved}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.payment === "PAID" ? t.paid : t.pending}
                        </TableCell>
                        <TableCell>
                          {row.billingId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              render={
                                <Link
                                  href={`/partner/billing/${encodeURIComponent(row.billingId)}`}
                                />
                              }
                            >
                              {t.view}
                            </Button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            }
            cards={
              <div className="space-y-3 p-4">
                {monthlyRows.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t.noHistory}
                  </p>
                ) : (
                  pagedMonthlyRows.map((row) => (
                    <Card key={row.key} className="shadow-sm">
                      <CardContent className="space-y-2 p-4">
                        <p className="font-mono text-xs">
                          {row.billingId ?? "—"}
                        </p>
                        <MobileField label={t.month}>
                          {formatMonthLabel(row.key)}
                        </MobileField>
                        <MobileField label={t.completedPatients}>
                          {row.patientCount}
                        </MobileField>
                        <MobileField label={t.rate}>{rate}%</MobileField>
                        <MobileField label={t.amount}>
                          {formatMoney(row.amount)}
                        </MobileField>
                        <MobileField label={t.review}>
                          {row.review === "PENDING_REVIEW" ? (
                            <Badge className="bg-warning/20 text-warning-foreground">
                              {t.pendingReview}
                            </Badge>
                          ) : (
                            <Badge className="bg-success/20 text-success">
                              {t.approved}
                            </Badge>
                          )}
                        </MobileField>
                        <MobileField label={t.payment}>
                          {row.payment === "PAID" ? t.paid : t.pending}
                        </MobileField>
                        {row.billingId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            render={
                              <Link
                                href={`/partner/billing/${encodeURIComponent(row.billingId)}`}
                              />
                            }
                          >
                            {t.view}
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            }
          />
          {monthlyRows.length > 0 ? (
            <ClientTablePagination
              page={historyPage}
              pageSize={historyPageSize}
              total={monthlyRows.length}
              onPageChange={setHistoryPage}
              onPageSizeChange={setHistoryPageSize}
            />
          ) : null}
        </CardContent>
      </Card>

      <footer className="mt-10 border-t border-border/60 pt-8 pb-4 text-center">
        <div className="relative mx-auto mb-3 h-8 w-[100px]">
          <Image
            src="/images/main_logo.svg"
            alt="Revivora"
            fill
            className="object-contain"
          />
        </div>
        <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
          An online medical platform connecting patients with trusted care in
          Taipei
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Contact:{" "}
          <a
            href="mailto:uroadrian.tw@gmail.com"
            className="underline decoration-transparent underline-offset-2 hover:decoration-current"
          >
            uroadrian.tw@gmail.com
          </a>
        </p>
      </footer>
    </div>
  );
}
