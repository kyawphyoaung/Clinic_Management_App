"use client";

import { useState, useTransition } from "react";
import {
  createDepositReceiver,
  deleteDepositReceiver,
  recordDepositTransfer,
} from "@/lib/actions/deposit-receivers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/utils/money";

type Receiver = {
  id: string;
  name: string;
  description: string | null;
  contactInfo: string | null;
  held: number;
  transferred: number;
  currentBalance: number;
};

export function DepositReceiversClient({ receivers }: { receivers: Receiver[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createDepositReceiver({
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? "") || null,
        contactInfo: String(form.get("contactInfo") ?? "") || null,
      });
      if (!result.success) setError(result.error);
      else (e.target as HTMLFormElement).reset();
    });
  }

  function handleTransfer(receiverId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await recordDepositTransfer({
        receiverId,
        amountTwd: Number(form.get("amount") ?? 0),
        transferredAt: String(form.get("date") ?? ""),
        notes: String(form.get("notes") ?? "") || null,
      });
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Deposit Receiver</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleCreate}>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactInfo">Contact</Label>
              <Input id="contactInfo" name="contactInfo" />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={isPending}>
                Create
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Held</TableHead>
                <TableHead>Transferred</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Transfer to clinic</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No receivers yet
                  </TableCell>
                </TableRow>
              ) : (
                receivers.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    </TableCell>
                    <TableCell>{formatMoney(r.held)}</TableCell>
                    <TableCell>{formatMoney(r.transferred)}</TableCell>
                    <TableCell>{formatMoney(r.currentBalance)}</TableCell>
                    <TableCell>
                      <form
                        className="flex flex-wrap items-end gap-2"
                        onSubmit={(e) => handleTransfer(r.id, e)}
                      >
                        <Input name="amount" type="number" step="0.01" min="0" className="w-28" required />
                        <Input name="date" type="date" className="w-36" required />
                        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                          Transfer
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!window.confirm("Delete this receiver?")) return;
                          startTransition(async () => {
                            await deleteDepositReceiver(r.id);
                          });
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
