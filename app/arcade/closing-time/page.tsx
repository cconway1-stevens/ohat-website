import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { ClosingTime } from "@/components/arcade/cozy/closing-time";

export const metadata: Metadata = {
  title: "Closing Time Garage - Garage Arcade",
  description: "Dim the bays, put the carts away and listen to the rain in the Ocean Heights after-hours garage.",
  alternates: { canonical: "/arcade/closing-time" },
};

export default function ClosingTimePage() {
  return (
    <ArcadeFrame
      slug="closing-time"
      lede="A quiet after-hours garage. Dim the bays, roll the tool carts back, pull the door down — or leave it open and listen to the rain. Nothing here is scored."
    >
      <ClosingTime />
    </ArcadeFrame>
  );
}
