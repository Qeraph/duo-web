// ─── Domain types ─────────────────────────────────────────────────────────────

export type PropertyType = 'house' | 'townhouse' | 'apartment' | 'granny_flat' | 'office' | 'warehouse';
export type PropertyState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'ACT' | 'NT';
export type BuildType = 'new_build' | 'knockdown_rebuild' | 'extension';
export type FinishLevel = 'standard' | 'mid_range' | 'luxury';
export type WallType = 'brick_veneer' | 'double_brick' | 'lightweight' | 'hebel';

// ─── Form state ───────────────────────────────────────────────────────────────

// Numeric fields use `number | ''` so React controlled inputs stay valid while
// empty (an empty <input type="number"> must bind to '' not undefined).
export interface FormState {
  investmentPropertyType: PropertyType | '';
  constructionCompletionYear: number | '';
  investmentPropertyState: PropertyState | '';
  buildType: BuildType | '';
  finishLevel: FinishLevel | '';
  floorArea: number | '';
  bedrooms: number | '';
  numberOfFloors: number | '';
  wallType: WallType | '';
  basement: boolean;
  elevator: boolean;
  mezzanine: boolean;
  ductedAirConditioning: boolean;
}

// ─── Calculator output ────────────────────────────────────────────────────────

export interface EstimateResult {
  low: number;
  mid: number;
  high: number;
}

// ─── Select option shape ──────────────────────────────────────────────────────

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

// ─── Field option lists ───────────────────────────────────────────────────────

export const PROPERTY_TYPE_OPTIONS: SelectOption<PropertyType>[] = [
  { value: 'house',       label: 'House' },
  { value: 'townhouse',   label: 'Townhouse' },
  { value: 'apartment',   label: 'Apartment' },
  { value: 'granny_flat', label: 'Granny Flat' },
  { value: 'office',      label: 'Office' },
  { value: 'warehouse',   label: 'Warehouse' },
];

export const STATE_OPTIONS: SelectOption<PropertyState>[] = [
  { value: 'NSW', label: 'New South Wales (NSW)' },
  { value: 'VIC', label: 'Victoria (VIC)' },
  { value: 'QLD', label: 'Queensland (QLD)' },
  { value: 'SA',  label: 'South Australia (SA)' },
  { value: 'WA',  label: 'Western Australia (WA)' },
  { value: 'TAS', label: 'Tasmania (TAS)' },
  { value: 'ACT', label: 'Australian Capital Territory (ACT)' },
  { value: 'NT',  label: 'Northern Territory (NT)' },
];

export const BUILD_TYPE_OPTIONS: SelectOption<BuildType>[] = [
  { value: 'new_build',          label: 'New Build' },
  { value: 'knockdown_rebuild',  label: 'Knockdown & Rebuild' },
  { value: 'extension',          label: 'Extension / Renovation' },
];

export const FINISH_LEVEL_OPTIONS: SelectOption<FinishLevel>[] = [
  { value: 'standard',  label: 'Standard' },
  { value: 'mid_range', label: 'Mid-Range' },
  { value: 'luxury',    label: 'Luxury / High-End' },
];

export const WALL_TYPE_OPTIONS: SelectOption<WallType>[] = [
  { value: 'brick_veneer',  label: 'Brick Veneer' },
  { value: 'double_brick',  label: 'Double Brick' },
  { value: 'lightweight',   label: 'Lightweight / Clad' },
  { value: 'hebel',         label: 'Hebel / AAC Panel' },
];

export const BEDROOM_OPTIONS = [1, 2, 3, 4, 5] as const;
export const FLOOR_OPTIONS   = [1, 2, 3]       as const;

// Earliest and latest selectable completion years
export const YEAR_MIN = 1990;
export const YEAR_MAX = 2030;

// ─── Field visibility ─────────────────────────────────────────────────────────

// Flags for optional fields whose visibility depends on the selected property type.
// Always-visible fields (investmentPropertyType, constructionCompletionYear,
// investmentPropertyState, buildType, finishLevel, floorArea, numberOfFloors,
// ductedAirConditioning) are not listed here.
export interface VisibleFields {
  bedrooms:  boolean;
  wallType:  boolean;
  basement:  boolean;
  elevator:  boolean;
  mezzanine: boolean;
}

export function getVisibleFields(type: PropertyType | ''): VisibleFields {
  switch (type) {
    case 'house':
      return { bedrooms: true,  wallType: true,  basement: true,  elevator: true,  mezzanine: false };
    case 'granny_flat':
      return { bedrooms: true,  wallType: true,  basement: false, elevator: false, mezzanine: false };
    case 'townhouse':
      return { bedrooms: true,  wallType: true,  basement: true,  elevator: false, mezzanine: false };
    case 'apartment':
      return { bedrooms: true,  wallType: false, basement: true,  elevator: true,  mezzanine: false };
    case 'office':
      return { bedrooms: false, wallType: false, basement: true,  elevator: true,  mezzanine: true  };
    case 'warehouse':
      return { bedrooms: false, wallType: false, basement: true,  elevator: false, mezzanine: true  };
    default:
      // No type selected — hide all optional fields until a type is chosen
      return { bedrooms: false, wallType: false, basement: false, elevator: false, mezzanine: false };
  }
}
