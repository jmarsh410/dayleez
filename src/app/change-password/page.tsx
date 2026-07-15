import { verifySession } from "@/lib/dal";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  await verifySession();

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <ChangePasswordForm />
    </main>
  );
}
