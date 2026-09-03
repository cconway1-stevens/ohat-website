import type { Metadata } from "next";
import { AdgentStudio } from "@/components/adgent/adgent-studio";

export const metadata: Metadata = {
  title: "Adgent",
  description: "Blank canvas for testing and building 3D AI agents.",
  alternates: { canonical: "/adgent" },
  robots: { index: false },
};

export default function AdgentPage() {
  return (
    <main>
      <AdgentStudio />
    </main>
  );
}
