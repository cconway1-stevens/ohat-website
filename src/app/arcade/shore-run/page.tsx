import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { ShoreRun } from "@/components/arcade/shore-run";

export const metadata: Metadata = {
  title: "Shore Run — Garage Arcade",
  description: "An endless run down the Shore: jump the tire stacks, duck the traffic signals.",
  alternates: { canonical: "/arcade/shore-run" },
};

export default function ShoreRunPage() {
  return (
    <ArcadeFrame
      slug="shore-run"
      lede="The road never ends and it only gets faster. Hop the stacked tires, duck under the traffic signals, and keep the family sedan in one piece — stay out long enough and the sun goes down."
    >
      <ShoreRun />
    </ArcadeFrame>
  );
}
