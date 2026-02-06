import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  redirect("/app");
}

