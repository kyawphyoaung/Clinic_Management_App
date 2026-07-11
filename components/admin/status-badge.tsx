import { Badge } from "@/components/ui/badge";
import type { PatientStatus } from "@/prisma/generated/prisma/client";

const statusVariant: Record<
  PatientStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "secondary",
  APPOINTED: "outline",
  TREATING: "default",
  COMPLETED: "default",
};

const statusClass: Record<PatientStatus, string> = {
  PENDING: "",
  APPOINTED: "",
  TREATING: "bg-blue-500/15 text-blue-400 border-transparent",
  COMPLETED: "bg-green-500/15 text-green-400 border-transparent",
};

export function StatusBadge({
  status,
  label,
}: {
  status: PatientStatus;
  label: string;
}) {
  return (
    <Badge variant={statusVariant[status]} className={statusClass[status]}>
      {label}
    </Badge>
  );
}
