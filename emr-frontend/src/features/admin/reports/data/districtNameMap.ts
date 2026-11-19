// Maps the district names coming from the backend (DB seed spellings, see the
// "List of facilities, UC, taluka, district and division for EMR" seed file) to
// the `name` property of the features in `sindhDistricts.json` (GADM adm3).
//
// Two kinds of entries live here:
//  1. Spelling/format aliases  — same district, different spelling in the GeoJSON.
//  2. Folded carve-outs        — districts created after the GADM vintage that have
//     no shape of their own; their counts are added onto the parent district they
//     were split from. See the inline notes below.
//
// When the boundary file is upgraded to a finer vintage (one that includes
// Korangi, Keamari, Sujawal, Qambar Shahdadkot as separate shapes), drop the
// corresponding folded entries here — no component changes needed.

// The set of `name` values that actually exist as shapes in sindhDistricts.json.
export const SHAPE_NAMES = [
  "Badin",
  "Dadu",
  "Ghotki",
  "Hyderabad",
  "Jakobabad",
  "Jamshoro",
  "Karachi Central",
  "Karachi East",
  "Karachi South",
  "Karachi west",
  "Kashmore",
  "Khairpur",
  "Larkana",
  "Malir",
  "Matiari",
  "Mirphurkhas",
  "Mithi",
  "Naushahro Firoz",
  "Nawab Shah",
  "Sanghar",
  "Shikarpur",
  "Sukkur",
  "Tando Allahyar",
  "Tando M. Khan",
  "Thatta",
  "Umerkot",
] as const;

export type ShapeName = (typeof SHAPE_NAMES)[number];

// Explicit DB-name -> shape-name overrides. Anything not listed here is matched
// against SHAPE_NAMES directly (case-insensitively).
const DB_TO_SHAPE: Record<string, ShapeName> = {
  // ── Karachi districts present in the GeoJSON ──────────────────────────────
  "Karachi Central": "Karachi Central",
  "Karachi East": "Karachi East",
  "Karachi South": "Karachi South",
  "Karachi West": "Karachi west",
  "Karachi Malir": "Malir",

  // ── Carve-outs folded into their parent district ──────────────────────────
  "Karachi Korangi": "Karachi East", // Korangi was split from Karachi East
  "Karachi Kemari": "Karachi west", // Keamari was split from Karachi West
  Karachi: "Karachi South", // generic "Karachi" -> Karachi (South) proper
  Sujawal: "Thatta", // Sujawal was split from Thatta
  Kamber: "Larkana", // Qambar (Kamber) Shahdadkot was split from Larkana

  // ── Spelling aliases ──────────────────────────────────────────────────────
  Jacobabad: "Jakobabad",
  Mirpurkhas: "Mirphurkhas",
  Tharparkar: "Mithi", // Mithi is the HQ town used by GADM for Tharparkar
  "Naushero Feroz": "Naushahro Firoz",
  "Shaheed Benazirabad": "Nawab Shah",
  "Tando Muhammad Khan": "Tando M. Khan",
};

// Friendly label for each GeoJSON shape (the GADM spellings are messy / odd).
// Used for the on-map labels and the tooltip.
export const DISPLAY_NAME: Record<ShapeName, string> = {
  Badin: "Badin",
  Dadu: "Dadu",
  Ghotki: "Ghotki",
  Hyderabad: "Hyderabad",
  Jakobabad: "Jacobabad",
  Jamshoro: "Jamshoro",
  "Karachi Central": "Karachi Central",
  "Karachi East": "Karachi East",
  "Karachi South": "Karachi South",
  "Karachi west": "Karachi West",
  Kashmore: "Kashmore",
  Khairpur: "Khairpur",
  Larkana: "Larkana",
  Malir: "Malir",
  Matiari: "Matiari",
  Mirphurkhas: "Mirpurkhas",
  Mithi: "Tharparkar",
  "Naushahro Firoz": "Naushero Feroz",
  "Nawab Shah": "Benazirabad",
  Sanghar: "Sanghar",
  Shikarpur: "Shikarpur",
  Sukkur: "Sukkur",
  "Tando Allahyar": "Tando Allahyar",
  "Tando M. Khan": "Tando M. Khan",
  Thatta: "Thatta",
  Umerkot: "Umerkot",
};

const NORMALIZED_SHAPES = new Map<string, ShapeName>(
  SHAPE_NAMES.map((n) => [normalize(n), n]),
);

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Resolve a district name from the backend to the shape `name` it should colour
 * on the map. Returns null when the district can't be matched to any shape (the
 * caller should surface that as "unmapped" rather than silently dropping it).
 */
export function resolveShapeName(dbName: string): ShapeName | null {
  if (!dbName) return null;
  const explicit = DB_TO_SHAPE[dbName.trim()];
  if (explicit) return explicit;
  return NORMALIZED_SHAPES.get(normalize(dbName)) ?? null;
}
