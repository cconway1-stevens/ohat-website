import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { GarageBlackjack } from "@/components/arcade/garage-blackjack";

export const metadata: Metadata = {
  title: "Garage Blackjack - Garage Arcade",
  description: "A no-money blackjack table from the Ocean Heights service bay.",
  alternates: { canonical: "/arcade/garage-blackjack" },
};

export default function GarageBlackjackPage() {
  return (
    <ArcadeFrame
      slug="garage-blackjack"
      lede="A quick card table from the service bay. Hit or stand, try for 21, and keep every chip imaginary."
    >
      <GarageBlackjack />
    </ArcadeFrame>
  );
}
