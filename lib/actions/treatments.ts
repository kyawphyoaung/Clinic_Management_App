"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { recalculateCommissionForTreatment } from "@/lib/actions/commission";
import { allocateInvoiceId, allocateShortId } from "@/lib/utils/display-id";
import type {
  PaymentMethod,
  ServiceCategory,
  TreatmentStatus,
} from "@/prisma/generated/prisma/client";

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function getTreatmentsForPatient(patientId: string) {
  await requirePermission("treatments:read");
  return prisma.treatment.findMany({
    where: { patientId },
    include: {
      doctor: { select: { id: true, fullName: true } },
      charges: {
        include: { lines: true, allocations: true },
      },
      payments: true,
    },
    orderBy: { treatmentDate: "desc" },
  });
}

type GetTreatmentsFilters = {
  search?: string;
  status?: string;
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export async function getTreatments(filters: GetTreatmentsFilters = {}) {
  await requirePermission("treatments:read");

  const search = filters.search?.trim();
  const status =
    filters.status &&
    ["ONGOING", "COMPLETED", "FOLLOW_UP_SCHEDULED"].includes(filters.status)
      ? (filters.status as TreatmentStatus)
      : undefined;

  const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
  const dateTo = filters.dateTo ? new Date(filters.dateTo) : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
    ...(dateFrom || dateTo
      ? {
          treatmentDate: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { diagnosis: { contains: search, mode: "insensitive" as const } },
            {
              patient: {
                fullName: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              patient: {
                patientNumber: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              doctor: {
                fullName: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const pageSize = [20, 50, 100].includes(Number(filters.pageSize))
    ? Number(filters.pageSize)
    : 20;
  const page = Math.max(1, Number(filters.page) || 1);
  const sort = filters.sort ?? "created";

  const orderBy =
    sort === "patient"
      ? { patient: { fullName: "asc" as const } }
      : sort === "date"
        ? { treatmentDate: "desc" as const }
        : sort === "diagnosis"
          ? { diagnosis: "asc" as const }
          : sort === "status"
            ? { status: "asc" as const }
            : { createdAt: "desc" as const };

  const [total, treatments] = await Promise.all([
    prisma.treatment.count({ where }),
    prisma.treatment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            displayId: true,
            patientNumber: true,
            fullName: true,
          },
        },
        doctor: { select: { id: true, fullName: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    treatments,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type TreatmentSuggestion = {
  id: string;
  label: string;
  matchType: "Patient Name" | "Patient ID" | "Diagnosis";
  href: string;
  searchValue: string;
};

export async function suggestTreatments(
  query: string
): Promise<TreatmentSuggestion[]> {
  await requirePermission("treatments:read");

  const q = query.trim();
  if (q.length < 1) return [];

  const treatments = await prisma.treatment.findMany({
    where: {
      OR: [
        { diagnosis: { contains: q, mode: "insensitive" } },
        {
          patient: {
            fullName: { contains: q, mode: "insensitive" },
          },
        },
        {
          patient: {
            patientNumber: { contains: q, mode: "insensitive" },
          },
        },
        {
          patient: {
            displayId: { contains: q, mode: "insensitive" },
          },
        },
      ],
    },
    select: {
      id: true,
      diagnosis: true,
      shortId: true,
      patient: {
        select: {
          fullName: true,
          patientNumber: true,
          displayId: true,
        },
      },
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const lower = q.toLowerCase();

  return treatments.map((treatment) => {
    let matchType: TreatmentSuggestion["matchType"] = "Patient Name";
    let searchValue = treatment.patient.fullName;

    if (treatment.patient.patientNumber.toLowerCase().includes(lower)) {
      matchType = "Patient ID";
      searchValue = treatment.patient.patientNumber;
    } else if (treatment.patient.displayId.toLowerCase().includes(lower)) {
      matchType = "Patient ID";
      searchValue = treatment.patient.displayId;
    } else if (treatment.diagnosis?.toLowerCase().includes(lower)) {
      matchType = "Diagnosis";
      searchValue = treatment.diagnosis;
    }

    return {
      id: treatment.id,
      label: `${treatment.patient.fullName} · ${treatment.diagnosis ?? treatment.shortId}`,
      matchType,
      href: `/dashboard/treatments/${treatment.id}`,
      searchValue,
    };
  });
}

type GetBillingFilters = {
  search?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function getBillingPayments(filters: GetBillingFilters = {}) {
  await requirePermission("treatments:read");

  const search = filters.search?.trim();
  const method =
    filters.method && ["BANK", "CASH", "CARD"].includes(filters.method)
      ? (filters.method as PaymentMethod)
      : undefined;

  const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
  const dateTo = filters.dateTo ? new Date(filters.dateTo) : undefined;

  return prisma.treatmentPayment.findMany({
    where: {
      ...(method ? { method } : {}),
      ...(dateFrom || dateTo
        ? {
            paymentDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search, mode: "insensitive" } },
              {
                treatment: {
                  diagnosis: { contains: search, mode: "insensitive" },
                },
              },
              {
                treatment: {
                  patient: {
                    fullName: { contains: search, mode: "insensitive" },
                  },
                },
              },
              {
                treatment: {
                  patient: {
                    preferredName: { contains: search, mode: "insensitive" },
                  },
                },
              },
              {
                treatment: {
                  patient: {
                    displayId: { contains: search, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      treatment: {
        include: {
          patient: {
            select: {
              id: true,
              displayId: true,
              fullName: true,
            },
          },
          charges: {
            select: {
              netPrice: true,
              lines: { select: { serviceCategory: true } },
            },
          },
        },
      },
      allocations: {
        include: {
          charge: {
            select: {
              lines: { select: { serviceCategory: true } },
            },
          },
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  });
}

export async function getTreatmentById(id: string) {
  await requirePermission("treatments:read");
  return prisma.treatment.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          displayId: true,
          patientNumber: true,
          fullName: true,
        },
      },
      visit: {
        select: { id: true, displayId: true, agentId: true },
      },
      doctor: { select: { id: true, fullName: true } },
      charges: {
        orderBy: { createdAt: "asc" },
        include: {
          lines: { orderBy: { createdAt: "asc" } },
          allocations: true,
        },
      },
      payments: {
        orderBy: { paymentDate: "asc" },
        include: {
          recordedBy: { select: { fullName: true } },
          allocations: true,
        },
      },
    },
  });
}

type CreateTreatmentInput = {
  patientId: string;
  visitId: string;
  treatmentDate?: string;
  diagnosis?: string;
  doctorId?: string | null;
  notes?: string;
};

export async function createTreatment(input: CreateTreatmentInput) {
  await requirePermission("treatments:write");

  const treatment = await prisma.$transaction(async (tx) => {
    const visit = await tx.visit.findFirst({
      where: { id: input.visitId, patientId: input.patientId },
      select: { id: true },
    });
    if (!visit) {
      throw new Error("Visit not found for this patient");
    }

    const shortId = await allocateShortId(tx, "treat", "TREAT-");
    const created = await tx.treatment.create({
      data: {
        shortId,
        patientId: input.patientId,
        visitId: visit.id,
        treatmentDate: new Date(input.treatmentDate || todayDateString()),
        diagnosis: input.diagnosis?.trim() || null,
        doctorId: input.doctorId || null,
        notes: input.notes?.trim() || null,
      },
    });

    await tx.patient.updateMany({
      where: {
        id: input.patientId,
        status: { notIn: ["TREATMENT", "COMPLETED", "RESCHEDULED_FOR_FOLLOW_UP"] },
      },
      data: { status: "TREATMENT" },
    });

    return created;
  });

  revalidatePath(`/dashboard/patients/${input.patientId}`);
  revalidatePath("/dashboard/patients");
  redirect(`/dashboard/treatments/${treatment.id}`);
}

type UpdateTreatmentInput = {
  treatmentId: string;
  treatmentDate?: string;
  diagnosis?: string;
  doctorId?: string | null;
  notes?: string;
  status?: TreatmentStatus;
  endDate?: string | null;
};

export async function updateTreatment(input: UpdateTreatmentInput) {
  await requirePermission("treatments:write");

  const existing = await prisma.treatment.findUnique({
    where: { id: input.treatmentId },
    select: { id: true, patientId: true, status: true, endDate: true },
  });
  if (!existing) {
    return { success: false as const, error: "Treatment not found" };
  }

  const nextStatus = input.status ?? existing.status;
  const leavingCompleted =
    Boolean(input.status) &&
    input.status !== "COMPLETED" &&
    existing.status === "COMPLETED";

  let endDateUpdate: Date | null | undefined = undefined;
  if (leavingCompleted) {
    endDateUpdate = null;
  } else if (nextStatus === "COMPLETED") {
    if (input.endDate) {
      endDateUpdate = new Date(input.endDate);
    } else if (!existing.endDate) {
      endDateUpdate = new Date();
    }
  } else if (input.endDate !== undefined) {
    endDateUpdate = input.endDate ? new Date(input.endDate) : null;
  }

  const treatment = await prisma.treatment.update({
    where: { id: input.treatmentId },
    data: {
      ...(input.treatmentDate
        ? { treatmentDate: new Date(input.treatmentDate) }
        : {}),
      ...(input.diagnosis !== undefined
        ? { diagnosis: input.diagnosis.trim() || null }
        : {}),
      ...(input.doctorId !== undefined ? { doctorId: input.doctorId || null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(endDateUpdate !== undefined ? { endDate: endDateUpdate } : {}),
    },
  });

  if (input.status || endDateUpdate !== undefined) {
    await recalculateCommissionForTreatment(treatment.id);
  }

  revalidatePath(`/dashboard/treatments/${treatment.id}`);
  revalidatePath(`/dashboard/patients/${treatment.patientId}`);
  revalidatePath("/dashboard/treatments");
  revalidatePath("/dashboard/agents");
  return { success: true as const };
}

export async function deleteTreatment(treatmentId: string) {
  await requirePermission("treatments:write");

  const existing = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    select: { id: true, patientId: true },
  });
  if (!existing) {
    return { success: false as const, error: "Treatment not found" };
  }

  await prisma.treatment.delete({ where: { id: treatmentId } });

  revalidatePath(`/dashboard/patients/${existing.patientId}`);
  revalidatePath("/dashboard/treatments");
  revalidatePath("/dashboard/agents");
  return { success: true as const, patientId: existing.patientId };
}

export async function bulkDeleteTreatments(treatmentIds: string[]) {
  await requirePermission("treatments:write");

  const ids = [...new Set(treatmentIds.filter(Boolean))];
  if (ids.length === 0) {
    return { success: false as const, error: "No treatments selected" };
  }

  const treatments = await prisma.treatment.findMany({
    where: { id: { in: ids } },
    select: { id: true, patientId: true },
  });

  await prisma.treatment.deleteMany({ where: { id: { in: ids } } });

  for (const patientId of new Set(treatments.map((t) => t.patientId))) {
    revalidatePath(`/dashboard/patients/${patientId}`);
  }
  revalidatePath("/dashboard/treatments");
  revalidatePath("/dashboard/agents");
  return { success: true as const, count: treatments.length };
}

type ChargeLineInput = {
  serviceCategory: ServiceCategory;
  notes?: string | null;
  quantity: number;
  unitPrice: number;
};

type AddChargeInput = {
  treatmentId: string;
  lineItems: ChargeLineInput[];
  discount?: number;
  isAgentRelated?: boolean;
};

export async function addCharge(input: AddChargeInput) {
  await requirePermission("treatments:write");

  const lineItems = (input.lineItems ?? []).filter(
    (l) => l.serviceCategory && Number(l.quantity) > 0
  );
  if (lineItems.length === 0) {
    return { success: false as const, error: "Add at least one line item" };
  }

  const discount = Math.max(0, Number(input.discount) || 0);
  const totalPrice = lineItems.reduce((sum, l) => {
    const qty = Math.max(1, Number(l.quantity) || 1);
    const price = Math.max(0, Number(l.unitPrice) || 0);
    return sum + qty * price;
  }, 0);
  const netPrice = Math.max(0, totalPrice - discount);

  const treatment = await prisma.treatment.findUnique({
    where: { id: input.treatmentId },
    select: {
      patientId: true,
      visit: { select: { agentId: true } },
    },
  });
  if (!treatment) {
    return { success: false as const, error: "Treatment not found" };
  }

  const defaultAgentRelated = Boolean(treatment.visit.agentId);
  const isAgentRelated =
    typeof input.isAgentRelated === "boolean"
      ? input.isAgentRelated
      : defaultAgentRelated;

  let invoiceId = "";
  await prisma.$transaction(async (tx) => {
    const shortId = await allocateInvoiceId(tx);
    invoiceId = shortId;
    await tx.treatmentCharge.create({
      data: {
        shortId,
        treatmentId: input.treatmentId,
        totalPrice,
        discount,
        depositApplied: 0,
        netPrice,
        isAgentRelated,
        lines: {
          create: lineItems.map((l) => ({
            serviceCategory: l.serviceCategory,
            notes: l.notes?.trim() || null,
            quantity: Math.max(1, Number(l.quantity) || 1),
            unitPrice: Math.max(0, Number(l.unitPrice) || 0),
          })),
        },
      },
    });
  });

  await recalculateCommissionForTreatment(input.treatmentId);

  revalidatePath(`/dashboard/treatments/${input.treatmentId}`);
  revalidatePath(`/dashboard/patients/${treatment.patientId}`);
  return { success: true as const, shortId: invoiceId };
}

export async function updateCharge(input: {
  chargeId: string;
  lineItems: ChargeLineInput[];
  discount?: number;
  isAgentRelated?: boolean;
}) {
  await requirePermission("treatments:write");

  const lineItems = (input.lineItems ?? []).filter(
    (l) => l.serviceCategory && Number(l.quantity) > 0
  );
  if (lineItems.length === 0) {
    return { success: false as const, error: "Add at least one line item" };
  }

  const existing = await prisma.treatmentCharge.findUnique({
    where: { id: input.chargeId },
    select: { id: true, treatmentId: true, allocations: { select: { id: true } } },
  });
  if (!existing) {
    return { success: false as const, error: "Charge not found" };
  }
  if (existing.allocations.length > 0) {
    // Allow editing totals/lines even after partial payment; allocations stay linked.
  }

  const discount = Math.max(0, Number(input.discount) || 0);
  const totalPrice = lineItems.reduce((sum, l) => {
    const qty = Math.max(1, Number(l.quantity) || 1);
    const price = Math.max(0, Number(l.unitPrice) || 0);
    return sum + qty * price;
  }, 0);
  const netPrice = Math.max(0, totalPrice - discount);

  await prisma.$transaction(async (tx) => {
    await tx.treatmentChargeLine.deleteMany({ where: { chargeId: existing.id } });
    await tx.treatmentCharge.update({
      where: { id: existing.id },
      data: {
        totalPrice,
        discount,
        netPrice,
        depositApplied: 0,
        ...(typeof input.isAgentRelated === "boolean"
          ? { isAgentRelated: input.isAgentRelated }
          : {}),
        lines: {
          create: lineItems.map((l) => ({
            serviceCategory: l.serviceCategory,
            notes: l.notes?.trim() || null,
            quantity: Math.max(1, Number(l.quantity) || 1),
            unitPrice: Math.max(0, Number(l.unitPrice) || 0),
          })),
        },
      },
    });
  });

  await recalculateCommissionForTreatment(existing.treatmentId);
  revalidatePath(`/dashboard/treatments/${existing.treatmentId}`);
  return { success: true as const };
}

export async function deleteCharge(chargeId: string) {
  await requirePermission("treatments:write");

  const existing = await prisma.treatmentCharge.findUnique({
    where: { id: chargeId },
    select: { id: true, treatmentId: true, allocations: { select: { id: true } } },
  });
  if (!existing) {
    return { success: false as const, error: "Charge not found" };
  }
  if (existing.allocations.length > 0) {
    return { success: false as const, error: "Cannot delete a charge that has payments" };
  }

  await prisma.treatmentCharge.delete({ where: { id: existing.id } });
  await recalculateCommissionForTreatment(existing.treatmentId);
  revalidatePath(`/dashboard/treatments/${existing.treatmentId}`);
  return { success: true as const };
}

type RecordPaymentInput = {
  treatmentId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate?: string;
  reference?: string;
  notes?: string;
  depositAppliedAmount?: number;
  allocations?: { chargeId: string; amount: number }[];
};

type UpdatePaymentInput = {
  paymentId: string;
  method?: PaymentMethod;
  paymentDate?: string;
  reference?: string;
  notes?: string;
  /** When provided, replaces existing invoice allocations and recalculates amount. */
  allocations?: Array<{ chargeId: string; amount: number }>;
  amount?: number;
  depositAppliedAmount?: number;
};

export async function recordPayment(input: RecordPaymentInput) {
  const session = await requirePermission("treatments:write");

  const amount = Number(input.amount);
  const depositAppliedAmount = Math.max(0, Number(input.depositAppliedAmount) || 0);
  if (!(amount > 0) && !(depositAppliedAmount > 0)) {
    return { success: false as const, error: "Amount must be greater than 0" };
  }

  const allocations = input.allocations?.filter((a) => a.amount > 0) ?? [];
  const allocatedTotal = allocations.reduce((sum, a) => sum + Number(a.amount), 0);
  if (allocatedTotal > amount + depositAppliedAmount + 0.001) {
    return {
      success: false as const,
      error: "Allocated amount cannot exceed cash plus deposit",
    };
  }

  if (depositAppliedAmount > 0) {
    const treatment = await prisma.treatment.findUnique({
      where: { id: input.treatmentId },
      select: { patientId: true },
    });
    if (!treatment) {
      return { success: false as const, error: "Treatment not found" };
    }
    const { getPatientDepositBalance } = await import("@/lib/actions/deposits");
    const balance = await getPatientDepositBalance(treatment.patientId);
    if (depositAppliedAmount > balance + 0.001) {
      return { success: false as const, error: "Deposit applied exceeds available balance" };
    }
  }

  const recordedById = session.user.id || null;
  const userExists = recordedById
    ? Boolean(
        await prisma.user.findUnique({
          where: { id: recordedById },
          select: { id: true },
        })
      )
    : false;

  const payment = await prisma.treatmentPayment.create({
    data: {
      treatmentId: input.treatmentId,
      amount,
      method: input.method,
      paymentDate: new Date(input.paymentDate || todayDateString()),
      reference: input.reference?.trim() || null,
      notes: input.notes?.trim() || null,
      depositAppliedAmount,
      recordedById: userExists ? recordedById : null,
      allocations:
        allocations.length > 0
          ? {
              create: allocations.map((a) => ({
                chargeId: a.chargeId,
                amount: a.amount,
              })),
            }
          : undefined,
    },
  });

  await recalculateCommissionForTreatment(input.treatmentId);

  revalidatePath(`/dashboard/treatments/${input.treatmentId}`);
  return { success: true as const, paymentId: payment.id };
}

export async function updatePayment(input: UpdatePaymentInput) {
  await requirePermission("treatments:write");
  const payment = await prisma.treatmentPayment.findUnique({
    where: { id: input.paymentId },
    select: { id: true, treatmentId: true, amount: true, depositAppliedAmount: true },
  });
  if (!payment) return { success: false as const, error: "Payment not found" };

  await prisma.$transaction(async (tx) => {
    if (input.allocations) {
      await tx.paymentAllocation.deleteMany({ where: { paymentId: payment.id } });
      const allocations = input.allocations.filter((a) => a.chargeId && Number(a.amount) > 0);
      if (allocations.length > 0) {
        await tx.paymentAllocation.createMany({
          data: allocations.map((a) => ({
            paymentId: payment.id,
            chargeId: a.chargeId,
            amount: Number(a.amount),
          })),
        });
      }
    }

    await tx.treatmentPayment.update({
      where: { id: payment.id },
      data: {
        ...(input.method ? { method: input.method } : {}),
        ...(input.paymentDate ? { paymentDate: new Date(input.paymentDate) } : {}),
        ...(input.reference !== undefined
          ? { reference: input.reference.trim() || null }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
        ...(typeof input.amount === "number" ? { amount: input.amount } : {}),
        ...(typeof input.depositAppliedAmount === "number"
          ? { depositAppliedAmount: input.depositAppliedAmount }
          : {}),
      },
    });
  });

  await recalculateCommissionForTreatment(payment.treatmentId);
  revalidatePath(`/dashboard/treatments/${payment.treatmentId}`);
  return { success: true as const };
}

export async function deletePayment(paymentId: string) {
  await requirePermission("treatments:write");
  const payment = await prisma.treatmentPayment.findUnique({
    where: { id: paymentId },
    select: { id: true, treatmentId: true },
  });
  if (!payment) return { success: false as const, error: "Payment not found" };

  await prisma.$transaction(async (tx) => {
    await tx.paymentAllocation.deleteMany({ where: { paymentId } });
    await tx.treatmentPayment.delete({ where: { id: paymentId } });
  });
  await recalculateCommissionForTreatment(payment.treatmentId);
  revalidatePath(`/dashboard/treatments/${payment.treatmentId}`);
  return { success: true as const };
}
