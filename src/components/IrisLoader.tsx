// src/components/IrisLoader.tsx
//
// Loader com o logo do Iris girando (mesmo do app do dentista/celular).
// Reutilizável no painel. Self-contained: define a própria @keyframes.

export default function IrisLoader({ size = 56, overlay = false, label }: {
  size?: number;
  overlay?: boolean;
  label?: string;
}) {
  const spinner = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{
        width: size, height: size, borderRadius: size * 0.3, flexShrink: 0, opacity: 0.5,
        background: "linear-gradient(135deg,#2B7A78,#3AAFA9)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "iris-spin 2.4s linear infinite",
        boxShadow: "0 4px 18px rgba(43,122,120,0.28)",
      }}>
        <svg viewBox="0 0 24 24" style={{ width: size * 0.6, height: size * 0.6 }} fill="white">
          <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
          <circle cx="12" cy="12" r="6" fillOpacity="0.38" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
      {label && <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'Sora',sans-serif" }}>{label}</div>}
      <style>{`@keyframes iris-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (overlay) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {spinner}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
      {spinner}
    </div>
  );
}
