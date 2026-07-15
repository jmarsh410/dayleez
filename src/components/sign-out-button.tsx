"use client";

import { signOutAction } from "./sign-out-action";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded border border-foreground/20 px-3 py-1.5 text-sm"
      >
        Log out
      </button>
    </form>
  );
}
