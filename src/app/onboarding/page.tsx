import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/onboarding");
  }

  const user = session.user as { role?: string; onboardingCompleted?: boolean };
  if (user.role === "seller") {
    redirect("/seller/profile");
  }
  if (user.role === "admin") {
    redirect("/admin");
  }
  if (user.onboardingCompleted) {
    redirect("/shop");
  }

  return <OnboardingClient />;
}
