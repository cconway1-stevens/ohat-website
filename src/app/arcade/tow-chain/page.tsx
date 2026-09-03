import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { TowChain } from "@/components/arcade/tow-chain";

export const metadata: Metadata = {
  title: "Tow Chain — Garage Arcade",
  description: "Run the tow truck around the lot — every stranded car makes the chain longer.",
  alternates: { canonical: "/arcade/tow-chain" },
};

export default function TowChainPage() {
  return (
    <ArcadeFrame
      slug="tow-chain"
      lede="A busy day at the lot: hook every stranded car, and mind the fence — the chain behind you only gets longer. Arrows or swipe."
    >
      <TowChain />
    </ArcadeFrame>
  );
}
