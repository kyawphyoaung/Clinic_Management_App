"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ConsentLog } from "@/prisma/generated/prisma/browser";
import { agreementDisplayTitle } from "@/lib/utils/agreement-files";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type PatientConsentsProps = {
  consentLogs: ConsentLog[];
};

function ConsentDetailModal({
  log,
  onClose,
}: {
  log: ConsentLog;
  onClose: () => void;
}) {
  const isPaper = log.source === "PAPER";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <h3 className="font-serif text-lg text-amber-100/90">
          {agreementDisplayTitle(log.documentType)} ({log.version})
        </h3>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Source</span>
            <span>{log.source}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Agreed At</span>
            <span>{log.consentedAt.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recorded At</span>
            <span>{log.recordedAt.toLocaleString()}</span>
          </div>

          {isPaper ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Physical Location</span>
                <span>{log.physicalLocation ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staff Declaration</span>
                <span>{log.staffDeclaration ? "Confirmed" : "—"}</span>
              </div>
              {log.signatureImageUrl && (
                <div className="space-y-2">
                  <p className="text-muted-foreground">Signature</p>
                  <p className="text-xs break-all">{log.signatureImageUrl}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP Address</span>
                <span>{log.ipAddress ?? "—"}</span>
              </div>
              <div>
                <p className="text-muted-foreground">User Agent</p>
                <p className="mt-1 break-all text-xs">
                  {log.userAgent ?? "—"}
                </p>
              </div>
              <p className="rounded-md border border-border bg-muted/30 p-3 text-muted-foreground">
                This consent was recorded automatically when the patient agreed
                during digital registration.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PatientConsents({ consentLogs }: PatientConsentsProps) {
  const [selected, setSelected] = useState<ConsentLog | null>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Consents</CardTitle>
            <CardDescription>
              {consentLogs.length} agreement record
              {consentLogs.length !== 1 ? "s" : ""} linked to this patient
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide" : "View"}
          </Button>
        </CardHeader>
        {expanded && (
          <CardContent className="p-0">
            <ResponsiveList
              table={
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Agreed</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consentLogs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-muted-foreground"
                        >
                          No consent records
                        </TableCell>
                      </TableRow>
                    ) : (
                      consentLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {agreementDisplayTitle(log.documentType)}
                          </TableCell>
                          <TableCell>{log.version}</TableCell>
                          <TableCell>
                            {log.consentedAt.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{log.source}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelected(log)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              }
              cards={
                <div className="space-y-3 p-4">
                  {consentLogs.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No consent records
                    </p>
                  ) : (
                    consentLogs.map((log) => (
                      <Card key={log.id} className="shadow-sm">
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium">
                              {agreementDisplayTitle(log.documentType)}
                            </p>
                            <Badge variant="secondary">{log.source}</Badge>
                          </div>
                          <MobileField label="Version">{log.version}</MobileField>
                          <MobileField label="Agreed">
                            {log.consentedAt.toLocaleString()}
                          </MobileField>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setSelected(log)}
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              }
            />
          </CardContent>
        )}
      </Card>

      {selected && (
        <ConsentDetailModal log={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
