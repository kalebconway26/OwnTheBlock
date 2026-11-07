import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import PhoneFrame from "@/components/PhoneFrame";

const brand = Plus_Jakarta_Sans({ variable: "--font-brand", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OwnTheBlock",
  description: "Own a piece of your block. Fund the glow-up yourselves.",
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: "OwnTheBlock", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#14306b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${brand.variable} h-full antialiased`}>
      <body className="min-h-full">
        <PhoneFrame>{children}</PhoneFrame>
      </body>
    </html>
  );
}
