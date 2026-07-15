import { verifySession } from "@/lib/dal";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const session = await verifySession();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p>
        Signed in as{" "}
        <span className="font-medium">
          {session.user.name || session.user.email}
        </span>
      </p>
      <SignOutButton />
    </main>
  );
}
