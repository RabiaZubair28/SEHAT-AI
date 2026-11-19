import React from "react";
import type { FoodItem } from "../types";
import { foodImageUrl } from "./food-image-url";

/** Food picture (food items only); everything else uses EMR line icons. */
export const FoodImage: React.FC<{ food?: FoodItem; size?: number; className?: string }> = ({ food, size = 48, className }) => {
  const [failed, setFailed] = React.useState(false);
  const src = foodImageUrl(food);
  if (!src || failed) {
    // Neutral placeholder so a missing image never leaves a blank gap.
    return (
      <span
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "inline-grid",
          placeItems: "center",
          flexShrink: 0,
          background: "var(--green-50, #f0f7f3)",
          color: "var(--green-700, #0a5d34)",
          fontWeight: 600,
          fontSize: Math.round(size * 0.4),
        }}
        aria-hidden
      >
        {food?.name?.[0] ?? ""}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      onError={() => setFailed(true)}
      className={`na-food-img ${className ?? ""}`}
    />
  );
};
