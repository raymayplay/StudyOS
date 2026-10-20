"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSessionToken,
  isAuthConfigured,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  verifyStudyPassword,
} from "@/lib/auth-crypto";
import { checkRateLimit } from "@/lib/rate-limit";

export async function loginAction(_previousState: string, formData: FormData): Promise<string> {
  if (!isAuthConfigured()) return "Authentication is not configured. Set STUDYOS_PASSWORD and a 32-character STUDYOS_SESSION_SECRET, then restart StudyOS.";
  if (!checkRateLimit("studyos-login", 10, 15 * 60_000).allowed) {
    return "Too many sign-in attempts. Wait 15 minutes and try again.";
  }

  const password = String(formData.get("password") || "").slice(0, 1024);
  if (!(await verifyStudyPassword(password))) return "That password is incorrect.";

  const requestHeaders = await headers();
  const secure =
    process.env.STUDYOS_COOKIE_SECURE === "true" ||
    requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
