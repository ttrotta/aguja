import type { Metadata } from "next";
import { Fraunces, Jost } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["900"],
  style: ["normal"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Aguja",
  description: "A debugger for retrieval systems: chunk a document, run a query, see what ranks.",
};

// Reads the saved theme before paint so there is no flash of the wrong
// theme on load — dark is the product default, light is the opt-in.
const THEME_INIT_SCRIPT = `
  try {
    if (localStorage.getItem("aguja-theme") === "light") {
      document.documentElement.classList.add("light");
    }
  } catch (e) {}
`;

// Only html/body live here. Everything locale-aware — the message provider,
// the navbar, the footer — belongs to `[locale]/layout.tsx`, one level down.
// The lang attribute is the exception: it has to sit on <html>, so the locale
// is read from the request rather than from params this layout never receives.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${fraunces.variable} ${jost.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-page-bg text-text">{children}</body>
    </html>
  );
}
