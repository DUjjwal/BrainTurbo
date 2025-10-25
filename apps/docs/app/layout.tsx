import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "./provider";
const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BrainBoard",
  description: "BrainBoard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Providers>

      <body className={geist.className}>{children}</body>
      </Providers>
    </html>
  );
}
