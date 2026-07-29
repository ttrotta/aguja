import { redirect } from "@/i18n/navigation";

// The tool suite has no meaningful default view of its own — chunk
// inspection is where every session starts (FR-029).
//
// The redirect has to be the locale-aware one. next/navigation's would send
// "/tool/chunks", which the proxy then rescues into the *default* locale — so
// a Spanish visitor asking for /es/tool would land in English (FR-055).
export default async function ToolPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/tool/chunks", locale });
}
