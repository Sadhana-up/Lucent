"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { LogOut, User, Mail, X } from "lucide-react";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  accent: "#7C6BEA",
  accentGhost: "rgba(124, 107, 234, 0.08)",
  bg: "#FAFBFC",
  bgWarm: "#F5F3F0",
  bgCard: "#FFFFFF",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
  successFg: "#1E3D2A",
};

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
  };
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await authClient.signOut();
    onClose();
    router.refresh();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(26, 29, 33, 0.4)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm glass-card rounded-3xl overflow-hidden animate-scale-in"
        style={{ border: `1px solid ${C.border}`, boxShadow: `0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <h3 className="text-base font-semibold" style={{ color: C.primary }}>
            Your Profile
          </h3>
          <button
            onClick={onClose}
            className="magnetic-btn w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: C.textMuted }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.primaryGhost; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Section */}
        <div className="px-6 py-6 flex flex-col items-center">
          {/* Avatar with glow ring */}
          {user.image ? (
            <div className="relative">
              <img
                src={user.image}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover"
                style={{
                  border: `3px solid ${C.primary}`,
                  boxShadow: `0 0 0 4px rgba(45, 90, 61, 0.10), 0 0 20px rgba(45, 90, 61, 0.10)`,
                }}
              />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${C.primaryGhost}, rgba(45, 90, 61, 0.10))`,
                border: `3px solid ${C.primary}`,
                boxShadow: `0 0 0 4px rgba(45, 90, 61, 0.10), 0 0 20px rgba(45, 90, 61, 0.10)`,
              }}
            >
              <User size={32} style={{ color: C.primary }} />
            </div>
          )}

          {/* Name */}
          <h4
            className="text-lg font-semibold mt-4"
            style={{ color: C.primary }}
          >
            {user.name}
          </h4>

          {/* Email */}
          <div className="flex items-center gap-2 mt-2">
            <Mail size={14} style={{ color: C.textMuted }} />
            <span className="text-sm" style={{ color: C.textSecondary }}>
              {user.email}
            </span>
          </div>

          {/* Role Badge */}
          {user.role && (
            <Badge
              className="mt-3 text-xs font-medium px-3 py-1 rounded-full border-0"
              style={{
                background: user.role === "seller" ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : C.primaryGhost,
                color: user.role === "seller" ? "#fff" : C.primary,
              }}
            >
              {user.role === "seller" ? "Seller" : "Customer"}
            </Badge>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="px-6 pb-6">
          <Button
            variant="outline"
            className="w-full magnetic-btn text-sm font-medium"
            style={{
              borderColor: C.border,
              color: C.primary,
              background: "transparent",
            }}
            onClick={handleSignOut}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.primaryGhost;
              e.currentTarget.style.borderColor = C.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <LogOut size={14} className="mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
