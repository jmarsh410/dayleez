import Link from "next/link";
import { auth } from "@/auth";
import { FlyoutMenu } from "./flyout-menu";
import { SignOutButton } from "./sign-out-button";

export async function Nav() {
  const session = await auth();

  return (
    <nav className="flex items-center justify-between border-b border-foreground/10 px-6 py-4">
      <Link href="/" className="font-semibold">
        dayleez
      </Link>

      {session?.user ? (
        <div className="flex items-center gap-4 text-sm">
          <FlyoutMenu
            label="Games"
            items={[
              { href: "/miner", label: "Miner" },
              { href: "/digout", label: "Digout" },
            ]}
          />
          <FlyoutMenu
            label="Account"
            items={[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/change-password", label: "Change password" },
            ]}
          />
          <SignOutButton />
        </div>
      ) : (
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login">Log in</Link>
          <Link href="/register">Sign up</Link>
        </div>
      )}
    </nav>
  );
}
