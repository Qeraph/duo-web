'use client';

import { useState } from 'react';
import type { FormState, EstimateResult } from './types';
import {
  PROPERTY_TYPE_OPTIONS,
  STATE_OPTIONS,
  BUILD_TYPE_OPTIONS,
  FINISH_LEVEL_OPTIONS,
  WALL_TYPE_OPTIONS,
  BEDROOM_OPTIONS,
  FLOOR_OPTIONS,
  YEAR_MIN,
  YEAR_MAX,
  getVisibleFields,
} from './types';
import { calculateEstimate } from './calculationEngine';

// ── Initial form state ────────────────────────────────────────────────────────

const INITIAL_FORM: FormState = {
  investmentPropertyType:     '',
  constructionCompletionYear: 2025,
  investmentPropertyState:    '',
  buildType:                  '',
  finishLevel:                '',
  floorArea:                  '',
  bedrooms:                   '',
  numberOfFloors:             '',
  wallType:                   '',
  basement:                   false,
  elevator:                   false,
  mezzanine:                  false,
  ductedAirConditioning:      false,
};

const aud = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

// ── Property type subtitles (display only — no effect on calculation) ─────────

const PROPERTY_SUBTITLES: Record<string, string> = {
  house:       'Detached dwelling',
  townhouse:   'Attached multi-level',
  apartment:   'Strata unit',
  granny_flat: 'Secondary dwelling',
  office:      'Office / retail',
  warehouse:   'Warehouse / factory',
};

// ── Property type icons (inline SVG, no external deps) ────────────────────────

function IconHouse({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 9.5L10 3l7.5 6.5" />
      <path d="M5 8V17h10V8" />
      <path d="M8 17v-5h4v5" />
    </svg>
  );
}

function IconTownhouse({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1.5 10.5L5.5 6.5l4 4M10.5 10.5l4-4 4 4" />
      <path d="M2.5 10.5V17h6V10.5M11.5 10.5V17h6V10.5" />
      <path d="M5.5 17v-4h2v4M12.5 17v-4h2v4" />
    </svg>
  );
}

function IconApartment({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="2" width="13" height="16" rx="1" />
      <path d="M7 6.5h2M11 6.5h2M7 10h2M11 10h2M7 13.5h2M11 13.5h2" />
    </svg>
  );
}

function IconGrannyFlat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1.5 11.5L10 4.5l8.5 7" />
      <rect x="4" y="11.5" width="12" height="6.5" rx="1" />
      <path d="M8.5 18V13.5h3V18" />
    </svg>
  );
}

function IconOffice({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="2.5" width="15" height="15" rx="1" />
      <path d="M2.5 7.5h15M2.5 12h15M10 7.5V17.5" />
    </svg>
  );
}

function IconWarehouse({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1.5 9.5L10 5l8.5 4.5V18h-17V9.5z" />
      <path d="M7.5 18V12h5v6" />
    </svg>
  );
}

function IconChevron({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

function IconCalculator({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.504-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.498-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
    </svg>
  );
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <path d="M12 2v4h4M7 9h6M7 12h6M7 15h4" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="16" height="12" rx="1.5" />
      <path d="M2 7l8 5 8-5" />
    </svg>
  );
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const PROPERTY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  house:       IconHouse,
  townhouse:   IconTownhouse,
  apartment:   IconApartment,
  granny_flat: IconGrannyFlat,
  office:      IconOffice,
  warehouse:   IconWarehouse,
};

// ── Primitive UI components ───────────────────────────────────────────────────

// ALL CAPS label above a logical form section
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-3">
      {children}
    </p>
  );
}

