import { redirect } from "next/navigation";

// The tool suite has no meaningful default view of its own — chunk
// inspection is where every session starts (FR-029).
export default function ToolPage() {
  redirect("/tool/chunks");
}
