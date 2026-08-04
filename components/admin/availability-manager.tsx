"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  upsertWeeklyAvailability,
  upsertOverride,
  deleteOverride,
  copyMonthOverrides,
} from "@/lib/actions/availability";
import {
  upsertSpecialization,
  deleteSpecialization,
  upsertClinicService,
  deleteClinicService,
} from "@/lib/actions/catalog";
import { minutesToTimeLabel } from "@/lib/utils/taiwan-time";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Card, CardContent } from "@/components/ui/card";

type Doctor = { id: string; fullName: string; username: string };
type WeeklyRow = {
  id: string;
  dayOfWeek: number;
  startTime: number;
  endTime: number;
  isActive: boolean;
};
type OverrideRow = {
  id: string;
  date: string;
  isBlocked: boolean;
  startTime: number | null;
  endTime: number | null;
  reason: string | null;
};
type SpecRow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  doctorIds: string[];
};
type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type Tab = "schedule" | "specializations" | "services";

type Props = {
  doctors: Doctor[];
  initialDoctorId: string;
  weekly: WeeklyRow[];
  overrides: OverrideRow[];
  yearMonth: string;
  specializations: SpecRow[];
  services: ServiceRow[];
  canManageCatalog: boolean;
};

type WindowDraft = {
  dayOfWeek: number;
  startTime: number;
  endTime: number;
  isActive: boolean;
};

