import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client for generating signed Storage URLs.
const serverSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const IMAGE_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Derive a Storage object key from a stored public URL.
 *
 * New format: `.../<bucket>/<userId>/<filename>` -> `<userId>/<filename>`
 * Old format: just a filename                    -> `<filename>`
 */
export function objectKeyFromImageUrl(
  url: string,
  bucket: string,
): string | null {
  const marker = `/${bucket}/`;
  if (url.includes(marker)) {
    return url.split(marker)[1].split("?")[0];
  }
  if (/^https?:\/\//.test(url)) return null;

  return url.replace(/^\/+/, "").split("?")[0] || null;
}

/**
 * Convert a stored public image URL into a signed URL for a (possibly private)
 * bucket. Returns the original URL if signing is not possible.
 */
export async function signImageUrl(
  imageUrl: string | null | undefined,
  bucket: string,
  expiresInSeconds = IMAGE_URL_TTL_SECONDS,
): Promise<string> {
  if (!imageUrl) return "";
  const objectKey = objectKeyFromImageUrl(imageUrl, bucket);
  if (!objectKey) return imageUrl;
  const { data } = await serverSupabase.storage
    .from(bucket)
    .createSignedUrl(objectKey, expiresInSeconds);
  return data?.signedUrl ?? "";
}
