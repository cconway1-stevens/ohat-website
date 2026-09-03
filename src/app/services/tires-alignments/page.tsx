import { redirect } from "next/navigation";

// The combined tires-and-alignments page was split into /services/tires and
// /services/wheel-alignment because they answer different search intents.
export default function LegacyTiresAlignmentsPage() {
  redirect("/services/tires");
}
