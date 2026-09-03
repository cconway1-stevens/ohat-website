import type { Metadata } from "next";
import { AgentStudio } from "@/components/agent/agent-studio";

export const metadata: Metadata = {
  title: "Agent · Feedback",
  description: "Your likes and hates — export and hand over.",
  alternates: { canonical: "/agent/feedback" },
  robots: { index: false },
};

export default function AgentFeedbackPage() {
  return (
    <main>
      <AgentStudio mode="feedback" />
    </main>
  );
}
