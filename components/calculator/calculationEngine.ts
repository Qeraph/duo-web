import type {
  FormState,
  EstimateResult,
  PropertyType,
  PropertyState,
  WallType,
  VisibleFields,
} from './types';

// ─── Verified source rate tables ──────────────────────────────────────────────

// Base construction cost per m² by property type — verified from source
const PROPERTY_BASE: Record<PropertyType, number> = {
  house:       1560,
  granny_flat: 1615,
  townhouse:   1665,
  apartment:   1410,
  office:       940,
  warehouse:    590,
};

// Wall type per-m² adjustment — verified from source
const WALL_POINTS: Record<WallType, number> = {
  brick_veneer: 140,
  double_brick: 180,
  concrete:     220,
};

// Per-m² add-on rates — verified from source
const ADDON_RATE = {
  basement:  105,
  mezzanine: 120,
  ducted:    255,
} as const;

// ─── Building Cost Index (BCI) ────────────────────────────────────────────────
// Per-state BCI table — 40 entries per state.
// Index mapping (see bciIndexForYear):
//   0  → "< Sept 1987"
//   1  → "Sept 1987"  (also 1988: 1988 − 1987 = 1)
//   2  → 1989
//   3  → 1990
//   …
//   39 → 2026 and beyond (capped)

const BCI: Record<PropertyState, number[]> = {
  ACT: [
    0, 0.4864, 0.5179, 0.5459, 0.5879, 0.6089, 0.6159, 0.6124, 0.6124,
    0.6177, 0.6387, 0.6562, 0.6597, 0.6684, 0.6754, 0.6877, 0.7017,
    0.7419, 0.7871, 0.8322, 0.8933, 0.9484, 1.0009, 1.0219, 1.0297,
    1.0569, 1.0831, 1.0954, 1.1164, 1.1479, 1.168,  1.1925, 1.2178,
    1.2581, 1.2992, 1.3403, 1.4024, 1.4706, 1.5416, 1.6098, 1.6737,
  ],
  NSW: [
    0, 0.4147, 0.4637, 0.5004, 0.5337, 0.5284, 0.5109, 0.5144, 0.5144,
    0.5389, 0.5512, 0.5599, 0.5687, 0.5862, 0.6177, 0.6247, 0.6422,
    0.6719, 0.7024, 0.7328, 0.7725, 0.8058, 0.8434, 0.8521, 0.8548,
    0.867,  0.8854, 0.8985, 0.9169, 0.9545, 1.0,    1.0157, 1.056,
    1.1006, 1.1531, 1.1776, 1.2397, 1.3158, 1.3727, 1.4593, 1.5241,
  ],
  NT: [
    0, 0.3815, 0.4129, 0.4427, 0.4707, 0.4969, 0.5039, 0.5074, 0.5144,
    0.5214, 0.5442, 0.5582, 0.5669, 0.5739, 0.5949, 0.6124, 0.6282,
    0.6544, 0.6985, 0.7426, 0.8058, 0.86,   0.9186, 0.9484, 0.9755,
    0.9895, 0.972,  0.965,  0.9746, 0.9904, 0.9974, 1.0184, 1.0464,
    1.0761, 0.9858, 1.0386, 1.1401, 1.2102, 1.2724, 1.3598, 1.4307,
  ],
  QLD: [
    0, 0.3535, 0.3867, 0.4322, 0.4637, 0.4584, 0.4444, 0.4497, 0.4567,
    0.4777, 0.4532, 0.4584, 0.4584, 0.4602, 0.5092, 0.5074, 0.5162,
    0.5774, 0.6765, 0.7755, 0.8618, 0.9116, 0.972,  0.9895, 0.965,
    0.9484, 0.9598, 0.9633, 0.9799, 1.007,  1.0752, 1.1102, 1.1391,
    1.168,  1.1864, 1.2091, 1.314,  1.4514, 1.5836, 1.7078, 1.839,
  ],
  SA: [
    0, 0.3815, 0.4129, 0.4427, 0.4707, 0.4969, 0.5039, 0.5074, 0.5144,
    0.5214, 0.5442, 0.5582, 0.5669, 0.5739, 0.5949, 0.6124, 0.6282,
    0.6544, 0.6985, 0.7426, 0.8058, 0.86,   0.9186, 0.9484, 0.9755,
    0.9895, 0.972,  0.965,  0.9746, 0.9904, 0.9974, 1.0184, 1.0464,
    1.0761, 0.9858, 1.0386, 1.1401, 1.2102, 1.2724, 1.3598, 1.4307,
  ],
  TAS: [
    0, 0.4759, 0.5144, 0.5144, 0.5144, 0.5144, 0.4847, 0.4619, 0.4619,
    0.4759, 0.4882, 0.5022, 0.5074, 0.5214, 0.5652, 0.5809, 0.6107,
    0.6439, 0.6758, 0.7076, 0.7515, 0.7857, 0.8215, 0.8416, 0.8565,
    0.8854, 0.9046, 0.9143, 0.9283, 0.9493, 0.9851, 1.0166, 1.0472,
    1.0796, 1.1111, 1.1566, 1.2388, 1.3219, 1.3911, 1.4462, 1.5109,
  ],
  VIC: [
    0, 0.4759, 0.5144, 0.5144, 0.5144, 0.5144, 0.4847, 0.4619, 0.4619,
    0.4759, 0.4882, 0.5022, 0.5074, 0.5214, 0.5652, 0.5809, 0.6107,
    0.6439, 0.6758, 0.7076, 0.7515, 0.7857, 0.8215, 0.8416, 0.8565,
    0.8854, 0.9046, 0.9143, 0.9283, 0.9493, 0.9851, 1.0166, 1.0472,
    1.0796, 1.1111, 1.1566, 1.2388, 1.3219, 1.3911, 1.4462, 1.5109,
  ],
  WA: [
    0, 0.3972, 0.4147, 0.4514, 0.4847, 0.4899, 0.4899, 0.4899, 0.4917,
    0.4934, 0.5039, 0.5179, 0.5284, 0.5389, 0.5512, 0.5459, 0.5547,
    0.5897, 0.65,   0.7104, 0.811,  0.9055, 0.9991, 1.035,  0.993,
    0.9851, 1.0061, 1.0175, 1.0271, 1.0455, 1.0359, 1.0324, 1.0306,
    1.0289, 1.0341, 1.0656, 1.1304, 1.2066, 1.2758, 1.3474, 1.4174,
  ],
};

