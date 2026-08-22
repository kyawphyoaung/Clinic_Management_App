import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { formatMoney } from "@/lib/utils/money";

type TreatmentSummaryCardProps = {
  totalCharges: number;
  totalPaid: number;
  balance: number;
  depositBalance?: number;
};

export function TreatmentSummaryCard({
  totalCharges,
  totalPaid,
  balance,
  depositBalance = 0,
}: TreatmentSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-0 pb-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Total Invoices</p>
          <p className="text-lg font-semibold">{formatMoney(totalCharges)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Paid</p>
          <p className="text-lg font-semibold text-success">
            {formatMoney(totalPaid)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Remaining Balance</p>
          <p
            className={`text-lg font-semibold ${
              balance > 0
                ? "text-[#ef4444]"
                : balance < 0
                  ? "text-[#8b5cf6]"
                  : "text-[#10b981]"
            }`}
          >
            {formatMoney(balance)}
          </p>
          {balance < 0 && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#8b5cf6]">
              <AlertTriangle className="size-3.5" />
              Something Wrong
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Deposit Balance</p>
          <p className="text-lg font-semibold text-amber-700 dark:text-amber-400">
            {formatMoney(depositBalance)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
