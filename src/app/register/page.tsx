import { RegisterForm } from "./register-form";

const reasonMessages: Record<string, string> = {
  "previous-day": "Create an account if you'd like to play previous games.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = reason ? reasonMessages[reason] : undefined;

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <RegisterForm message={message} />
    </main>
  );
}
