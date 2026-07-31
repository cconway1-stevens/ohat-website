import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { CozyGarage } from "@/components/arcade/cozy-garage";

export const metadata: Metadata = { title: "Night Drive Home - Garage Arcade", description: "A calm night drive from the Ocean Heights arcade." };

export default function NightDrivePage() {
  return <ArcadeFrame slug="night-drive" lede="A quiet road, passing lights, and a radio dial. Keep driving for as long as you want."><CozyGarage scene="night-drive" /></ArcadeFrame>;
}
