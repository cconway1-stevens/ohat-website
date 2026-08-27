import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { NightDrive } from "@/components/arcade/cozy/night-drive";

export const metadata: Metadata = {
  title: "Night Drive Home - Garage Arcade",
  description: "A calm endless night drive with a working radio, heater and changing weather.",
  alternates: { canonical: "/arcade/night-drive" },
};

export default function NightDrivePage() {
  return (
    <ArcadeFrame
      slug="night-drive"
      lede="The Parkway at night with nothing at the end of it. Tune the radio, set the heater, and let the weather come and go."
    >
      <NightDrive />
    </ArcadeFrame>
  );
}
