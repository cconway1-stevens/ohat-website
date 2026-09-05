import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { Radio3D } from "@/components/arcade/radio-3d";

export const metadata: Metadata = {
  title: "Chrome De Luxe 3D - Garage Arcade",
  description:
    "A 1950s chrome dash radio in 3D: turn the knobs, ride the needle through the static, and hold a piano key to save a preset.",
  alternates: { canonical: "/arcade/radio-3d" },
};

export default function Radio3DPage() {
  return (
    <ArcadeFrame
      slug="radio-3d"
      lede="The dash radio, rebuilt in 3D. Drag the tuning knob or the dial glass itself, push the left knob for power, push the right to change bands — local stations plus a live band of real streams."
    >
      <Radio3D />
    </ArcadeFrame>
  );
}
