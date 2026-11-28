import { redirect } from "next/navigation";

export default async function SellerLandingPage() {
  redirect("/seller/dashboard");
}
