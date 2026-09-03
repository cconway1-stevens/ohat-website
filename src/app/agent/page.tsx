import type { Metadata } from "next";
import { AgentStudio } from "@/components/agent/agent-studio";
import "@/app/styles/agent.css";

export const metadata: Metadata = {
  title: "Agent",
  description: "Blank canvas for testing and building 3D AI agents.",
  alternates: { canonical: "/agent" },
  robots: { index: false },
};

export default function AgentPage() {
  return (
    <main>
      <AgentStudio mode="character" />
    </main>
  );
}
