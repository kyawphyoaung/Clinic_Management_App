import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { decrypt } from "@/lib/utils/encryption";
import { getSignaturePublicUrl } from "@/lib/utils/supabase-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      select: { signatureImageUrl: true },
    });

    if (!patient?.signatureImageUrl) {
      return NextResponse.json({ error: "No signature found" }, { status: 404 });
    }

    let storagePath: string;
    try {
      storagePath = decrypt(patient.signatureImageUrl);
    } catch {
      return NextResponse.json({ error: "Failed to decrypt signature path" }, { status: 500 });
    }

    if (!process.env.SUPABASE_URL) {
      return NextResponse.json(
        { error: "Supabase storage is not configured" },
        { status: 500 }
      );
    }

    const url = getSignaturePublicUrl(storagePath);
    if (!url) {
      return NextResponse.json({ error: "No signature URL available" }, { status: 404 });
    }

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
