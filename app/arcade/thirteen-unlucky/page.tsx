import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { ThirteenUnlucky } from "@/components/arcade/thirteen-unlucky";

export const metadata: Metadata = {
  title: "13 Unlucky - Garage Arcade",
  description: "Pick three lucky garage cards, but avoid the unlucky flat tire.",
  alternates: { canonical: "/arcade/thirteen-unlucky" },
};

export default function ThirteenUnluckyPage() {
  return (
    <ArcadeFrame
      slug="thirteen-unlucky"
      lede="A very small luck test from the waiting room. Pick three garage cards without finding the flat tire."
    >
      <ThirteenUnlucky />
    </ArcadeFrame>
  );
}
