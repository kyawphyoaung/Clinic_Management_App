import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { decrypt } from "@/lib/utils/encryption";

const decryptableFields = new Set([
  "passportNumber",
  "mobileNumber",
  "whatsapp",
  "lineId",
  "email",
  "streetAddress",
  "city",
  "stateProvince",
  "postalCode",
  "emergencyName",
  "emergencyPhone",
  "emergencyEmail",
  "previousTreatmentDescription",
  "signatureImageUrl",
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const field = searchParams.get("field");

    if (!field || !decryptableFields.has(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
      select: { [field]: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const value = patient[field as keyof typeof patient] as unknown;
    if (typeof value !== "string" || value.length === 0) {
      return NextResponse.json({ value: "—" });
    }

    return NextResponse.json({ value: decrypt(value) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
