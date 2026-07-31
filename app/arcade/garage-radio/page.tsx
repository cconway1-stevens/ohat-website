import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { CozyGarage } from "@/components/arcade/cozy-garage";

export const metadata: Metadata = { title: "Garage Radio - Garage Arcade", description: "A warm garage waiting room and radio dial from the Ocean Heights arcade." };

export default function GarageRadioPage() {
  return <ArcadeFrame slug="garage-radio" lede="A warm waiting room, the low hum of the shop, and a radio dial to keep you company."><CozyGarage scene="garage-radio" /></ArcadeFrame>;
}
