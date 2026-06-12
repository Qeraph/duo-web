import type {
  FormState,
  EstimateResult,
  PropertyType,
  PropertyState,
  BuildType,
  FinishLevel,
  WallType,
  VisibleFields,
} from './types';

// ─── Rate tables ──────────────────────────────────────────────────────────────
// All figures in AUD. Adjust these values to recalibrate outputs.

// Base construction cost per m² by property type (2025 national average)
const BASE_RATE_PER_SQM: Record<PropertyType, number> = {
  house:       1560,
  granny_flat: 1615,
  townhouse:   1665,
  apartment:   1410,
  office:       940,
  warehouse:    590,
};

// Labour and material cost index by state, relative to national baseline (1.00)
const STATE_MULTIPLIER: Record<PropertyState, number> = {
  NSW: 1.10,
  VIC: 1.05,
  QLD: 0.98,
  SA:  0.95,
  WA:  1.00,
  TAS: 0.92,
  ACT: 1.12,
  NT:  1.06,
};

// Complexity premium by build type
const BUILD_TYPE_MULTIPLIER: Record<BuildType, number> = {
  new_build:         1.00,
  knockdown_rebuild: 1.08,
  extension:         1.18,
};

// Fitout and specification multiplier
const FINISH_MULTIPLIER: Record<FinishLevel, number> = {
  standard:  1.00,
  mid_range: 1.28,
  luxury:    1.65,
};

// Additional cost per m² for wall construction type
const WALL_PREMIUM_PER_SQM: Record<WallType, number> = {
  brick_veneer: 0,
  double_brick: 155,
  lightweight:  -80,
  hebel:         55,
};

// Fixed addon costs (AUD), independent of floor area
const ADDON_COSTS = {
  basement:            85_000,
  elevator:            55_000,
  mezzanine:           32_000,
  ductedAirConditioning: 14_000,
} as const;

// ─── Year adjustment ──────────────────────────────────────────────────────────
// Rates above represent 2025 costs. For earlier completion years the cost was
// lower; for future years, higher. Rates compound per year.

const BASE_YEAR = 2025;
const ANNUAL_DEFLATION = 0.030; // cost reduction per year before base year
const ANNUAL_INFLATION  = 0.040; // cost increase per year after base year

function yearFactor(completionYear: number): number {
  const delta = completionYear - BASE_YEAR;
  if (delta < 0) return Math.pow(1 - ANNUAL_DEFLATION, Math.abs(delta));
  if (delta > 0) return Math.pow(1 + ANNUAL_INFLATION,  delta);
  return 1;
}

// ─── Bedroom adjustment ───────────────────────────────────────────────────────
// More bedrooms imply proportionally more wet areas and joinery, modestly
// increasing cost per m² beyond what floor area alone captures.

function bedroomFactor(bedrooms: number): number {
  if (bedrooms <= 2) return 1.00;
  if (bedrooms === 3) return 1.02;
  if (bedrooms === 4) return 1.04;
  return 1.06; // 5+
}

// ─── Floor count adjustment ───────────────────────────────────────────────────

function floorFactor(floors: number): number {
  if (floors <= 1) return 1.00;
  if (floors === 2) return 1.06;
  return 1.12; // 3+
}

// ─── All-visible sentinel used when called without explicit visibility ─────────

const ALL_VISIBLE: VisibleFields = {
  bedrooms: true, wallType: true, basement: true, elevator: true, mezzanine: true,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns null when required visible fields are missing or invalid.
 * Returns a low/mid/high range when all visible inputs are present.
 * The range is ±15% around the midpoint estimate.
 *
 * Pass `visible` (from getVisibleFields) so hidden fields are neither
 * validated nor included in the calculation.
 */
export function calculateEstimate(form: FormState, visible: VisibleFields = ALL_VISIBLE): EstimateResult | null {
  const {
    investmentPropertyType,
    constructionCompletionYear,
    investmentPropertyState,
    buildType,
    finishLevel,
    floorArea,
    bedrooms,
    numberOfFloors,
    wallType,
    basement,
    elevator,
    mezzanine,
    ductedAirConditioning,
  } = form;

  // Validate always-required fields
  if (
    !investmentPropertyType ||
    !investmentPropertyState ||
    !buildType ||
    !finishLevel ||
    floorArea === '' ||
    numberOfFloors === '' ||
    constructionCompletionYear === ''
  ) {
    return null;
  }

  // Validate conditionally-visible fields
  if (visible.wallType && !wallType) return null;
  if (visible.bedrooms && bedrooms === '') return null;

  const area   = Number(floorArea);
  const floors = Number(numberOfFloors);
  const year   = Number(constructionCompletionYear);

  if (area <= 0 || floors <= 0) return null;

  // Bedroom count: only meaningful when the field is visible
  const beds = visible.bedrooms ? Number(bedrooms) : 2; // 2 → factor 1.00 (neutral)
  if (visible.bedrooms && beds <= 0) return null;

  // Step-by-step cost build-up (easy to trace and adjust)
  const basePerSqm = BASE_RATE_PER_SQM[investmentPropertyType];
  const stateAdj   = basePerSqm * STATE_MULTIPLIER[investmentPropertyState];
  const buildAdj   = stateAdj   * BUILD_TYPE_MULTIPLIER[buildType];
  const finishAdj  = buildAdj   * FINISH_MULTIPLIER[finishLevel];
  const floorAdj   = finishAdj  * floorFactor(floors);

  // Bedroom factor only applies when the field is visible
  const bedroomAdj = visible.bedrooms ? floorAdj * bedroomFactor(beds) : floorAdj;
  const floorCost  = bedroomAdj * area;

  // Wall premium only applies when the field is visible
  const wallPremium = visible.wallType ? WALL_PREMIUM_PER_SQM[wallType as WallType] * area : 0;

  // Addon costs conditioned on field visibility
  const addonTotal =
    (visible.basement  && basement             ? ADDON_COSTS.basement             : 0) +
    (visible.elevator  && elevator             ? ADDON_COSTS.elevator             : 0) +
    (visible.mezzanine && mezzanine            ? ADDON_COSTS.mezzanine            : 0) +
    (ductedAirConditioning                     ? ADDON_COSTS.ductedAirConditioning: 0);

  const subtotal = floorCost + wallPremium + addonTotal;
  const mid      = Math.round(subtotal * yearFactor(year));
  const low      = Math.round(mid * 0.85);
  const high     = Math.round(mid * 1.15);

  return { low, mid, high };
}
