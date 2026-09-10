import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { AgentStudio } from "@/components/agent/agent-studio";
import "@/app/styles/agent.css";

// Scoped here rather than the root layout: this pixel/terminal aesthetic is
// unique to the /agent studio (noindex, internal), and every public page was
// paying for two unused web fonts (render-blocking requests, unused CSS)
// when they lived in the root layout instead.
const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

const pressStart2P = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Agent",
  description: "Blank canvas for testing and building 3D AI agents.",
  alternates: { canonical: "/agent" },
  robots: { index: false },
};

export default function AgentPage() {
  return (
    <main className={`${vt323.variable} ${pressStart2P.variable}`}>
      <AgentStudio mode="character" />
    </main>
  );
}
