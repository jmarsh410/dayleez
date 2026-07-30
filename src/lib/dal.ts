import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
});

export const getOptionalSession = cache(async () => {
  return (await auth()) ?? null;
});

export const verifySessionOrRedirectToSignUp = cache(async () => {
  const session = await auth();
  if (!session?.user) redirect("/register?reason=previous-day");
  return session;
});
