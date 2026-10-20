const encoder = new TextEncoder();
export const SESSION_COOKIE_NAME = "studyos_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export function isAuthConfigured() {
  return Boolean(
    process.env.STUDYOS_PASSWORD?.trim() &&
      (process.env.STUDYOS_SESSION_SECRET?.trim().length ?? 0) >= 32,
  );
}

async function signingKey() {
  const secret = process.env.STUDYOS_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("StudyOS session secret is not configured.");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function createSessionToken() {
  const payload = `v1:${Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS}`;
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token || !isAuthConfigured()) return false;
  const separator = token.lastIndexOf(".");
  if (separator < 0) return false;
  const payload = token.slice(0, separator);
  const signaturePart = token.slice(separator + 1);
  const match = /^v1:(\d{10,})$/.exec(payload);
  if (!match || Number(match[1]) <= Math.floor(Date.now() / 1000)) return false;

  try {
    return await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      fromBase64Url(signaturePart),
      encoder.encode(payload),
    );
  } catch {
    return false;
  }
}

export async function verifyStudyPassword(supplied: string) {
  const expected = process.env.STUDYOS_PASSWORD ?? "";
  const [actualHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(supplied)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const actual = new Uint8Array(actualHash);
  const configured = new Uint8Array(expectedHash);
  let difference = actual.length ^ configured.length;
  for (let index = 0; index < configured.length; index += 1) {
    difference |= actual[index] ^ configured[index];
  }
  return difference === 0 && isAuthConfigured();
}
