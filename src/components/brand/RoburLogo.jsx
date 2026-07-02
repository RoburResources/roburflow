import React from "react";

// Official Robur Resources brand assets.
// `dark` = for use on dark backgrounds (renders the white/gold variant).
const HORIZONTAL_LIGHT = "https://media.base44.com/images/public/6a45ec89b86612f7554c9e39/5f620fa65_01_primary_horizontal_light_transparent.png";
const HORIZONTAL_DARK = "https://media.base44.com/images/public/6a45ec89b86612f7554c9e39/71b5125fc_03_primary_horizontal_dark_transparent.png";
const ICON_LIGHT = "https://media.base44.com/images/public/6a45ec89b86612f7554c9e39/34773dd1d_09_r_icon_light_transparent.png";
const ICON_DARK = "https://media.base44.com/images/public/6a45ec89b86612f7554c9e39/9d97711dd_11_r_icon_dark_transparent.png";

export default function RoburLogo({ className = "", showText = true, dark = false }) {
  const src = showText
    ? (dark ? HORIZONTAL_DARK : HORIZONTAL_LIGHT)
    : (dark ? ICON_DARK : ICON_LIGHT);

  return (
    <img
      src={src}
      alt="Robur Resources"
      className={`${showText ? "h-8" : "h-9"} w-auto object-contain ${className}`}
    />
  );
}