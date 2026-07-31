import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { ShoreRun } from "@/components/arcade/shore-run";

export const metadata: Metadata = {
  title: "Shore Run — Garage Arcade",
  description: "Dodge the Shore traffic in the family sedan for as many miles as you can.",
  alternates: { canonical: "/arcade/shore-run" },
};

export default function ShoreRunPage() {
  return (
    <ArcadeFrame
      slug="shore-run"
      lede="Summer on the Shore roads: three lanes, plenty of traffic, and a family sedan that handles better than it looks. Arrow keys or taps."
    >
      <ShoreRun />
    </ArcadeFrame>
  );
}