function bciIndexForYear(yearText: string | number | undefined): number {
  if (!yearText) return 1;
  if (String(yearText) === '< Sept 1987') return 0;
  if (String(yearText) === 'Sept 1987') return 1;
  const y = parseInt(String(yearText), 10);
  if (!Number.isFinite(y)) return 1;
  return Math.max(0, Math.min(39, y - 1987));
}

function getBCI(stateKey: PropertyState | '' | undefined, yearText: string | number | undefined): number {
  const idx   = bciIndexForYear(yearText);
  const arr   = BCI[stateKey || 'NSW'];
  const value = arr?.[idx];
  return Number.isFinite(value) ? value : 1;
}

// ─── Storey offset and multiplier — verified from source ─────────────────────

function mapStoriesOffset(floors: number): number {
  if (floors >= 8) return 10;
  return floors - 1; // 1→0, 2→1, 3→2, …, 7→6
}

function storeyMultiplier(floors: number): number {
  return 1 + mapStoriesOffset(floors) * 0.04;
}

// ─── Bedroom multiplier — verified from source ────────────────────────────────
// Factor: 1→−0.08, 2→−0.04, 3→0, 4→+0.04, 5+→+0.08

function bedroomMultiplier(bedrooms: number): number {
  if (bedrooms <= 1) return 0.92;
  if (bedrooms === 2) return 0.96;
  if (bedrooms === 3) return 1.00;
  if (bedrooms === 4) return 1.04;
  return 1.08; // 5+
}

// ─── All-visible sentinel used when called without explicit visibility ─────────

const ALL_VISIBLE: VisibleFields = {
  bedrooms: true, wallType: true, basement: true, elevator: true, mezzanine: true,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Verified formula:
 *
 *   perSqmBase          = PROPERTY_BASE + wallPoints + basementRate + mezzanineRate + ductedRate
 *   baseWithoutElevator = perSqmBase × storeyMultiplier(floors) × bedroomMultiplier(beds) × area
 *   elevatorAllowance   = elevator selected ? 100_000 + mapStoriesOffset(floors) × 9_500 : 0
 *   baseCalc            = (baseWithoutElevator + elevatorAllowance) × getBCI(state, year)
 *   low  = round(baseCalc × 0.91)
 *   mid  = round(baseCalc × 1.00)
 *   high = round(baseCalc × 1.09)
 *
 * buildType and finishLevel are UI/context only and do not affect baseCalc.
 * selectedFinishEstimate (economy→low, standard→mid, premium/luxury→high) is
 * resolved in the UI layer after this function returns.
 *
 * Returns null when any required visible field is missing or invalid.
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

  // Validate always-required fields.
  // buildType and finishLevel are required UI selections but do not affect the formula.
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

  if (area <= 0 || floors <= 0) return null;

  // Neutral bedroom count (factor 0, multiplier 1.00) when field is not visible
  const beds = visible.bedrooms ? Number(bedrooms) : 3;
  if (visible.bedrooms && beds <= 0) return null;

  // ── Per-m² base: propertyBase + conditional wall/add-on rates ────────────

  const wallPoints    = visible.wallType  ? WALL_POINTS[wallType as WallType] : 0;
  const basementRate  = visible.basement  && basement  ? ADDON_RATE.basement  : 0;
  const mezzanineRate = visible.mezzanine && mezzanine ? ADDON_RATE.mezzanine : 0;
  const ductedRate    = ductedAirConditioning           ? ADDON_RATE.ducted    : 0;

  const perSqmBase = PROPERTY_BASE[investmentPropertyType]
    + wallPoints
    + basementRate
    + mezzanineRate
    + ductedRate;

  // ── Core floor area cost ──────────────────────────────────────────────────

  const baseWithoutElevator = perSqmBase
    * storeyMultiplier(floors)
    * (visible.bedrooms ? bedroomMultiplier(beds) : 1)
    * area;

  // ── Elevator allowance (fixed formula, not per m²) ───────────────────────

  const elevatorAllowance = visible.elevator && elevator
    ? 100_000 + mapStoriesOffset(floors) * 9_500
    : 0;

  // ── Apply BCI(state, year) ────────────────────────────────────────────────

  const baseCalc = (baseWithoutElevator + elevatorAllowance)
    * getBCI(investmentPropertyState, constructionCompletionYear);

  // ── Range: verified ±9% around base ──────────────────────────────────────

  const mid  = Math.round(baseCalc);
  const low  = Math.round(baseCalc * 0.91);
  const high = Math.round(baseCalc * 1.09);

  return { low, mid, high };
}
