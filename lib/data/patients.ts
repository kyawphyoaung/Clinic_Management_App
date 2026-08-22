import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export type PatientListFilters = {
  search?: string;
  status?: string;
  source?: string;
  agentId?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export type PatientListResult = Awaited<ReturnType<typeof queryPatients>>;

type AgentOption = { id: string; fullName: string; partnerId: string | null };

// Coalesce identical in-flight queries so an RSC/HMR refresh storm
// cannot open hundreds of parallel DB round-trips.
const patientsInflight = new Map<string, Promise<PatientListResult>>();
const agentsInflight = new Map<string, Promise<AgentOption[]>>();

async function queryPatients(filters?: PatientListFilters) {
  await requireAuth();

  const where: Record<string, unknown> = {};

  if (filters?.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: "insensitive" } },
      { displayId: { contains: filters.search, mode: "insensitive" } },
      { patientNumber: { contains: filters.search, mode: "insensitive" } },
      { mobileNumber: { contains: filters.search, mode: "insensitive" } },
      { preferredName: { contains: filters.search, mode: "insensitive" } },
      { visits: { some: { displayId: { contains: filters.search, mode: "insensitive" } } } },
    ];
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.source) {
    where.source = filters.source;
  }

  if (filters?.agentId) {
    where.currentAgentId = filters.agentId;
  }

  const pageSize = [20, 50, 100].includes(Number(filters?.pageSize))
    ? Number(filters?.pageSize)
    : 20;
  const page = Math.max(1, Number(filters?.page) || 1);
  const sort = filters?.sort ?? "date";

  const orderBy =
    sort === "name"
      ? { fullName: "asc" as const }
      : sort === "status"
        ? { status: "asc" as const }
        : { createdAt: "desc" as const };

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      include: {
        currentAgent: {
          select: { id: true, fullName: true, partnerId: true },
        },
        visits: {
          orderBy: { visitDate: "desc" },
          take: 1,
          select: { displayId: true },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    patients,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPatients(
  filters?: PatientListFilters
): Promise<PatientListResult> {
  const key = JSON.stringify({
    search: filters?.search ?? "",
    status: filters?.status ?? "",
    source: filters?.source ?? "",
    agentId: filters?.agentId ?? "",
    sort: filters?.sort ?? "date",
    page: Math.max(1, Number(filters?.page) || 1),
    pageSize: [20, 50, 100].includes(Number(filters?.pageSize))
      ? Number(filters?.pageSize)
      : 20,
  });

  const existing = patientsInflight.get(key);
  if (existing) return existing;

  const promise = queryPatients(filters).finally(() => {
    patientsInflight.delete(key);
  });

  patientsInflight.set(key, promise);
  return promise;
}

export async function getAgentsForAssignment(): Promise<AgentOption[]> {
  const key = "agents";
  const existing = agentsInflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    await requireAuth();
    return prisma.agent.findMany({
      select: { id: true, fullName: true, partnerId: true },
      orderBy: { fullName: "asc" },
    });
  })().finally(() => {
    agentsInflight.delete(key);
  });

  agentsInflight.set(key, promise);
  return promise;
}

export async function getPatientById(id: string) {
  await requireAuth();

  return prisma.patient.findUnique({
    where: { id },
    include: {
      currentAgent: true,
      consentLogs: { orderBy: { consentedAt: "desc" } },
      surveys: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getClinicsForSelect() {
  await requireAuth();
  return prisma.clinic.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
}
