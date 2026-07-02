import React from "react";

// Robur Resources logo mark — stylised "R" in gold/black with wordmark
export default function RoburLogo({ className = "", showText = true, dark = false }) {
  const textColor = dark ? "#FFFFFF" : "#1A1A1A";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 48 48" className="h-9 w-9 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4h20a12 12 0 0 1 4 23.3L44 44H30L18 30v14H6V4z" fill="#1A1A1A" />
        <path d="M6 44V30l8 8-2 6H6zM6 4l14 14H6V4z" fill="#FFC400" />
      </svg>
      {showText && (
        <div className="leading-none">
          <div className="text-lg font-extrabold tracking-tight" style={{ color: textColor }}>
            ROBUR
          </div>
          <div className="text-[9px] font-semibold tracking-[0.35em]" style={{ color: "#FFC400" }}>
            RESOURCES
          </div>
        </div>
      )}
    </div>
  );
}