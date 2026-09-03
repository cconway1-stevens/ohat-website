import type { Metadata } from "next";
import { AgentStudio } from "@/components/agent/agent-studio";

export const metadata: Metadata = {
  title: "Agent · Brain",
  description: "Ask questions and see why the brain answers the way it does.",
  alternates: { canonical: "/agent/brain" },
  robots: { index: false },
};

export default function AgentBrainPage() {
  return (
    <main>
      <AgentStudio mode="brain" />
    </main>
  );
}
