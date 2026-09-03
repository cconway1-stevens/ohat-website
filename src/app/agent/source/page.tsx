import type { Metadata } from "next";
import { AgentStudio } from "@/components/agent/agent-studio";

export const metadata: Metadata = {
  title: "Agent · Source",
  description: "Read the code behind the brain and the crew.",
  alternates: { canonical: "/agent/source" },
  robots: { index: false },
};

export default function AgentSourcePage() {
  return (
    <main>
      <AgentStudio mode="source" />
    </main>
  );
}
