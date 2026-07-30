"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export function RegisterForm({ message }: { message?: string }) {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold">Create an account</h1>

      {message && (
        <p className="text-sm text-foreground/70" role="status">
          {message}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          type="text"
          autoComplete="name"
          className="rounded border border-foreground/20 bg-transparent px-3 py-2"
        />
      </label>

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
          minLength={8}
          autoComplete="new-password"
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
        {pending ? "Creating account…" : "Sign up"}
      </button>

      <p className="text-sm text-foreground/70">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
