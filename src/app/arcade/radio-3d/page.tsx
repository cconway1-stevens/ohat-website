import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { Radio3D } from "@/components/arcade/radio-3d";

export const metadata: Metadata = {
  title: "Chrome De Luxe - Garage Arcade",
  description:
    "A cherry-red 1957 Chevy dash radio: drag the dial or the knobs, push PWR, and hold a piano key to save a preset — local stations plus a live band of real streams.",
  alternates: { canonical: "/arcade/radio-3d" },
};

export default function Radio3DPage() {
  return (
    <ArcadeFrame
      slug="radio-3d"
      lede="A cherry-red '57 Chevy dash radio. Drag the dial — or the tuning knob — push PWR, change bands, and hold a piano key to save a preset. Local stations plus a live band of real streams."
    >
      <Radio3D />
    </ArcadeFrame>
  );
}