// Individual field label (sentence case, lighter weight)
function Field({ label, htmlFor, children }: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

// Light-theme native select with custom chevron
function LightSelect({ id, value, onChange, children }: {
  id: string;
  value: string | number;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full h-10 rounded-lg bg-white border border-slate-300 px-3 pr-9 appearance-none text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer"
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
        <IconChevron className="w-4 h-4" />
      </div>
    </div>
  );
}

// Property type card grid — icon + label + subtitle, 3 cols
function PropertyTypeSelector({
  value,
  onChange,
}: {
  value: FormState['investmentPropertyType'];
  onChange: (v: FormState['investmentPropertyType']) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {PROPERTY_TYPE_OPTIONS.map(opt => {
        const active = value === opt.value;
        const Icon = PROPERTY_ICONS[opt.value] ?? IconApartment;
        const subtitle = PROPERTY_SUBTITLES[opt.value];
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value as FormState['investmentPropertyType'])}
            className={[
              'flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              active
                ? 'bg-slate-50 border-slate-900 text-slate-900'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800',
            ].join(' ')}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex flex-col min-w-0">
              <span className="text-sm font-medium leading-tight">{opt.label}</span>
              {subtitle && (
                <span className="text-xs text-slate-400 leading-tight mt-0.5 truncate">{subtitle}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Horizontal segmented control — light track, dark navy selected
function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg bg-slate-100 border border-slate-200 p-0.5 gap-0.5">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'flex-1 self-stretch flex items-center justify-center rounded-md px-2 py-2',
              'text-sm text-center transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              active
                ? 'bg-slate-900 text-white font-semibold shadow-sm'
                : 'text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Pill grid selector — light theme (wall type, 2-col)
function PillSelector({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  cols?: 2 | 3;
}) {
  return (
    <div className={`grid gap-2 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'py-2.5 px-3 rounded-lg border text-sm text-center transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              active
                ? 'bg-white border-slate-900 text-slate-900 font-medium shadow-sm'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// +/− stepper for small numeric option lists
function Stepper({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: number | '';
  options: readonly number[];
  onChange: (v: number | '') => void;
  ariaLabel: string;
}) {
  const idx = value === '' ? -1 : (options as readonly number[]).indexOf(value as number);
  const canDec = idx > 0;
  const canInc = idx < options.length - 1;

  function handleDec() {
    if (canDec) onChange(options[idx - 1]);
  }
  function handleInc() {
    const nextIdx = idx === -1 ? 0 : idx + 1;
    if (nextIdx < options.length) onChange(options[nextIdx]);
  }

  return (
    <div className="flex items-center justify-between h-10 bg-white border border-slate-300 rounded-lg px-2 gap-1">
      <button
        type="button"
        onClick={handleDec}
        disabled={!canDec}
        aria-label={`Decrease ${ariaLabel}`}
        className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5" aria-hidden="true">
          <path d="M3 8h10" />
        </svg>
      </button>
      <span className="text-sm font-medium text-slate-900 tabular-nums min-w-[1.5rem] text-center">
        {value === '' ? <span className="text-slate-300">—</span> : value}
      </span>
      <button
        type="button"
        onClick={handleInc}
        disabled={!canInc && idx !== -1}
        aria-label={`Increase ${ariaLabel}`}
        className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5" aria-hidden="true">
          <path d="M8 3v10M3 8h10" />
        </svg>
      </button>
    </div>
  );
}

// Toggle card for feature add-ons — light theme
function ToggleCard({
  label,
  id,
  checked,
  onChange,
}: {
  label: string;
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border text-left transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        checked
          ? 'bg-blue-50 border-blue-600 text-blue-900'
          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800',
      ].join(' ')}
    >
      <span className={[
        'w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors',
        checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white',
      ].join(' ')}>
        {checked && (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 text-white" aria-hidden="true">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
        )}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// How section — step badge + card title (light theme)
function HowCardHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 pb-3.5 border-b border-slate-100">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold shrink-0">
        {step}
      </span>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
  );
}

// Label / value row in divide-y containers
function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2">
      <span className="text-slate-500 text-sm w-28 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px bg-slate-100 my-1" />;
}

// ── Module-level helpers (logic unchanged from source) ────────────────────────

function optionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T | '',
): string {
  return options.find(o => o.value === value)?.label ?? String(value);
}

function joinList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

// economy→low, standard→mid, premium/luxury→high, default→mid
function getSelectedFinishEstimate(
  finishLevel: FormState['finishLevel'],
  r: { low: number; mid: number; high: number },
): number {
  if (finishLevel === 'economy')                              return r.low;
  if (finishLevel === 'premium' || finishLevel === 'luxury') return r.high;
  return r.mid;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ConstructionCalculator() {
  const [form, setForm]           = useState<FormState>(INITIAL_FORM);
  const [result, setResult]       = useState<EstimateResult | null>(null);
  const [attempted, setAttempted] = useState(false);

  const visible = getVisibleFields(form.investmentPropertyType);

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
    setResult(null);
  }

  // Clears values for fields hidden by the new type so they don't leak into
  // validation or the calculation.
  function handlePropertyTypeChange(newType: FormState['investmentPropertyType']) {
    const vis = getVisibleFields(newType);
    setForm(prev => ({
      ...prev,
      investmentPropertyType: newType,
      bedrooms:  vis.bedrooms  ? prev.bedrooms  : '',
      wallType:  vis.wallType  ? prev.wallType  : '',
      basement:  vis.basement  ? prev.basement  : false,
      elevator:  vis.elevator  ? prev.elevator  : false,
      mezzanine: vis.mezzanine ? prev.mezzanine : false,
    }));
    setResult(null);
  }

  function handleCalculate() {
    setAttempted(true);
    setResult(calculateEstimate(form, visible));
  }

  const validationFailed = attempted && result === null;

  // Derived display values used in the How section
  const typeLabel    = optionLabel(PROPERTY_TYPE_OPTIONS, form.investmentPropertyType);
  const finishLabel  = optionLabel(FINISH_LEVEL_OPTIONS,  form.finishLevel);
  const buildLabel   = optionLabel(BUILD_TYPE_OPTIONS,    form.buildType);
  const wallLabel    = optionLabel(WALL_TYPE_OPTIONS,     form.wallType);
  const floorCount   = Number(form.numberOfFloors);
  const bedroomCount = Number(form.bedrooms);

  const visibleAddons = [
    { label: 'Ducted Air-Conditioning', checked: form.ductedAirConditioning },
    ...(visible.basement  ? [{ label: 'Basement',  checked: form.basement  }] : []),
    ...(visible.elevator  ? [{ label: 'Elevator',  checked: form.elevator  }] : []),
    ...(visible.mezzanine ? [{ label: 'Mezzanine', checked: form.mezzanine }] : []),
  ];
  const checkedAddons          = visibleAddons.filter(o => o.checked).map(o => o.label.toLowerCase());
  const selectedFinishEstimate = result ? getSelectedFinishEstimate(form.finishLevel, result) : 0;

  // Range bar: 0% = low, ~50% = mid, 100% = high
  const rangePercent = result
    ? Math.round(((selectedFinishEstimate - result.low) / (result.high - result.low)) * 100)
    : 50;

  // Per-m² rate shown beneath hero amount
  const perSqm = result && Number(form.floorArea) > 0
    ? Math.round(selectedFinishEstimate / Number(form.floorArea))
    : null;

  return (
    <>
      {/* ── Two-column layout: form (light) + results (dark) ─────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ── Input panel — white card ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0 w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* ── Investment Property Type ──────────────────────────────────── */}
          <div className="px-6 sm:px-7 pt-6 sm:pt-7 pb-5">
            <SectionLabel>Investment Property Type</SectionLabel>
            <PropertyTypeSelector
              value={form.investmentPropertyType}
              onChange={handlePropertyTypeChange}
            />
          </div>

          <Divider />

          {/* ── Project Details ───────────────────────────────────────────── */}
          <div className="px-6 sm:px-7 py-5">
            <SectionLabel>Project Details</SectionLabel>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Investment Property State" htmlFor="investmentPropertyState">
                <LightSelect
                  id="investmentPropertyState"
                  value={form.investmentPropertyState}
                  onChange={e =>
                    handleChange('investmentPropertyState', e.target.value as FormState['investmentPropertyState'])
                  }
                >
                  <option value="">Select state…</option>
                  {STATE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </LightSelect>
              </Field>
              <Field label="Construction Completion Year" htmlFor="constructionCompletionYear">
                <input
                  type="number"
                  id="constructionCompletionYear"
                  value={form.constructionCompletionYear}
                  min={YEAR_MIN}
                  max={YEAR_MAX}
                  onChange={e =>
                    handleChange(
                      'constructionCompletionYear',
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  className="w-full h-10 rounded-lg bg-white border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </Field>
            </div>

            <Field label="Build Type">
              <SegmentedControl
                options={BUILD_TYPE_OPTIONS}
                value={form.buildType}
                onChange={v => handleChange('buildType', v as FormState['buildType'])}
              />
            </Field>
          </div>

          <Divider />

          {/* ── Size & Structure ──────────────────────────────────────────── */}
          <div className="px-6 sm:px-7 py-5">
            <SectionLabel>Size &amp; Structure</SectionLabel>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Floor Area (m²)" htmlFor="floorArea">
                <input
                  type="number"
                  id="floorArea"
                  value={form.floorArea}
                  min={1}
                  onChange={e =>
                    handleChange('floorArea', e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 250"
                  className="w-full h-10 rounded-lg bg-white border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </Field>
              <Field label="Number of Floors">
                <Stepper
                  value={form.numberOfFloors}
                  options={FLOOR_OPTIONS}
                  onChange={v => handleChange('numberOfFloors', v as FormState['numberOfFloors'])}
                  ariaLabel="number of floors"
                />
              </Field>
            </div>

            {visible.bedrooms && (
              <div className="mb-4">
                <Field label="Number of Bedrooms">
                  <Stepper
                    value={form.bedrooms}
                    options={BEDROOM_OPTIONS}
                    onChange={v => handleChange('bedrooms', v as FormState['bedrooms'])}
                    ariaLabel="number of bedrooms"
                  />
                </Field>
              </div>
            )}

            {visible.wallType && (
              <Field label="Wall Type">
                <PillSelector
                  options={WALL_TYPE_OPTIONS}
                  value={form.wallType}
                  onChange={v => handleChange('wallType', v as FormState['wallType'])}
                  cols={2}
                />
              </Field>
            )}
          </div>

          <Divider />

          {/* ── Spec / Finish Level ───────────────────────────────────────── */}
          <div className="px-6 sm:px-7 py-5">
            <SectionLabel>Spec / Finish Level</SectionLabel>
            <SegmentedControl
              options={FINISH_LEVEL_OPTIONS}
              value={form.finishLevel}
              onChange={v => handleChange('finishLevel', v as FormState['finishLevel'])}
            />
          </div>

          <Divider />

          {/* ── Features & Add-ons ────────────────────────────────────────── */}
          <div className="px-6 sm:px-7 py-5">
            <SectionLabel>Features &amp; Add-ons</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visible.basement && (
                <ToggleCard
                  label="Basement"
                  id="basement"
                  checked={form.basement}
                  onChange={v => handleChange('basement', v)}
                />
              )}
              {visible.elevator && (
                <ToggleCard
                  label="Elevator"
                  id="elevator"
                  checked={form.elevator}
                  onChange={v => handleChange('elevator', v)}
                />
              )}
              {visible.mezzanine && (
                <ToggleCard
                  label="Mezzanine"
                  id="mezzanine"
                  checked={form.mezzanine}
                  onChange={v => handleChange('mezzanine', v)}
                />
              )}
              <ToggleCard
                label="Ducted Air-Conditioning"
                id="ductedAirConditioning"
                checked={form.ductedAirConditioning}
                onChange={v => handleChange('ductedAirConditioning', v)}
              />
            </div>
          </div>

          {/* ── Calculate button ──────────────────────────────────────────── */}
          <div className="px-6 sm:px-7 pb-6 sm:pb-7">
            <button
              type="button"
              onClick={handleCalculate}
              className="w-full h-11 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 active:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-colors duration-150"
            >
              Calculate Estimate
            </button>

            {validationFailed && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 mt-3"
              >
                <IconAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">
                  Please fill in all required fields before calculating.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Results panel — dark navy ──────────────────────────────────────── */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-[#0d1b35] rounded-2xl p-6 sm:p-7 lg:sticky lg:top-8 lg:self-start">

          {/* ── Estimate area ────────────────────────────────────────────── */}
          {result === null ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <IconCalculator className="w-7 h-7 text-white/40" />
              </div>
              <p className="text-sm font-medium text-white/60 mb-1">Ready to calculate</p>
              <p className="text-sm text-white/30 leading-relaxed">
                Fill in all property details and press Calculate Estimate.
              </p>
            </div>
          ) : (
            <div>
              {/* Label */}
              <p className="text-xs font-semibold tracking-widest text-blue-300 uppercase mb-3">
                Construction Cost Estimate
              </p>

              {/* Hero amount */}
              <p className="font-mono text-5xl font-bold text-white tracking-tight leading-none">
                {aud.format(selectedFinishEstimate)}
              </p>

              {/* Per-m² rate */}
              {perSqm !== null && (
                <p className="font-mono text-sm text-white/50 mt-1.5">
                  {aud.format(perSqm)} per m²
                </p>
              )}

              {/* Range bar */}
              <div className="mt-6">
                <div className="relative h-1.5 bg-white/15 rounded-full">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-400 rounded-full"
                    style={{ width: `${Math.max(2, Math.min(100, rangePercent))}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md"
                    style={{ left: `calc(${Math.max(2, Math.min(98, rangePercent))}% - 7px)` }}
                  />
                </div>
                <div className="flex justify-between mt-3">
                  <div>
                    <p className="text-xs text-white/40 mb-0.5">Low estimate</p>
                    <p className="text-sm font-mono font-semibold text-white/80">{aud.format(result.low)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 mb-0.5">High estimate</p>
                    <p className="text-sm font-mono font-semibold text-white/80">{aud.format(result.high)}</p>
                  </div>
                </div>
              </div>

              {/* Cost range row */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <span className="text-sm text-white/40">Cost range</span>
                <span className="text-sm font-mono font-medium text-white/70">
                  {aud.format(result.low)} — {aud.format(result.high)}
                </span>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-white/30 leading-relaxed mt-4">
                Estimates are indicative and based on current Australian market benchmarks. Actual
                costs may vary by site conditions, subcontractor availability, and scope changes.
                Independent quantity surveying is recommended prior to financial commitment.
              </p>
            </div>
          )}

          {/* ── CTA — always visible ─────────────────────────────────────── */}
          <div className={`${result !== null ? 'mt-5 pt-5 border-t border-white/10' : ''}`}>
            <button
              type="button"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 active:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors duration-150"
            >
              <IconFileText className="w-4 h-4 shrink-0" />
              Order Initial Cost Report
            </button>
            <button
              type="button"
              className="w-full mt-2.5 h-10 flex items-center justify-center gap-2 rounded-xl border border-white/15 text-white/50 text-sm font-medium hover:text-white/80 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors duration-150"
            >
              <IconMail className="w-4 h-4 shrink-0" />
              Email me the results
            </button>
          </div>
        </div>

      </div>

      {/* ── How your estimate is calculated ──────────────────────────────────── */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-5">
          How your estimate is calculated
        </h2>

        {result === null ? (
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-7 text-center shadow-sm">
            <p className="text-sm text-slate-400">
              Complete the calculator above to see a detailed explanation of your estimate.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* A — Your inputs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <HowCardHeader step="A" title="Your inputs" />
              <div className="flex flex-col divide-y divide-slate-100">
                <DataRow label="Type"             value={typeLabel} />
                {visible.bedrooms && <DataRow label="Bedrooms"      value={String(form.bedrooms)} />}
                <DataRow label="Storeys"           value={String(form.numberOfFloors)} />
                <DataRow label="Area"              value={`${form.floorArea} m²`} />
                {visible.wallType && <DataRow label="Wall type"     value={wallLabel} />}
                <DataRow label="Spec"              value={finishLabel} />
                <DataRow label="Build type"        value={buildLabel} />
                <DataRow label="State &amp; year"  value={`${form.investmentPropertyState}, ${form.constructionCompletionYear}`} />
                <div className="flex gap-4 py-2">
                  <span className="text-slate-500 text-sm w-28 shrink-0">Options</span>
                  <div className="flex flex-col gap-0.5">
                    {visibleAddons.map(o => (
                      <span key={o.label} className="text-sm text-slate-700">
                        {o.label}:{' '}
                        <span className={o.checked ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                          {o.checked ? 'Yes' : 'No'}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* B — How we calculated it */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <HowCardHeader step="B" title="How we calculated it" />
              <div className="flex flex-col gap-3 text-sm text-slate-600 leading-relaxed">
                <p>
                  Your {typeLabel} estimate starts from a base construction rate for
                  a <strong className="font-semibold text-slate-900">{finishLabel.toLowerCase()}</strong> finish across{' '}
                  <strong className="font-semibold text-slate-900">{form.floorArea} m²</strong> on{' '}
                  <strong className="font-semibold text-slate-900">{form.numberOfFloors} {floorCount === 1 ? 'floor' : 'floors'}</strong>
                  {visible.bedrooms && bedroomCount > 0
                    ? `, with ${form.bedrooms} ${bedroomCount === 1 ? 'bedroom' : 'bedrooms'}`
                    : ''}
                  {visible.wallType && form.wallType
                    ? ` (${wallLabel.toLowerCase()} construction)`
                    : ''}.
                </p>
                <p>
                  The <strong className="font-semibold text-slate-900">{form.investmentPropertyState}</strong> location and{' '}
                  <strong className="font-semibold text-slate-900">{form.constructionCompletionYear}</strong> completion year apply
                  regional and time-based cost adjustments to the base rate.
                </p>
                {checkedAddons.length > 0 ? (
                  <p>
                    Fixed add-on costs for{' '}
                    <strong className="font-semibold text-slate-900">{joinList(checkedAddons)}</strong> are
                    included in the total.
                  </p>
                ) : (
                  <p>No optional add-ons were selected.</p>
                )}
                <p>
                  The estimate for your selected{' '}
                  <strong className="font-semibold text-slate-900">{finishLabel}</strong> finish
                  is <strong className="font-semibold text-slate-900">{aud.format(selectedFinishEstimate)}</strong>. The low and
                  high figures represent the construction cost range around this value.
                </p>
              </div>
            </div>

            {/* C — What affects your estimate */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <HowCardHeader step="C" title="What affects your estimate" />
              <ul className="flex flex-col gap-2 text-sm text-slate-600">
                {[
                  'Property type sets the base construction rate per m².',
                  'Floor area scales the total cost proportionally.',
                  'Finish level applies a multiplier across the entire build cost.',
                  'Build type adds a complexity premium for knockdown rebuilds or extensions.',
                  ...(visible.bedrooms ? ['Bedroom count adjusts for additional wet areas and joinery.'] : []),
                  ...(visible.wallType ? ['Wall type adds or reduces the per-m² cost.'] : []),
                  'State and completion year apply regional and time-based cost indices.',
                  `Add-ons (${visibleAddons.map(o => o.label).join(', ')}) each add a fixed cost when selected.`,
                  'Land price is not included in any estimate.',
                ].map((item, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="text-slate-300 mt-0.5 shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* D — Totals */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <HowCardHeader step="D" title="Totals" />
              <div className="flex flex-col divide-y divide-slate-100">
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">Low estimate</span>
                  <span className="text-sm font-mono font-medium text-slate-900">{aud.format(result.low)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">Finish (selected)</span>
                  <span className="text-sm font-mono font-semibold text-slate-900">{aud.format(selectedFinishEstimate)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">High estimate</span>
                  <span className="text-sm font-mono font-medium text-slate-900">{aud.format(result.high)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">Cost range</span>
                  <span className="text-sm font-mono font-medium text-slate-900">{aud.format(result.high - result.low)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mt-4 pt-4 border-t border-slate-100">
                Indicative only. Not a final construction quote. Land price excluded.
              </p>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
