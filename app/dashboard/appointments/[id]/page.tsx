import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppointmentById, listDoctorsForBooking } from "@/lib/actions/appointments";
import { AppointmentActions } from "@/components/admin/appointment-actions";
import { CopyRescheduleLink } from "@/components/admin/copy-reschedule-link";
import { StaffReschedulePanel } from "@/components/admin/staff-reschedule-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatStableTaiwanDateTime } from "@/lib/book-i18n";
import { toPatientFacingId } from "@/lib/utils/patient-id";
import { relativeTaiwanAppointmentLabel } from "@/lib/utils/relative-taiwan-date";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  void id;
  return { title: `Appointment` };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-2 text-sm last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

export default async function AppointmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [apt, doctors] = await Promise.all([
    getAppointmentById(id),
    listDoctorsForBooking(),
  ]);
  if (!apt) notFound();

  const relative = relativeTaiwanAppointmentLabel(apt.startsAt);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/appointments"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          ← Appointments
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight font-mono">
          {apt.publicId}
        </h1>
        <p className="text-sm text-muted-foreground">Status: {apt.status}</p>
        {apt.patient && (
          <div className="mt-4">
            <p className="text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-400">
              {apt.patient.fullName}
            </p>
            <p className="mt-1 text-base font-medium text-amber-700 dark:text-amber-400">
              {relative}
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="Public ID">{apt.publicId}</Row>
          <Row label="Patient">
            {apt.patient ? (
              <Link
                href={`/dashboard/patients/${apt.patient.id}`}
                className="underline-offset-2 hover:underline"
              >
                {apt.patient.fullName}
              </Link>
            ) : (
              "—"
            )}
          </Row>
          {apt.patient && (
            <>
              <Row label="Patient ID">
                <span className="font-mono">
                  {toPatientFacingId(apt.patient.displayId)}
                </span>
              </Row>
              <Row label="Internal display ID">
                <span className="font-mono text-xs">{apt.patient.displayId}</span>
              </Row>
              <Row label="Agent">
                {apt.patient.currentAgent?.fullName ?? "—"}
              </Row>
            </>
          )}
          <Row label="Doctor">{apt.doctor.fullName}</Row>
          <Row label="Service">{apt.service}</Row>
          <Row label="Starts">
            <span suppressHydrationWarning>
              {formatStableTaiwanDateTime(apt.startsAt.toISOString())} (Taiwan)
            </span>
          </Row>
          <Row label="Ends">
            <span suppressHydrationWarning>
              {formatStableTaiwanDateTime(apt.endsAt.toISOString())} (Taiwan)
            </span>
          </Row>
          {apt.notes && <Row label="Notes">{apt.notes}</Row>}
          {apt.preferredLanguage && (
            <Row label="Language">{apt.preferredLanguage}</Row>
          )}
          {apt.rescheduleToken && (
            <div className="space-y-2 pt-3">
              <p className="text-sm text-muted-foreground">Reschedule link</p>
              <CopyRescheduleLink token={apt.rescheduleToken} />
            </div>
          )}
        </CardContent>
      </Card>

      <AppointmentActions
        appointmentId={apt.id}
        status={apt.status}
        rescheduleToken={apt.rescheduleToken}
      />

      {apt.status !== "CANCELLED" && apt.status !== "NO_SHOW" && (
        <StaffReschedulePanel
          appointmentId={apt.id}
          initialDoctorId={apt.doctorId}
          doctors={doctors.map((d) => ({ id: d.id, fullName: d.fullName }))}
        />
      )}
    </div>
  );
}
