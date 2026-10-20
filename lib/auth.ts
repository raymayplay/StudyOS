import { cookies } from "next/headers";

import { isAuthConfigured, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-crypto";

export async function requireAuthenticatedAction() {
  const cookieStore = await cookies();
  if (!isAuthConfigured() || !(await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value))) {
    throw new Error("Your StudyOS session has expired. Sign in again to continue.");
  }
}

export async function hasValidSession(token: string | undefined) {
  return isAuthConfigured() && verifySessionToken(token);
}
