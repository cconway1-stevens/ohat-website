import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { MakeMatchGame } from "@/components/arcade/make-match-game";

export const metadata: Metadata = {
  title: "Logo Match — Garage Arcade",
  description: "Flip the brand badges and find the matching pairs.",
  alternates: { canonical: "/arcade/logo-match" },
};

export default function LogoMatchPage() {
  return (
    <ArcadeFrame
      slug="logo-match"
      lede="Every round deals a fresh set of badges from the makes we service. No countdown, no pressure — just find the pairs."
    >
      <MakeMatchGame heading="h2" paper />
    </ArcadeFrame>
  );
}