export function AvailabilityManager({
  doctors,
  initialDoctorId,
  weekly,
  overrides,
  yearMonth,
  specializations,
  services,
  canManageCatalog,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("schedule");
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [windows, setWindows] = useState<WindowDraft[]>(
    weekly.map((w) => ({
      dayOfWeek: w.dayOfWeek,
      startTime: w.startTime,
      endTime: w.endTime,
      isActive: w.isActive,
    }))
  );
  const [scheduleEditing, setScheduleEditing] = useState(false);
  const [month, setMonth] = useState(yearMonth);
  const [overrideDate, setOverrideDate] = useState("");
  const [isBlocked, setIsBlocked] = useState(true);
  const [ovStart, setOvStart] = useState("09:00");
  const [ovEnd, setOvEnd] = useState("17:00");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [specName, setSpecName] = useState("");
  const [specDesc, setSpecDesc] = useState("");
  const [specDoctors, setSpecDoctors] = useState<string[]>([]);
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);

  const [svcName, setSvcName] = useState("");
  const [svcDesc, setSvcDesc] = useState("");
  const [svcSort, setSvcSort] = useState("0");
  const [editingSvcId, setEditingSvcId] = useState<string | null>(null);

  useEffect(() => {
    setWindows(
      weekly.map((w) => ({
        dayOfWeek: w.dayOfWeek,
        startTime: w.startTime,
        endTime: w.endTime,
        isActive: w.isActive,
      }))
    );
    setScheduleEditing(false);
  }, [weekly]);

  useEffect(() => {
    setDoctorId(initialDoctorId);
    setMonth(yearMonth);
  }, [initialDoctorId, yearMonth]);

  const sortedWindows = useMemo(
    () =>
      [...windows].sort(
        (a, b) =>
          a.dayOfWeek - b.dayOfWeek || a.startTime - b.startTime || a.endTime - b.endTime
      ),
    [windows]
  );

  function navigate(nextDoctor: string, nextMonth: string) {
    router.push(
      `/dashboard/availability?doctorId=${encodeURIComponent(nextDoctor)}&month=${encodeURIComponent(nextMonth)}`
    );
  }

  function refresh() {
    router.refresh();
  }

  function parseHm(value: string): number {
    const [h, m] = value.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  function clientOverlapError(
    list: WindowDraft[]
  ): string | null {
    const byDay = new Map<number, { startTime: number; endTime: number }[]>();
    for (const w of list) {
      if (!w.isActive) continue;
      if (w.endTime <= w.startTime) {
        return "Each window must end after it starts";
      }
      const dayList = byDay.get(w.dayOfWeek) ?? [];
      dayList.push({ startTime: w.startTime, endTime: w.endTime });
      byDay.set(w.dayOfWeek, dayList);
    }
    for (const [, dayList] of byDay) {
      const sorted = [...dayList].sort((a, b) => a.startTime - b.startTime);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i]!.startTime < sorted[i - 1]!.endTime) {
          return "Overlapping windows on the same day are not allowed";
        }
      }
    }
    return null;
  }

  function saveWeekly() {
    setMessage(null);
    const overlap = clientOverlapError(windows);
    if (overlap) {
      setMessage(overlap);
      return;
    }
    startTransition(async () => {
      const result = await upsertWeeklyAvailability({ doctorId, windows });
      setMessage(result.success ? "Weekly schedule saved" : result.error);
      if (result.success) {
        setScheduleEditing(false);
        refresh();
      }
    });
  }

  function addScheduleRow() {
    setWindows((prev) => [
      ...prev,
      { dayOfWeek: 1, startTime: 9 * 60, endTime: 9 * 60 + 30, isActive: true },
    ]);
  }

  function updateWindow(index: number, patch: Partial<WindowDraft>) {
    setWindows((prev) =>
      prev.map((w, i) => (i === index ? { ...w, ...patch } : w))
    );
  }

  function removeWindow(index: number) {
    setWindows((prev) => prev.filter((_, i) => i !== index));
  }

  function saveOverride() {
    if (!overrideDate) return;
    setMessage(null);
    startTransition(async () => {
      const result = await upsertOverride({
        doctorId,
        date: overrideDate,
        isBlocked,
        startTime: isBlocked ? null : parseHm(ovStart),
        endTime: isBlocked ? null : parseHm(ovEnd),
        reason: reason || null,
      });
      setMessage(result.success ? "Override saved" : result.error);
      if (result.success) {
        setOverrideDate("");
        setReason("");
        refresh();
      }
    });
  }

  function resetSpecForm() {
    setEditingSpecId(null);
    setSpecName("");
    setSpecDesc("");
    setSpecDoctors([]);
  }

  function resetSvcForm() {
    setEditingSvcId(null);
    setSvcName("");
    setSvcDesc("");
    setSvcSort("0");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "schedule", label: "Schedule" },
    { id: "specializations", label: "Specializations" },
    { id: "services", label: "Services" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "schedule" && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Doctor</Label>
              <select
                className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={doctorId}
                onChange={(e) => {
                  setDoctorId(e.target.value);
                  navigate(e.target.value, month);
                }}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">Weekly schedule</h2>
                <p className="text-sm text-muted-foreground">
                  Fixed 30-minute slots from each window (Taiwan time).
                </p>
              </div>
              <div className="flex gap-2">
                {!scheduleEditing ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setScheduleEditing(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        setWindows(
                          weekly.map((w) => ({
                            dayOfWeek: w.dayOfWeek,
                            startTime: w.startTime,
                            endTime: w.endTime,
                            isActive: w.isActive,
                          }))
                        );
                        setScheduleEditing(false);
                        setMessage(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={saveWeekly}
                      disabled={isPending}
                    >
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>

            <ResponsiveList
              className="rounded-md border border-border"
              table={
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Day</th>
                      <th className="px-3 py-2 font-medium">Start</th>
                      <th className="px-3 py-2 font-medium">End</th>
                      {scheduleEditing && (
                        <th className="px-3 py-2 font-medium">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(scheduleEditing ? windows : sortedWindows).length === 0 ? (
                      <tr>
                        <td
                          colSpan={scheduleEditing ? 4 : 3}
                          className="px-3 py-6 text-muted-foreground"
                        >
                          No windows — click Edit, then Add Row.
                        </td>
                      </tr>
                    ) : (
                      (scheduleEditing ? windows : sortedWindows).map(
                        (w, index) => (
                          <tr
                            key={`${w.dayOfWeek}-${w.startTime}-${w.endTime}-${index}`}
                          >
                            <td className="px-3 py-2">
                              {scheduleEditing ? (
                                <select
                                  className="flex h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                                  value={w.dayOfWeek}
                                  onChange={(e) =>
                                    updateWindow(index, {
                                      dayOfWeek: Number(e.target.value),
                                    })
                                  }
                                >
                                  {DAY_LABELS.map((label, d) => (
                                    <option key={label} value={d}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                DAY_LABELS[w.dayOfWeek]
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {scheduleEditing ? (
                                <Input
                                  type="time"
                                  className="h-8 w-[7.5rem]"
                                  value={minutesToTimeLabel(w.startTime)}
                                  onChange={(e) =>
                                    updateWindow(index, {
                                      startTime: parseHm(e.target.value),
                                    })
                                  }
                                />
                              ) : (
                                minutesToTimeLabel(w.startTime)
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {scheduleEditing ? (
                                <Input
                                  type="time"
                                  className="h-8 w-[7.5rem]"
                                  value={minutesToTimeLabel(w.endTime)}
                                  onChange={(e) =>
                                    updateWindow(index, {
                                      endTime: parseHm(e.target.value),
                                    })
                                  }
                                />
                              ) : (
                                minutesToTimeLabel(w.endTime)
                              )}
                            </td>
                            {scheduleEditing && (
                              <td className="px-3 py-2">
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => removeWindow(index)}
                                >
                                  Delete
                                </Button>
                              </td>
                            )}
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              }
              cards={
                <div className="space-y-3 p-3">
                  {(scheduleEditing ? windows : sortedWindows).length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No windows — click Edit, then Add Row.
                    </p>
                  ) : (
                    (scheduleEditing ? windows : sortedWindows).map(
                      (w, index) => (
                        <Card
                          key={`${w.dayOfWeek}-${w.startTime}-${w.endTime}-${index}`}
                          className="shadow-sm"
                        >
                          <CardContent className="space-y-2 p-3">
                            {scheduleEditing ? (
                              <>
                                <div className="space-y-1.5">
                                  <Label>Day</Label>
                                  <select
                                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                                    value={w.dayOfWeek}
                                    onChange={(e) =>
                                      updateWindow(index, {
                                        dayOfWeek: Number(e.target.value),
                                      })
                                    }
                                  >
                                    {DAY_LABELS.map((label, d) => (
                                      <option key={label} value={d}>
                                        {label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label>Start</Label>
                                  <Input
                                    type="time"
                                    className="h-8"
                                    value={minutesToTimeLabel(w.startTime)}
                                    onChange={(e) =>
                                      updateWindow(index, {
                                        startTime: parseHm(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>End</Label>
                                  <Input
                                    type="time"
                                    className="h-8"
                                    value={minutesToTimeLabel(w.endTime)}
                                    onChange={(e) =>
                                      updateWindow(index, {
                                        endTime: parseHm(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="w-full"
                                  onClick={() => removeWindow(index)}
                                >
                                  Delete
                                </Button>
                              </>
                            ) : (
                              <>
                                <p className="font-medium">
                                  {DAY_LABELS[w.dayOfWeek]}
                                </p>
                                <MobileField label="Start">
                                  {minutesToTimeLabel(w.startTime)}
                                </MobileField>
                                <MobileField label="End">
                                  {minutesToTimeLabel(w.endTime)}
                                </MobileField>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      )
                    )
                  )}
                </div>
              }
            />
            {scheduleEditing && (
              <Button type="button" variant="outline" size="sm" onClick={addScheduleRow}>
                Add Row
              </Button>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Monthly overrides</h2>
                <div className="mt-2 space-y-1.5">
                  <Label>Month</Label>
                  <Input
                    type="month"
                    value={month}
                    onChange={(e) => {
                      setMonth(e.target.value);
                      navigate(doctorId, e.target.value);
                    }}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await copyMonthOverrides(doctorId, month);
                    setMessage(
                      result.success
                        ? "Copied from previous month"
                        : result.error
                    );
                    if (result.success) refresh();
                  });
                }}
              >
                Copy previous month
              </Button>
            </div>

            <div className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={isBlocked ? "blocked" : "hours"}
                  onChange={(e) => setIsBlocked(e.target.value === "blocked")}
                >
                  <option value="blocked">Full day off</option>
                  <option value="hours">Custom hours</option>
                </select>
              </div>
              {!isBlocked && (
                <>
                  <div className="space-y-1.5">
                    <Label>Start</Label>
                    <Input
                      type="time"
                      value={ovStart}
                      onChange={(e) => setOvStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End</Label>
                    <Input
                      type="time"
                      value={ovEnd}
                      onChange={(e) => setOvEnd(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Reason</Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Holiday, conference…"
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="button" onClick={saveOverride} disabled={isPending}>
                  Save override
                </Button>
              </div>
            </div>

            <ul className="divide-y divide-border rounded-md border border-border">
              {overrides.length === 0 ? (
                <li className="px-4 py-6 text-sm text-muted-foreground">
                  No overrides this month
                </li>
              ) : (
                overrides.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">{o.date}</span>
                      <span className="ml-2 text-muted-foreground">
                        {o.isBlocked
                          ? "Blocked"
                          : `${minutesToTimeLabel(o.startTime ?? 0)}–${minutesToTimeLabel(o.endTime ?? 0)}`}
                        {o.reason ? ` · ${o.reason}` : ""}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        startTransition(async () => {
                          await deleteOverride(o.id);
                          refresh();
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      )}

      {tab === "specializations" && (
        <div className="space-y-4">
          {!canManageCatalog && (
            <p className="text-sm text-muted-foreground">
              View only — Admin or Staff can edit specializations.
            </p>
          )}
          {canManageCatalog && (
            <div className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={specName}
                  onChange={(e) => setSpecName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={specDesc}
                  onChange={(e) => setSpecDesc(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Assigned doctors</Label>
                <div className="flex flex-wrap gap-3">
                  {doctors.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={specDoctors.includes(d.id)}
                        onChange={(e) => {
                          setSpecDoctors((prev) =>
                            e.target.checked
                              ? [...prev, d.id]
                              : prev.filter((id) => id !== d.id)
                          );
                        }}
                      />
                      {d.fullName}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button
                  type="button"
                  disabled={isPending || !specName.trim()}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await upsertSpecialization({
                        id: editingSpecId ?? undefined,
                        name: specName.trim(),
                        description: specDesc || null,
                        isActive: true,
                        doctorIds: specDoctors,
                      });
                      setMessage(
                        result.success ? "Specialization saved" : result.error
                      );
                      if (result.success) {
                        resetSpecForm();
                        refresh();
                      }
                    });
                  }}
                >
                  {editingSpecId ? "Update" : "Add"} specialization
                </Button>
                {editingSpecId && (
                  <Button type="button" variant="outline" onClick={resetSpecForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
          <ul className="divide-y divide-border rounded-md border border-border">
            {specializations.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted-foreground">
                No specializations yet
              </li>
            ) : (
              specializations.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {s.name}
                      {!s.isActive && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (inactive)
                        </span>
                      )}
                    </p>
                    {s.description && (
                      <p className="text-muted-foreground">{s.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Doctors:{" "}
                      {s.doctorIds.length === 0
                        ? "—"
                        : s.doctorIds
                            .map(
                              (id) =>
                                doctors.find((d) => d.id === id)?.fullName ?? id
                            )
                            .join(", ")}
                    </p>
                  </div>
                  {canManageCatalog && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setEditingSpecId(s.id);
                          setSpecName(s.name);
                          setSpecDesc(s.description ?? "");
                          setSpecDoctors(s.doctorIds);
                          setTab("specializations");
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          startTransition(async () => {
                            await deleteSpecialization(s.id);
                            refresh();
                          });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {tab === "services" && (
        <div className="space-y-4">
          {!canManageCatalog && (
            <p className="text-sm text-muted-foreground">
              View only — Admin or Staff can edit services.
            </p>
          )}
          {canManageCatalog && (
            <div className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={svcName}
                  onChange={(e) => setSvcName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={svcDesc}
                  onChange={(e) => setSvcDesc(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={svcSort}
                  onChange={(e) => setSvcSort(e.target.value)}
                />
              </div>
              <div className="flex gap-2 sm:col-span-3">
                <Button
                  type="button"
                  disabled={isPending || !svcName.trim()}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await upsertClinicService({
                        id: editingSvcId ?? undefined,
                        name: svcName.trim(),
                        description: svcDesc || null,
                        isActive: true,
                        sortOrder: Number(svcSort) || 0,
                      });
                      setMessage(
                        result.success ? "Service saved" : result.error
                      );
                      if (result.success) {
                        resetSvcForm();
                        refresh();
                      }
                    });
                  }}
                >
                  {editingSvcId ? "Update" : "Add"} service
                </Button>
                {editingSvcId && (
                  <Button type="button" variant="outline" onClick={resetSvcForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
          <ul className="divide-y divide-border rounded-md border border-border">
            {services.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted-foreground">
                No services yet
              </li>
            ) : (
              services.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {s.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        sort {s.sortOrder}
                        {!s.isActive ? " · inactive" : ""}
                      </span>
                    </p>
                    {s.description && (
                      <p className="text-muted-foreground">{s.description}</p>
                    )}
                  </div>
                  {canManageCatalog && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setEditingSvcId(s.id);
                          setSvcName(s.name);
                          setSvcDesc(s.description ?? "");
                          setSvcSort(String(s.sortOrder));
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          startTransition(async () => {
                            await deleteClinicService(s.id);
                            refresh();
                          });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
