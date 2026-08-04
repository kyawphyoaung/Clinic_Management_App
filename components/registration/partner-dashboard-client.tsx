"use client";

import { useMemo, useState } from "react";
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
  fullName: string;
  preferredName: string | null;
  status: string;
  createdAt: string;
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

export function PartnerDashboardClient({
  agent,
  patients,
  commissions,
}: PartnerDashboardClientProps) {
  const [lang, setLang] = useState<PartnerLang>("en");
  const [marketingOpen, setMarketingOpen] = useState(false);
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
            <CardTitle className="text-3xl text-success">
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
        <CardHeader>
          <CardTitle className="text-base">{t.referredPatients}</CardTitle>
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
                    <TableHead>{t.completedTx}</TableHead>
                    <TableHead>{t.commissionAmount}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {t.noPatients}
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((patient) => {
                      const completed = patient.treatments
                        .filter((tx) => tx.status === "COMPLETED")
                        .map((tx) => tx.diagnosis?.trim())
                        .filter((d): d is string => Boolean(d));
                      const commission = commissionByPatient.get(patient.id);
                      const amount = commission?.amount ?? 0;
                      const color = !commission?.hasRows
                        ? "#6b7280"
                        : commission.paid
                          ? "#10b981"
                          : "#f59e0b";
                      return (
                        <TableRow key={patient.id}>
                          <TableCell className="font-mono text-xs">
                            {numericPatientId(patient.displayId)}
                          </TableCell>
                          <TableCell>{patient.fullName}</TableCell>
                          <TableCell>{patient.status}</TableCell>
                          <TableCell>
                            {new Date(patient.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {completed.length > 0 ? completed.join(", ") : "—"}
                          </TableCell>
                          <TableCell style={{ color }} className="font-medium">
                            {formatMoney(amount)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            }
            cards={
              <div className="space-y-3 p-4">
                {patients.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t.noPatients}
                  </p>
                ) : (
                  patients.map((patient) => {
                    const completed = patient.treatments
                      .filter((tx) => tx.status === "COMPLETED")
                      .map((tx) => tx.diagnosis?.trim())
                      .filter((d): d is string => Boolean(d));
                    const commission = commissionByPatient.get(patient.id);
                    const amount = commission?.amount ?? 0;
                    const color = !commission?.hasRows
                      ? "#6b7280"
                      : commission.paid
                        ? "#10b981"
                        : "#f59e0b";
                    return (
                      <Card key={patient.id} className="shadow-sm">
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium">{patient.fullName}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {numericPatientId(patient.displayId)}
                            </p>
                          </div>
                          <MobileField label={t.status}>
                            {patient.status}
                          </MobileField>
                          <MobileField label={t.registeredAt}>
                            {new Date(patient.createdAt).toLocaleDateString()}
                          </MobileField>
                          <MobileField label={t.completedTx}>
                            {completed.length > 0 ? completed.join(", ") : "—"}
                          </MobileField>
                          <MobileField label={t.commissionAmount}>
                            <span style={{ color }} className="font-medium">
                              {formatMoney(amount)}
                            </span>
                          </MobileField>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            }
          />
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
                    monthlyRows.map((row) => (
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
                  monthlyRows.map((row) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
