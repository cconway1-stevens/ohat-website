import type { Metadata } from "next";
import { AgentStudio } from "@/components/agent/agent-studio";

export const metadata: Metadata = {
  title: "Agent · Options",
  description: "Studio display and motion preferences.",
  alternates: { canonical: "/agent/options" },
  robots: { index: false },
};

export default function AgentOptionsPage() {
  return (
    <main>
      <AgentStudio mode="options" />
    </main>
  );
}
