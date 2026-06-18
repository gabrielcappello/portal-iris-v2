"use client";
import { useEffect, useRef } from "react";

type Props = {
  src: string;
  title?: string;
  onClose: () => void;
};

export default function VideoModal({ src, title, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fecha com Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Para o vídeo ao fechar
  function handleClose() {
    videoRef.current?.pause();
    onClose();
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 14, overflow: "hidden",
          width: "100%", maxWidth: 720,
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid #f1f5f9",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", fontFamily: "'Sora',sans-serif" }}>
            {title ?? "Tutorial"}
          </span>
          <button
            onClick={handleClose}
            style={{
              width: 30, height: 30, border: "none", background: "#f1f5f9",
              borderRadius: "50%", cursor: "pointer", fontSize: 16, color: "#64748b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "sans-serif",
            }}
          >
            ×
          </button>
        </div>

        {/* Vídeo */}
        <div style={{ background: "#000" }}>
          <video
            ref={videoRef}
            controls
            autoPlay
            width="100%"
            style={{ display: "block", maxHeight: "70vh" }}
          >
            <source src={src} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );
}
