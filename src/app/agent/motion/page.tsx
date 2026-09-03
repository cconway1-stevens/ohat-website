import type { Metadata } from "next";
import { AgentStudio } from "@/components/agent/agent-studio";

export const metadata: Metadata = {
  title: "Agent · Motion",
  description: "Every emote the pixel crew can play.",
  alternates: { canonical: "/agent/motion" },
  robots: { index: false },
};

export default function AgentMotionPage() {
  return (
    <main>
      <AgentStudio mode="motion" />
    </main>
  );
}
