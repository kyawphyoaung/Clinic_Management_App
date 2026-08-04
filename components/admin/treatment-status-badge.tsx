import { Calendar, Check, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TreatmentStatus } from "@/prisma/generated/prisma/enums";
import { cn } from "@/lib/utils";

const TREATMENT_STATUS_META: Record<
  TreatmentStatus,
  { label: string; className: string; Icon: typeof Check }
> = {
  ONGOING: {
    label: "Ongoing",
    className: "bg-blue-500/15 text-blue-400 border-transparent",
    Icon: RefreshCw,
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-500/15 text-green-400 border-transparent",
    Icon: Check,
  },
  FOLLOW_UP_SCHEDULED: {
    label: "Follow-Up Scheduled",
    className: "bg-amber-500/15 text-amber-400 border-transparent",
    Icon: Calendar,
  },
};

export function getTreatmentStatusLabel(status: TreatmentStatus): string {
  return TREATMENT_STATUS_META[status]?.label ?? status;
}

export function TreatmentStatusBadge({
  status,
  className,
}: {
  status: TreatmentStatus;
  className?: string;
}) {
  const meta = TREATMENT_STATUS_META[status];
  const Icon = meta.Icon;
  return (
    <Badge
      variant="secondary"
      className={cn("inline-flex items-center gap-1", meta.className, className)}
    >
      <Icon className={cn("size-3.5", status === "ONGOING" && "animate-spin")} />
      {meta.label}
    </Badge>
  );
}
