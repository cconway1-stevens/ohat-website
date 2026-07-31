import { redirect } from "next/navigation";

// The reaction game was replaced by the garage crossword. Keep old bookmarks
// and shared links useful instead of leaving a dead arcade cabinet.
export default function LegacyDragStripPage() {
  redirect("/arcade/crossword");
}
