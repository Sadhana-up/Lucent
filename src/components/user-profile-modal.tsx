"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { LogOut, User, Mail, X } from "lucide-react";

const C = {
  primary: "#4a6741",
  primaryLight: "#6b8c62",
  primaryDark: "#3a5233",
  primaryGhost: "rgba(74, 103, 65, 0.08)",
  primaryGlow: "rgba(74, 103, 65, 0.15)",
  accent: "#c4956a",
  accentLight: "#d4b08f",
  accentGhost: "rgba(196, 149, 106, 0.10)",
  bg: "#faf8f5",
  bgWarm: "#f5f0eb",
  bgCard: "#ffffff",
  text: "#2d2a26",
  textLight: "#6b6560",
  textMuted: "#9c9590",
  border: "#e8e4df",
  borderLight: "#f0ece7",
  successFg: "#3a5233",
  successBg: "#e8f0e6",
  warnFg: "#78350f",
  warnBg: "#FEF3C7",
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
      style={{ background: "rgba(45, 42, 38, 0.4)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm glass-card rounded-3xl overflow-hidden animate-scale-in"
        style={{ border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <h3 className="text-base font-medium" style={{ color: C.primary }}>
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
                  boxShadow: `0 0 0 4px ${C.primaryGlow}, 0 0 20px ${C.primaryGlow}`,
                }}
              />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${C.primaryGhost}, ${C.primaryGlow})`,
                border: `3px solid ${C.primary}`,
                boxShadow: `0 0 0 4px ${C.primaryGlow}, 0 0 20px ${C.primaryGlow}`,
              }}
            >
              <User size={32} style={{ color: C.primary }} />
            </div>
          )}

          {/* Name */}
          <h4
            className="text-lg font-medium mt-4"
            style={{ color: C.primary }}
          >
            {user.name}
          </h4>

          {/* Email */}
          <div className="flex items-center gap-2 mt-2">
            <Mail size={14} style={{ color: C.textMuted }} />
            <span className="text-sm" style={{ color: C.textLight }}>
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
