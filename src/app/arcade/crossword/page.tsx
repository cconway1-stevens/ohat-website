import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { GarageCrossword } from "@/components/arcade/crossword";

export const metadata: Metadata = {
  title: "Garage Crossword - Garage Arcade",
  description: "A fresh automotive crossword assembled from shop clues every round.",
  alternates: { canonical: "/arcade/crossword" },
};

export default function CrosswordPage() {
  return (
    <ArcadeFrame
      slug="crossword"
      lede="A fresh page every round: shop terms cross in a brand-new grid, with clues straight from the service bays."
    >
      <GarageCrossword />
    </ArcadeFrame>
  );
}
