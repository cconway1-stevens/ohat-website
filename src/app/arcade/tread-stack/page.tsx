import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { TreadStack } from "@/components/arcade/tread-stack";

export const metadata: Metadata = {
  title: "Tread Stack - Garage Arcade",
  description: "A tire-shop falling-block puzzle from the Ocean Heights garage arcade.",
  alternates: { canonical: "/arcade/tread-stack" },
};

export default function TreadStackPage() {
  return (
    <ArcadeFrame
      slug="tread-stack"
      lede="The tire truck is unloading fast. Turn each load, fill the rack, and clear complete rows before the stack reaches the rafters."
    >
      <TreadStack />
    </ArcadeFrame>
  );
}
