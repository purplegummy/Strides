import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Strides",
  description: "Explore your city, one tile at a time.",
  icons: [
    { rel: "icon", url: "/icons8-walking-cloud-32.png", sizes: "32x32", type: "image/png" },
    { rel: "icon", url: "/icons8-walking-cloud-96.png", sizes: "96x96", type: "image/png" },
    { rel: "apple-touch-icon", url: "/icons8-walking-cloud-57.png", sizes: "57x57" },
    { rel: "apple-touch-icon", url: "/icons8-walking-cloud-60.png", sizes: "60x60" },
    { rel: "apple-touch-icon", url: "/icons8-walking-cloud-72.png", sizes: "72x72" },
    { rel: "apple-touch-icon", url: "/icons8-walking-cloud-76.png", sizes: "76x76" },
  ],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
