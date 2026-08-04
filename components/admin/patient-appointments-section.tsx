"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { AppointmentCreateModal } from "@/components/admin/appointment-create-modal";
import {
  formatTaiwanTime,
  toTaiwanDateString,
} from "@/lib/utils/taiwan-time";

type AppointmentRow = {
  id: string;
  publicId: string;
  startsAt: string;
  status: string;
  doctor: { fullName: string };
};

type Doctor = { id: string; fullName: string };
type Patient = { id: string; fullName: string; displayId: string };

type Props = {
  appointments: AppointmentRow[];
  patient: Patient;
  doctors: Doctor[];
  canWrite: boolean;
};

export function PatientAppointmentsSection({
  appointments,
  patient,
  doctors,
  canWrite,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const now = Date.now();

  const sorted = [...appointments].sort((a, b) => {
    const aUp =
      new Date(a.startsAt).getTime() >= now &&
      a.status !== "CANCELLED" &&
      a.status !== "NO_SHOW";
    const bUp =
      new Date(b.startsAt).getTime() >= now &&
      b.status !== "CANCELLED" &&
      b.status !== "NO_SHOW";
    if (aUp !== bUp) return aUp ? -1 : 1;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });

  function rowClass(a: AppointmentRow) {
    const starts = new Date(a.startsAt);
    const isUpcoming =
      starts.getTime() >= now &&
      a.status !== "CANCELLED" &&
      a.status !== "NO_SHOW";
    return isUpcoming ? "bg-emerald-50/50 dark:bg-emerald-950/20" : undefined;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Appointments</h2>
        {canWrite && (
          <Button
            type="button"
            size="sm"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
            onClick={() => setModalOpen(true)}
          >
            <CalendarPlus className="size-4" />
            Make New Appointment
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="p-0">
          <ResponsiveList
            table={
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No appointments
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((a) => {
                      const starts = new Date(a.startsAt);
                      return (
                        <TableRow key={a.id} className={rowClass(a)}>
                          <TableCell suppressHydrationWarning>
                            {toTaiwanDateString(starts)}
                          </TableCell>
                          <TableCell suppressHydrationWarning>
                            {formatTaiwanTime(starts)}
                          </TableCell>
                          <TableCell>{a.doctor.fullName}</TableCell>
                          <TableCell>{a.status}</TableCell>
                          <TableCell>
                            <Link
                              href={`/dashboard/appointments/${a.id}`}
                              className="font-mono text-xs underline-offset-2 hover:underline"
                            >
                              {a.publicId}
                            </Link>
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
                {sorted.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No appointments
                  </p>
                ) : (
                  sorted.map((a) => {
                    const starts = new Date(a.startsAt);
                    return (
                      <Card
                        key={a.id}
                        className={`shadow-sm ${rowClass(a) ?? ""}`}
                      >
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-mono text-xs">{a.publicId}</p>
                            <span className="text-xs font-medium">{a.status}</span>
                          </div>
                          <MobileField label="Date">
                            <span suppressHydrationWarning>
                              {toTaiwanDateString(starts)}
                            </span>
                          </MobileField>
                          <MobileField label="Time">
                            <span suppressHydrationWarning>
                              {formatTaiwanTime(starts)}
                            </span>
                          </MobileField>
                          <MobileField label="Doctor">
                            {a.doctor.fullName}
                          </MobileField>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            render={
                              <Link href={`/dashboard/appointments/${a.id}`} />
                            }
                          >
                            View
                          </Button>
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

      {modalOpen && (
        <AppointmentCreateModal
          doctors={doctors}
          patients={[patient]}
          lockPatientId={patient.id}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
