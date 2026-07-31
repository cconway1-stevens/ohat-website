import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { CozyGarage } from "@/components/arcade/cozy-garage";

export const metadata: Metadata = { title: "Sunday Car Wash - Garage Arcade", description: "A slow, sunny car wash from the Ocean Heights arcade." };

export default function SundayWashPage() {
  return <ArcadeFrame slug="sunday-wash" lede="A warm Sunday wash bay with no timer and nowhere else to be."><CozyGarage scene="sunday-wash" /></ArcadeFrame>;
}
