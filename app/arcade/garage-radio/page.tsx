import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { GarageRadio } from "@/components/arcade/cozy/garage-radio";

export const metadata: Metadata = {
  title: "Garage Radio - Garage Arcade",
  description: "A garage waiting room with a working radio dial and a roomful of things to tap.",
  alternates: { canonical: "/arcade/garage-radio" },
};

export default function GarageRadioPage() {
  return (
    <ArcadeFrame
      slug="garage-radio"
      lede="The customer chair, the window onto the shop, and an hour to fill. Turn the dial and tap anything in the room."
    >
      <GarageRadio />
    </ArcadeFrame>
  );
}
