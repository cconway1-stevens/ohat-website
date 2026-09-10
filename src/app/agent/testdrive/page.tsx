import type { Metadata } from "next";
import { AgentStudio } from "@/components/agent/agent-studio";

export const metadata: Metadata = {
  title: "Agent · Test Drive",
  description: "Chat with the live agent and rate each answer.",
  alternates: { canonical: "/agent/testdrive" },
  robots: { index: false },
};

export default function AgentTestDrivePage() {
  return (
    <main>
      <AgentStudio mode="testdrive" />
    </main>
  );
}
