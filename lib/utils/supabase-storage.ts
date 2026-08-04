import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SIGNATURE_BUCKET = "patient_signatures";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase storage is not configured");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function uploadSignatureImage(
  base64Data: string,
  prefix: "patient" | "agent" = "patient"
): Promise<string> {
  const supabase = getSupabaseAdmin();

  const base64 = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;
  const buffer = Buffer.from(base64, "base64");
  const path = `${prefix}/${randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from(SIGNATURE_BUCKET)
    .upload(path, buffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(`Signature upload failed: ${error.message}`);
  }

  return path;
}

export function normalizeStoragePath(storagePath: string): string {
  let path = storagePath.trim();

  // Strip full Supabase public URL if stored as legacy absolute URL
  const publicPrefix = `/storage/v1/object/public/${SIGNATURE_BUCKET}/`;
  const publicIdx = path.indexOf(publicPrefix);
  if (publicIdx >= 0) {
    path = path.slice(publicIdx + publicPrefix.length);
  }

  // Strip bucket prefix if present
  if (path.startsWith(`${SIGNATURE_BUCKET}/`)) {
    path = path.slice(SIGNATURE_BUCKET.length + 1);
  }

  // Strip leading slash
  if (path.startsWith("/")) {
    path = path.slice(1);
  }

  return path;
}

export function getSignaturePublicUrl(storagePath: string): string | null {
  const url = process.env.SUPABASE_URL;
  if (!url) return null;
  const normalized = normalizeStoragePath(storagePath);
  if (!normalized) return null;
  return `${url}/storage/v1/object/public/${SIGNATURE_BUCKET}/${normalized}`;
}

export async function deleteSignatureImage(storagePath: string): Promise<void> {
  const normalized = normalizeStoragePath(storagePath);
  if (!normalized) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(SIGNATURE_BUCKET)
    .remove([normalized]);

  if (error) {
    console.error("Failed to delete signature image:", error.message);
  }
}
