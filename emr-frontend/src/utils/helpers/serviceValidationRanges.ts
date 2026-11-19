import { InchesToCm } from "./formHelperMethods";

export interface FeetInches {
  feet: number;
  inches: number;
}

export interface ServiceHeightRange {
  inches: { min: number; max: number };
  cm: { min: number; max: number };
  feetInches: { min: FeetInches; max: FeetInches };
}

const inchesToFeetInches = (totalInches: number): FeetInches => ({
  feet: Math.floor(totalInches / 12),
  inches: totalInches % 12,
});

const buildHeightRange = (
  minInches: number,
  maxInches: number,
): ServiceHeightRange => ({
  inches: { min: minInches, max: maxInches },
  cm: { min: InchesToCm(minInches)!, max: InchesToCm(maxInches)! },
  feetInches: {
    min: inchesToFeetInches(minInches),
    max: inchesToFeetInches(maxInches),
  },
});

export const formatFeetInches = (fi: FeetInches): string =>
  `${fi.feet}ft ${fi.inches}in`;

// IMPORTANT: HEIGHT CONSTANTS BELOW ARE MANUALLY SYNCED WITH THE BACKEND.
// IF YOU CHANGE THESE VALUES, UPDATE THE CORRESPONDING ENTRIES IN:
//   emr-backend/src/common/vital-validation.constants.ts
// AND VICE VERSA.
//
// mirrors backend DTO @Min/@Max decorators
export const SERVICE_VALIDATION_RANGES = {
  nutrition: { height: buildHeightRange(16, 96) },
  anc: { height: buildHeightRange(16, 96) },
  pnc: { height: buildHeightRange(16, 96) },
  opd: { height: buildHeightRange(16, 144) },
  vitals: { height: buildHeightRange(16, 144) },
} as const;

export type ServiceName = keyof typeof SERVICE_VALIDATION_RANGES;
