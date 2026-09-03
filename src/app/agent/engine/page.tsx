import type { Metadata } from "next";
import { AgentStudio } from "@/components/agent/agent-studio";

export const metadata: Metadata = {
  title: "Agent · Engine",
  description: "What the brain runs on, and how backends compare.",
  alternates: { canonical: "/agent/engine" },
  robots: { index: false },
};

export default function AgentEnginePage() {
  return (
    <main>
      <AgentStudio mode="engine" />
    </main>
  );
}
