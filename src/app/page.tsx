import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { SignInForm } from "~/app/_components/auth/SignInForm";

export default async function Home() {
  const session = await getSession();

  if (session?.user) redirect("/app");

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-slate-200 py-8">
      {/* Blurred background image */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-sm"
        style={{ backgroundImage: "url('/sign-in-bg.png')" }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="rounded-xl bg-[#D0EAF5] p-8 shadow-lg">
          <SignInForm />
        </div>
      </div>
    </main>
  );
}
