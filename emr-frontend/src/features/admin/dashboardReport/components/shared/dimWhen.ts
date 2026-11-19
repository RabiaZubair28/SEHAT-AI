import type React from "react";

export const dimWhen = (active: boolean): React.CSSProperties => ({
  opacity: active ? 0.6 : 1,
  transition: "opacity 0.2s",
});
