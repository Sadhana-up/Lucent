import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Store, LayoutDashboard, Package, ShoppingBag, Settings, ArrowRight, Leaf } from "lucide-react";

export default async function SellerLandingPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/seller");
  }

  const user = session.user;
  const userRole = (user as { role?: string })?.role;
  if (userRole !== "seller" && userRole !== "admin") {
    redirect("/");
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const quickLinks = [
    { label: "Go to Dashboard", href: "/seller/dashboard", icon: LayoutDashboard, primary: true },
    { label: "Manage Products", href: "/seller/products", icon: Package },
    { label: "View Orders", href: "/seller/orders", icon: ShoppingBag },
    { label: "Store Settings", href: "/seller/profile", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FAFBFC" }}>
      <div className="w-full max-w-lg">
        <div
          className="rounded-2xl overflow-hidden animate-fade-in-up"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid #F0F1F3",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {/* Header */}
          <div
            className="p-8 text-center"
            style={{
              background: "linear-gradient(135deg, #2D5A3D, #3D7A52)",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              >
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">Lucent</span>
            </div>

            {/* Profile Icon */}
            <div className="relative inline-block mb-4">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name || "Seller"}
                  className="w-20 h-20 rounded-full object-cover"
                  style={{ border: "3px solid rgba(255,255,255,0.3)" }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.3)" }}
                >
                  {initials}
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
              >
                <Store size={12} style={{ color: "#2D5A3D" }} />
              </div>
            </div>

            <h1 className="text-xl font-semibold text-white mb-1">
              Welcome back, {user.name?.split(" ")[0] || "Seller"}
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              Manage your store from the Seller Hub
            </p>
          </div>

          {/* Quick Links */}
          <div className="p-6 space-y-2.5">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group"
                  style={{
                    background: link.primary ? "linear-gradient(135deg, #2D5A3D, #3D7A52)" : "rgba(45, 90, 61, 0.04)",
                    color: link.primary ? "#fff" : "#1A1D21",
                    boxShadow: link.primary ? "0 4px 16px rgba(45, 90, 61, 0.2)" : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} style={{ color: link.primary ? "rgba(255,255,255,0.8)" : "#2D5A3D" }} />
                    <span>{link.label}</span>
                  </div>
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                    style={{ color: link.primary ? "rgba(255,255,255,0.7)" : "#9CA3AF" }}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
