import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thingr",
  description: "Finding your other sock has never been so easy. School lost & found for parents.",
  robots: { index: false, follow: false },
  applicationName: "Thingr",
  appleWebApp: { capable: true, title: "Thingr", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className="h-full antialiased">
      <body className="min-h-full">
        <main className="mx-auto w-full max-w-xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-32">
          {children}
        </main>
      </body>
    </html>
  );
}
