import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { CozyGarage } from "@/components/arcade/cozy-garage";

export const metadata: Metadata = { title: "Closing Time Garage - Garage Arcade", description: "A quiet after-hours garage scene from the Ocean Heights arcade." };

export default function ClosingTimePage() {
  return <ArcadeFrame slug="closing-time" lede="A quiet after-hours garage scene. There is nothing to win - just settle in and tap what catches your eye."><CozyGarage scene="closing-time" /></ArcadeFrame>;
}
