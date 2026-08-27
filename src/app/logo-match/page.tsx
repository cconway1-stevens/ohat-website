import { redirect } from "next/navigation";

// The single game page grew into the arcade; its old address follows along.
export default function LegacyLogoMatchPage() {
  redirect("/arcade/logo-match");
}
