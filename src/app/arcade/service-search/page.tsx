import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { ServiceSearch } from "@/components/arcade/service-search";

export const metadata: Metadata = {
  title: "Service Search - Garage Arcade",
  description: "A quick automotive word search styled like the morning motoring page.",
  alternates: { canonical: "/arcade/service-search" },
};

export default function ServiceSearchPage() {
  return (
    <ArcadeFrame
      slug="service-search"
      lede="Circle the hidden shop words across, down, backward, and diagonally. Each new paper gets a different grid."
    >
      <ServiceSearch />
    </ArcadeFrame>
  );
}
