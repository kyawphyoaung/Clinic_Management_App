import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDashboardData } from "@/lib/actions/dashboard";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { formatMoney } from "@/lib/utils/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

function MomBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <p className="text-xs text-muted-foreground">No prior month data</p>
    );
  }
  const positive = value >= 0;
  const label = `${positive ? "+" : ""}${value.toFixed(1)}% from last month`;
  return (
    <p
      className={`text-xs font-medium ${
        positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      {label}
    </p>
  );
}

const CARD_TONES = [
  "border-teal-500/30 bg-teal-500/10",
  "border-sky-500/30 bg-sky-500/10",
  "border-amber-500/30 bg-amber-500/10",
  "border-emerald-500/30 bg-emerald-500/10",
  "border-violet-500/30 bg-violet-500/10",
] as const;

export default async function DashboardPage() {
  const data = await getDashboardData();
  const activities = data.activities.slice(0, 2);

  const cards: {
    title: string;
    value: string;
    subtitle: ReactNode;
  }[] = [
    {
      title: "Total Patients",
      value: data.totalPatients.toLocaleString(),
      subtitle: null,
    },
    {
      title: "Total Referrals",
      value: data.totalReferrals.toLocaleString(),
      subtitle: <p className="text-xs text-muted-foreground">Agent source</p>,
    },
    {
      title: "Today's Appointments",
      value: data.todayAppointments.toLocaleString(),
      subtitle: (
        <p className="text-xs text-muted-foreground">
          {data.appointmentsSubtitle}
        </p>
      ),
    },
    {
      title: "Revenue this month",
      value: formatMoney(data.revenueThisMonth),
      subtitle: <MomBadge value={data.revenueMomPercent} />,
    },
    {
      title: "Commission this month",
      value: formatMoney(data.commissionThisMonth),
      subtitle: <MomBadge value={data.commissionMomPercent} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Clinic overview for today (Taiwan time)
        </p>
      </div>

      {/* Row 1: summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, idx) => (
          <Card key={card.title} className={cn(CARD_TONES[idx % CARD_TONES.length])}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">
                {card.value}
              </p>
              {card.subtitle}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: charts full width */}
      <DashboardCharts
        patientGrowth={data.patientGrowth}
        revenueSeries={data.revenueSeries}
      />

      {/* Row 3: recent activities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent activities</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => (
                <li
                  key={a.id}
                  className="border-b border-border pb-3 text-sm last:border-0 last:pb-0"
                >
                  {a.text}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
