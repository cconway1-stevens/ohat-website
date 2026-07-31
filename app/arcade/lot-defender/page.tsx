import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { LotDefender } from "@/components/arcade/lot-defender";

export const metadata: Metadata = {
  title: "Lot Defender - Garage Arcade",
  description:
    "Run the magnet sweeper along the shop lot and clear the falling hardware before it reaches the parked cars.",
  alternates: { canonical: "/arcade/lot-defender" },
};

export default function LotDefenderPage() {
  return (
    <ArcadeFrame
      slug="lot-defender"
      lede="Nails, bolts and screws drifting down onto the cars parked out back. You have the magnet sweeper and the bottom line — pick three intensities and hold the lot."
    >
      <LotDefender />
    </ArcadeFrame>
  );
}
