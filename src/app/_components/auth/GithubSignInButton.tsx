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

        if (res.error) {
          console.error(res.error);
          return;
        }

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
