const STORAGE_KEY = "stale-chunk-reloaded-at";
const WINDOW_MS = 10_000;

const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

/** True if THIS document already called reload() (navigation is imminent). */
let initiatedHere = false;

export function isChunkLoadError(error: unknown): boolean {
  return CHUNK_ERROR_RE.test(String((error as Error)?.message ?? error));
}

export function isReloadInFlight(): boolean {
  return initiatedHere;
}

/** Cross-document guard: a reload was attempted in this tab within WINDOW_MS. */
function reloadedRecently(): boolean {
  try {
    const at = Number(sessionStorage.getItem(STORAGE_KEY));
    return at > 0 && Date.now() - at < WINDOW_MS;
  } catch {
    // Storage blocked: behave as "already retried" so we never loop.
    return true;
  }
}

/** Single rule shared by the vite:preloadError listener and the route boundary. */
export function shouldAutoReload(error: unknown): boolean {
  return isChunkLoadError(error) && !initiatedHere && !reloadedRecently();
}

export function markAndReload(): void {
  if (initiatedHere) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage blocked: initiatedHere still guards against a loop.
  }
  initiatedHere = true;
  window.location.reload();
}
