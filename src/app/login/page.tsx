"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <h1 className="text-xl font-semibold">Log in</h1>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded border border-foreground/20 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded border border-foreground/20 bg-transparent px-3 py-2"
          />
        </label>

        {state.error && (
          <p className="text-sm text-red-500" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>

        <p className="text-sm text-foreground/70">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
