import type { ReactNode } from "react";
import { Navbar } from "../_components/Navbar";
import { ToolSessionProvider } from "./_components/ToolSession";
import { ToolSidebar } from "./_components/ToolSidebar";

// One floating panel for the whole suite (DESIGN.md: "the entire app lives
// inside one floating panel"). ToolSidebar is that panel's leftmost strip,
// not a second panel beside it; each tool renders its own content to the
// right of it, inside the same fixed-height, internally-scrolling shell the
// v1 debugger already used.
export default function ToolLayout({ children }: { children: ReactNode }) {
  return (
    <ToolSessionProvider>
      <div className="flex min-h-full flex-col md:h-dvh md:overflow-hidden">
        <Navbar />
        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-6 md:min-h-0 md:px-8 md:py-10">
          <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-text/10 bg-panel-bg shadow-[0_24px_64px_-12px_rgba(0,0,0,0.55)] md:min-h-0 md:flex-row">
            <ToolSidebar />
            <div className="flex flex-1 flex-col md:min-h-0">{children}</div>
          </div>
        </main>
      </div>
    </ToolSessionProvider>
  );
}
