import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { PartsCounter3D } from "@/components/arcade/parts-counter-3d";

export const metadata: Metadata = {
  title: "Parts Counter 3D - Garage Arcade",
  description:
    "Orbit a 3D auto parts counter: read the ticket, grab the parts off the shelf, and ring up the next customer.",
  alternates: { canonical: "/arcade/parts-counter-3d" },
};

export default function PartsCounter3DPage() {
  return (
    <ArcadeFrame
      slug="parts-counter-3d"
      lede="The parts counter, rebuilt in 3D. Orbit the shelves, click what the ticket asks for, and ring it up — a wrong part just gets handed back."
    >
      <PartsCounter3D />
    </ArcadeFrame>
  );
}
