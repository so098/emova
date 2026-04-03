const PREFIX = "q:";

function toBase64url(str: string): string {
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(str).toString("base64")
      : btoa(str);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64url(slug: string): string {
  const padded = slug.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = padded.length % 4;
  const padding = remainder === 0 ? "" : "=".repeat(4 - remainder);
  const b64 = padded + padding;
  return typeof Buffer !== "undefined"
    ? Buffer.from(b64, "base64").toString("utf-8")
    : atob(b64);
}

export function encodeQuestionSlug(index: number): string {
  return toBase64url(`${PREFIX}${index}`);
}

export function decodeQuestionSlug(slug: string): number | null {
  try {
    const decoded = fromBase64url(slug);
    if (!decoded.startsWith(PREFIX)) return null;
    const index = parseInt(decoded.slice(PREFIX.length));
    return isNaN(index) ? null : index;
  } catch {
    return null;
  }
}
