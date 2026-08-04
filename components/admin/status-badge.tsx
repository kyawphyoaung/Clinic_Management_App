import {
  Ban,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  FileText,
  MapPin,
  Plane,
  RefreshCcw,
  Send,
  Stethoscope,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PatientStatus } from "@/prisma/generated/prisma/enums";

const statusVariant: Record<
  PatientStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  INQUIRY: "secondary",
  QUOTATION_SENT: "outline",
  BOOKING_DEPOSIT_RECEIVED: "outline",
  TELEMEDICINE_SCHEDULED: "outline",
  APPOINTMENT_CONFIRMED: "outline",
  TRAVELING: "default",
  PATIENT_ARRIVED: "default",
  TREATMENT: "default",
  COMPLETED: "default",
  RESCHEDULED_FOR_FOLLOW_UP: "secondary",
  TREATMENT_CANCELLED: "destructive",
  REFUNDED: "destructive",
};

const statusClass: Record<PatientStatus, string> = {
  INQUIRY: "",
  QUOTATION_SENT: "",
  BOOKING_DEPOSIT_RECEIVED: "",
  TELEMEDICINE_SCHEDULED: "",
  APPOINTMENT_CONFIRMED: "",
  TRAVELING: "bg-blue-500/15 text-blue-400 border-transparent",
  PATIENT_ARRIVED: "bg-blue-500/15 text-blue-400 border-transparent",
  TREATMENT: "bg-blue-500/15 text-blue-400 border-transparent",
  COMPLETED: "bg-green-500/15 text-green-400 border-transparent",
  RESCHEDULED_FOR_FOLLOW_UP: "",
  TREATMENT_CANCELLED: "",
  REFUNDED: "",
};

const statusIcon: Record<PatientStatus, typeof CircleDot> = {
  INQUIRY: CircleDot,
  QUOTATION_SENT: Send,
  BOOKING_DEPOSIT_RECEIVED: Wallet,
  TELEMEDICINE_SCHEDULED: CalendarClock,
  APPOINTMENT_CONFIRMED: CheckCircle2,
  TRAVELING: Plane,
  PATIENT_ARRIVED: MapPin,
  TREATMENT: Stethoscope,
  COMPLETED: CheckCircle2,
  RESCHEDULED_FOR_FOLLOW_UP: RefreshCcw,
  TREATMENT_CANCELLED: Ban,
  REFUNDED: FileText,
};

export function StatusBadge({
  status,
  label,
}: {
  status: PatientStatus;
  label: string;
}) {
  const Icon = statusIcon[status];
  return (
    <Badge
      variant={statusVariant[status]}
      className={`inline-flex items-center gap-1 ${statusClass[status]}`}
    >
      <Icon className="size-3.5" />
      {label}
    </Badge>
  );
}

export function getPatientStatusLabel(status: PatientStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
