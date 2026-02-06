"use client";

import { authClient } from "~/server/better-auth/client";

export function GithubSignInButton() {
  return (
    <button
      className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
      onClick={async () => {
        const res = await authClient.signIn.social({
          provider: "github",
          callbackURL: "/app",
        });

        // better-fetch response shape: either { data, error: null } or { data: null, error }
        if (res.error) {
          console.error(res.error);
          return;
        }

        // If redirect plugin runs, it will navigate automatically when {redirect:true,url:string}.
        // This is just a safety net.
        if (res.data?.url && typeof window !== "undefined") {
          window.location.href = res.data.url;
        }
      }}
      type="button"
    >
      Sign in with Github
    </button>
  );
}