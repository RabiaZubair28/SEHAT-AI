import { createAction } from "@reduxjs/toolkit";

// Handled by the root reducer in ./index.tsx: resets every slice, including all RTK Query caches.
export const resetStore = createAction("store/reset");
