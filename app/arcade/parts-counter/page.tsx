import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { PartsCounter } from "@/components/arcade/cozy/parts-counter";

export const metadata: Metadata = {
  title: "The Parts Counter - Garage Arcade",
  description: "Run a small old-school auto parts counter: find the part, bag it, hear the bell.",
  alternates: { canonical: "/arcade/parts-counter" },
};

export default function PartsCounterPage() {
  return (
    <ArcadeFrame
      slug="parts-counter"
      lede="Somebody comes in, asks for a part, and you find it on the shelf behind you. A wrong box just gets a polite correction."
    >
      <PartsCounter />
    </ArcadeFrame>
  );
}
