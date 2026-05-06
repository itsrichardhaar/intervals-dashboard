import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ThemeProvider from "@/components/ThemeProvider";
import { buildFlashScript, DEFAULT_PREFS, type ThemePrefs } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Dashboard",
  description: "Internal project management dashboard",
};

const VALID_THEMES = ["mid", "dark", "light"];

async function getServerPrefs(): Promise<ThemePrefs | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    });
    const raw = user?.preferences as Partial<ThemePrefs> | null | undefined;
    if (!raw || !VALID_THEMES.includes(raw.theme as string)) return null;
    return {
      theme:      raw.theme as ThemePrefs["theme"],
      brightness: typeof raw.brightness === "number" ? raw.brightness : DEFAULT_PREFS.brightness,
      hue:        typeof raw.hue        === "number" ? raw.hue        : DEFAULT_PREFS.hue,
      intensity:  typeof raw.intensity  === "number" ? raw.intensity  : DEFAULT_PREFS.intensity,
    };
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverPrefs = await getServerPrefs();
  const flashScript = buildFlashScript(serverPrefs ?? DEFAULT_PREFS);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Synchronous inline script — applies theme vars before first paint.
            Server prefs are baked in so new-device loads use the correct theme. */}
        <Script
          id="theme-flash-prevention"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: flashScript }}
        />
        <ThemeProvider serverPrefs={serverPrefs}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
