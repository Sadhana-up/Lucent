"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { LogOut, User, Mail, X } from "lucide-react";

const C = {
  primary: "#831843",
  active: "#BE185D",
  blush: "#EC4899",
  petal: "#FBCFE8",
  mist: "#FDF2F8",
  ink: "#1C1917",
  smoke: "#44403C",
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
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "#fff", border: `0.5px solid ${C.petal}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: `0.5px solid ${C.petal}` }}
        >
          <h3 className="text-base font-medium" style={{ color: C.primary }}>
            Your Profile
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: C.smoke }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.mist)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Section */}
        <div className="px-6 py-6 flex flex-col items-center">
          {/* Avatar */}
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover"
              style={{ border: `3px solid ${C.petal}` }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: C.mist, border: `3px solid ${C.petal}` }}
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
            <Mail size={14} style={{ color: C.smoke }} />
            <span className="text-sm" style={{ color: C.smoke }}>
              {user.email}
            </span>
          </div>

          {/* Role Badge */}
          {user.role && (
            <Badge
              className="mt-3 text-xs font-medium px-3 py-1 rounded-full border-0"
              style={{
                background: user.role === "seller" ? C.primary : C.petal,
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
            className="w-full text-sm font-medium"
            style={{
              borderColor: C.petal,
              color: C.primary,
              background: "transparent",
            }}
            onClick={handleSignOut}
          >
            <LogOut size={14} className="mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
