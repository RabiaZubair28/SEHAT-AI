// IMPORTANT: HEIGHT CONSTANTS BELOW ARE MANUALLY SYNCED WITH THE FRONTEND.
// IF YOU CHANGE THESE VALUES, UPDATE THE CORRESPONDING ENTRIES IN:
//   emr-frontend/src/utils/helpers/serviceValidationRanges.ts
// AND VICE VERSA.

// Nutrition height range (inches)
export const NUTRITION_HEIGHT_MIN = 16;
export const NUTRITION_HEIGHT_MAX = 96;

// ANC height range (inches)
export const ANC_HEIGHT_MIN = 16;
export const ANC_HEIGHT_MAX = 96;

// PNC height range (inches)
export const PNC_HEIGHT_MIN = 16;
export const PNC_HEIGHT_MAX = 96;

// OPD height range (inches)
export const OPD_HEIGHT_MIN = 16;
export const OPD_HEIGHT_MAX = 144;

// Vitals height range (inches)
export const VITALS_HEIGHT_MIN = 16;
export const VITALS_HEIGHT_MAX = 144;

// Height validation error message helper — shows range in inches, cm, and feet+inches
const inchesToFeetInches = (totalInches: number) => ({
  feet: Math.floor(totalInches / 12),
  inches: totalInches % 12,
});

export const heightRangeMessage = (minInches: number, maxInches: number): string => {
  const minCm = Math.round(minInches * 2.54);
  const maxCm = Math.round(maxInches * 2.54);
  const minFi = inchesToFeetInches(minInches);
  const maxFi = inchesToFeetInches(maxInches);
  return (
    `Height must be between ${minInches}-${maxInches} inches ` +
    `(${minCm}-${maxCm} cm / ${minFi.feet}ft ${minFi.inches}in - ${maxFi.feet}ft ${maxFi.inches}in)`
  );
};