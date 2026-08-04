import type { Metadata } from "next";
import {
  getWeeklyAvailability,
  getOverridesForMonth,
  listDoctorsForAvailability,
} from "@/lib/actions/availability";
import {
  listSpecializations,
  listClinicServicesAdmin,
} from "@/lib/actions/catalog";
import { AvailabilityManager } from "@/components/admin/availability-manager";
import { toTaiwanDateString } from "@/lib/utils/taiwan-time";
import { requireAuth } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Availability",
};

type PageProps = {
  searchParams: Promise<{ doctorId?: string; month?: string }>;
};

export default async function AvailabilityPage({ searchParams }: PageProps) {
  const session = await requireAuth();
  const params = await searchParams;
  const doctors = await listDoctorsForAvailability();
  const doctorId = params.doctorId ?? doctors[0]?.id ?? "";
  const month = params.month ?? toTaiwanDateString(new Date()).slice(0, 7);

  const [weekly, overrides, specializations, services] = await Promise.all([
    doctorId ? getWeeklyAvailability(doctorId) : Promise.resolve([]),
    doctorId ? getOverridesForMonth(doctorId, month) : Promise.resolve([]),
    listSpecializations(),
    listClinicServicesAdmin(),
  ]);

  const canManageCatalog =
    hasPermission(session.user.role, "catalog:manage") ||
    hasPermission(session.user.role, "*");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Availability & Catalog
        </h1>
        <p className="text-sm text-muted-foreground">
          Weekly schedule, overrides, specializations, and services (Asia/Taipei)
        </p>
      </div>
      {doctors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No doctors found.</p>
      ) : (
        <AvailabilityManager
          doctors={doctors}
          initialDoctorId={doctorId}
          yearMonth={month}
          weekly={weekly.map((w) => ({
            id: w.id,
            dayOfWeek: w.dayOfWeek,
            startTime: w.startTime,
            endTime: w.endTime,
            isActive: w.isActive,
          }))}
          overrides={overrides.map((o) => ({
            id: o.id,
            date: o.date.toISOString().slice(0, 10),
            isBlocked: o.isBlocked,
            startTime: o.startTime,
            endTime: o.endTime,
            reason: o.reason,
          }))}
          specializations={specializations.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            isActive: s.isActive,
            doctorIds: s.doctors.map((d) => d.doctorId),
          }))}
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            isActive: s.isActive,
            sortOrder: s.sortOrder,
          }))}
          canManageCatalog={canManageCatalog}
        />
      )}
    </div>
  );
}
