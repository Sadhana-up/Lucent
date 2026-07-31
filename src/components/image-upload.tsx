"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUpload({ value = [], onChange, maxFiles = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {value.map((url, idx) => (
          <div
            key={url}
            className="relative group aspect-square rounded-xl overflow-hidden border border-pink-200 bg-pink-50/50"
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
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-rose-900/90 text-[10px] font-medium text-white">
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
            className="aspect-square rounded-xl border border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/30 hover:bg-pink-50 flex flex-col items-center justify-center p-3 text-pink-900 transition-all cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-rose-800" />
            ) : (
              <>
                <Upload className="w-5 h-5 mb-1 text-rose-800" />
                <span className="text-xs font-medium">Upload</span>
                <span className="text-[10px] text-stone-500">Max {maxFiles}</span>
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

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
