import { redirect } from "next/navigation";
import { GithubSignInButton } from "~/app/_components/GithubSignInButton";
import { getSession } from "~/server/better-auth/server";

export default async function Home() {
  const session = await getSession();

  if (session?.user) redirect("/app");

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#0b1020] px-4 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-white/70">
          Continue with GitHub to start exploring the map.
        </p>

        <div className="mt-6 flex">
          <GithubSignInButton />
        </div>
      </div>
    </main>
  );
}
