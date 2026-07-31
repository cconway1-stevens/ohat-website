import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { DragStrip } from "@/components/arcade/drag-strip";

export const metadata: Metadata = {
  title: "Drag Strip — Garage Arcade",
  description: "Watch the tree, launch on green — how sharp is your reaction time?",
  alternates: { canonical: "/arcade/drag-strip" },
};

export default function DragStripPage() {
  return (
    <ArcadeFrame
      slug="drag-strip"
      lede="Three ambers, then the green — and the hold before it changes every run. Launch too early and that's a red light, racer."
    >
      <DragStrip />
    </ArcadeFrame>
  );
}
