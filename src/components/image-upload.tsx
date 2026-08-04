"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const C = {
  primary: "#4a6741",
  primaryLight: "#6b8c62",
  primaryGhost: "rgba(74, 103, 65, 0.08)",
  bg: "#faf8f5",
  bgCard: "#ffffff",
  text: "#2d2a26",
  textLight: "#6b6560",
  textMuted: "#9c9590",
  border: "#e8e4df",
  borderLight: "#f0ece7",
};

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUpload({ value = [], onChange, maxFiles = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setError("");

    if (value.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("file", file);
    });

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload");
      }

      onChange([...value, ...data.urls]);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove));
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...value];
    const [dragged] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, dragged);
    onChange(updated);
    setDragIdx(idx);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {value.map((url, idx) => (
          <div
            key={url}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`relative group aspect-square rounded-xl overflow-hidden border transition-all duration-200 ${
              dragIdx === idx ? "opacity-50 scale-95" : ""
            }`}
            style={{
              borderColor: dragIdx === idx ? C.primary : C.border,
              background: C.bg,
              backdropFilter: "blur(8px)",
              boxShadow: dragIdx === idx ? `0 0 0 2px ${C.primaryGhost}` : "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Product preview ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[rgba(45,42,38,0.8)] text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[rgba(45,42,38,0.95)] hover:scale-110"
            >
              <X size={14} />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-[rgba(45,42,38,0.85)] text-[10px] font-medium text-white backdrop-blur-sm">
                Main
              </span>
            )}
          </div>
        ))}

        {value.length < maxFiles && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center p-3 transition-all duration-200 cursor-pointer"
            style={{
              borderColor: C.border,
              background: C.primaryGhost,
              color: C.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.primaryLight;
              e.currentTarget.style.background = "rgba(74, 103, 65, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.background = C.primaryGhost;
            }}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.primary }} />
            ) : (
              <>
                <Upload className="w-5 h-5 mb-1" style={{ color: C.primary }} />
                <span className="text-xs font-medium">Upload</span>
                <span className="text-[10px]" style={{ color: C.textMuted }}>Max {maxFiles}</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleUpload(e.target.files);
          }
        }}
      />

      {error && <p className="text-xs font-medium" style={{ color: "#8b3a3a" }}>{error}</p>}
    </div>
  );
}
