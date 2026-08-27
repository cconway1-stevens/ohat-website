import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { GarageGuess } from "@/components/arcade/garage-guess";

export const metadata: Metadata = {
  title: "Garage Guess - Garage Arcade",
  description: "A five-letter automotive word puzzle from the Ocean Heights garage word bank.",
  alternates: { canonical: "/arcade/garage-guess" },
};

export default function GarageGuessPage() {
  return (
    <ArcadeFrame
      slug="garage-guess"
      lede="A shop-word puzzle for the waiting room. Find the five-letter automotive answer in six tries, using the garage keyboard or your own."
    >
      <GarageGuess />
    </ArcadeFrame>
  );
}
