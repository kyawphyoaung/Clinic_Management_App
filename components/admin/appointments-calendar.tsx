"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";
import { AppointmentCreateModal } from "@/components/admin/appointment-create-modal";
import { toTaiwanDateString, toTaiwanMinutes } from "@/lib/utils/taiwan-time";
import type { CalendarEvent } from "@/lib/utils/appointment-calendar";

export type { CalendarEvent };

type Doctor = { id: string; fullName: string };
type Patient = { id: string; fullName: string; displayId: string };

type Props = {
  initialEvents: CalendarEvent[];
  doctors: Doctor[];
  patients: Patient[];
};

export function AppointmentsCalendar({
  initialEvents,
  doctors,
  patients,
}: Props) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [prefillMinutes, setPrefillMinutes] = useState<number | undefined>();

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const filteredEvents = useMemo(() => {
    if (doctorFilter === "all") return events;
    return events.filter((e) => e.doctorId === doctorFilter);
  }, [events, doctorFilter]);

  function handleSelect(selectInfo: DateSelectArg) {
    // FullCalendar with timeZone=Asia/Taipei gives Date objects that represent
    // the correct instant; wall-clock must be read in Taiwan, not browser local.
    const date = toTaiwanDateString(selectInfo.start);
    const minutes = toTaiwanMinutes(selectInfo.start);
    setPrefillDate(date);
    setPrefillMinutes(
      Number.isFinite(minutes) ? Math.floor(minutes / 30) * 30 : undefined
    );
    setModalOpen(true);
    selectInfo.view.calendar.unselect();
  }

  function handleEventClick(info: EventClickArg) {
    info.jsEvent.preventDefault();
    router.push(`/dashboard/appointments/${info.event.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {/* Future: Google Calendar busy-filter toggle (GOOGLE_CALENDAR_FILTER_PLACEHOLDER) */}
          <button
            type="button"
            onClick={() => setDoctorFilter("all")}
            className={`rounded-full border px-3 py-1 text-sm ${
              doctorFilter === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            All doctors
          </button>
          {doctors.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDoctorFilter(d.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                doctorFilter === d.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {d.fullName}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => {
            setPrefillDate(toTaiwanDateString(new Date()));
            setPrefillMinutes(undefined);
            setModalOpen(true);
          }}
        >
          New Appointment
        </button>
      </div>

      <div className="appointments-calendar min-w-0 overflow-x-hidden rounded-lg border border-border bg-card p-2 sm:p-3 [&_.fc]:text-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          buttonText={{
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
            list: "Agenda",
          }}
          height="auto"
          selectable
          selectMirror
          nowIndicator
          timeZone="Asia/Taipei"
          slotDuration="00:30:00"
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          dayHeaderFormat={{ weekday: "short", day: "numeric", omitCommas: true }}
          events={filteredEvents}
          select={handleSelect}
          eventClick={handleEventClick}
        />
      </div>

      {modalOpen && (
        <AppointmentCreateModal
          doctors={doctors}
          patients={patients}
          defaultDate={prefillDate}
          defaultSlotMinutes={prefillMinutes}
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
