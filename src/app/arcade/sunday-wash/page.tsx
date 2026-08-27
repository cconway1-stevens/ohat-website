import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/arcade/arcade-frame";
import { SundayWash } from "@/components/arcade/cozy/sunday-wash";

export const metadata: Metadata = {
  title: "Sunday Car Wash - Garage Arcade",
  description: "Spray, foam, rinse, dry and shine whatever rolls into the Ocean Heights wash bay.",
  alternates: { canonical: "/arcade/sunday-wash" },
};

export default function SundayWashPage() {
  return (
    <ArcadeFrame
      slug="sunday-wash"
      lede="Spray, foam, rinse, dry, tire shine. Whatever rolls into the bay gets the full five passes, and there is no clock on any of it."
    >
      <SundayWash />
    </ArcadeFrame>
  );
}
