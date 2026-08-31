import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client for generating signed Storage URLs.
const serverSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const PUBLIC_IMAGE_BUCKETS = new Set(["carousel", "products"]);

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
  const [signedUrl = ""] = await signImageUrls(
    [imageUrl],
    bucket,
    expiresInSeconds,
  );
  return signedUrl;
}

export async function signImageUrls(
  imageUrls: (string | null | undefined)[],
  bucket: string,
  expiresInSeconds = IMAGE_URL_TTL_SECONDS,
): Promise<string[]> {
  const objectKeys = imageUrls.map((imageUrl) =>
    imageUrl ? objectKeyFromImageUrl(imageUrl, bucket) : null,
  );
  if (PUBLIC_IMAGE_BUCKETS.has(bucket)) {
    return imageUrls.map((imageUrl, index) => {
      const objectKey = objectKeys[index];
      if (!imageUrl || !objectKey) return imageUrl ?? "";
      return serverSupabase.storage.from(bucket).getPublicUrl(objectKey).data
        .publicUrl;
    });
  }

  const signableKeys = objectKeys.filter(
    (objectKey): objectKey is string => objectKey !== null,
  );
  if (signableKeys.length === 0) {
    return imageUrls.map((imageUrl) => imageUrl ?? "");
  }
  const { data } = await serverSupabase.storage
    .from(bucket)
    .createSignedUrls(signableKeys, expiresInSeconds);
  const signedUrlsByKey = new Map(
    data?.map((result) => [result.path, result.signedUrl]) ?? [],
  );

  return imageUrls.map((imageUrl, index) => {
    const objectKey = objectKeys[index];
    if (!imageUrl || !objectKey) return imageUrl ?? "";
    return signedUrlsByKey.get(objectKey) ?? "";
  });
}

export async function signDownloadUrl(
  objectKey: string,
  bucket: string,
  fileName: string,
  expiresInSeconds = 60 * 60,
): Promise<string> {
  const { data } = await serverSupabase.storage
    .from(bucket)
    .createSignedUrl(objectKey, expiresInSeconds, { download: fileName });
  return data?.signedUrl ?? "";
}

export async function removeStorageObjects(
  objectKeys: string[],
  bucket: string,
): Promise<void> {
  if (objectKeys.length === 0) return;

  const { error } = await serverSupabase.storage
    .from(bucket)
    .remove(objectKeys);
  if (error) throw error;
}
