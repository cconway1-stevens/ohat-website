import type { Metadata } from "next";
import { AgentStudio } from "@/components/agent/agent-studio";

export const metadata: Metadata = {
  title: "Agent · Results",
  description: "Every test query, saved locally.",
  alternates: { canonical: "/agent/results" },
  robots: { index: false },
};

export default function AgentResultsPage() {
  return (
    <main>
      <AgentStudio mode="results" />
    </main>
  );
}
