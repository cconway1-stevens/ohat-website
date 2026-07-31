import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { CozyGarage } from "@/components/arcade/cozy-garage";

export const metadata: Metadata = { title: "The Parts Counter - Garage Arcade", description: "A quiet old-school parts counter from the Ocean Heights arcade." };

export default function PartsCounterPage() {
  return <ArcadeFrame slug="parts-counter" lede="The counter bell, the shelves, and a small moment between repairs."><CozyGarage scene="parts-counter" /></ArcadeFrame>;
}
