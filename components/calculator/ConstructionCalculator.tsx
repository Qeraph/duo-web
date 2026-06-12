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

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.504-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.498-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
    </svg>
  );
}

// ── Shared CSS constants ──────────────────────────────────────────────────────

const inputBase = [
  'w-full h-10 rounded-lg border border-slate-200 px-3',
  'text-sm text-slate-900 bg-white',
  'placeholder:text-slate-400',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'transition-colors duration-150',
].join(' ');

const selectBase = `${inputBase} appearance-none pr-9 cursor-pointer`;
const cardClass  = 'bg-white rounded-2xl border border-slate-200 shadow-sm';

// ── Form primitives ───────────────────────────────────────────────────────────

function Field({ label, htmlFor, children }: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

// Wraps a <select> and overlays a custom chevron
function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
}

// Accessible custom-styled checkbox
function CheckboxField({ label, id, checked, onChange }: {
  label: string;
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className={[
        'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
        checked
          ? 'bg-blue-600 border-blue-600'
          : 'border-slate-300 bg-white group-hover:border-blue-400',
      ].join(' ')}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </span>
      <span className="text-sm text-slate-700 select-none">{label}</span>
    </label>
  );
}

// Section label used inside the How cards
function HowCardHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 pb-3.5 border-b border-slate-100">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
        {step}
      </span>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
  );
}

// Row used in "Your inputs" and "Totals" cards
function DataRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-4 py-2 border-b border-slate-50 last:border-0">
      <span className="text-slate-500 text-sm w-28 shrink-0">{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold text-slate-900' : 'font-medium text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
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
  if (finishLevel === 'economy')                             return r.low;
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

  return (
    <>
      {/* ── Two-column layout: input + results ─────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Input panel ──────────────────────────────────────────────────── */}
        <div className={`${cardClass} p-6 sm:p-8 flex-1 w-full min-w-0`}>
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Property Details</h2>

          <div className="flex flex-col gap-4">

            {/* ── Group 1: Property identity ──────────────────────────────── */}
            <Field label="Investment Property Type" htmlFor="investmentPropertyType">
              <SelectWrap>
                <select
                  id="investmentPropertyType"
                  value={form.investmentPropertyType}
                  onChange={e => handlePropertyTypeChange(e.target.value as FormState['investmentPropertyType'])}
                  className={selectBase}
                >
                  <option value="">Select type…</option>
                  {PROPERTY_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </SelectWrap>
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
                className={inputBase}
              />
            </Field>

            <Field label="Investment Property State" htmlFor="investmentPropertyState">
              <SelectWrap>
                <select
                  id="investmentPropertyState"
                  value={form.investmentPropertyState}
                  onChange={e => handleChange('investmentPropertyState', e.target.value as FormState['investmentPropertyState'])}
                  className={selectBase}
                >
                  <option value="">Select state…</option>
                  {STATE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </SelectWrap>
            </Field>

            <Field label="Build Type" htmlFor="buildType">
              <SelectWrap>
                <select
                  id="buildType"
                  value={form.buildType}
                  onChange={e => handleChange('buildType', e.target.value as FormState['buildType'])}
                  className={selectBase}
                >
                  <option value="">Select build type…</option>
                  {BUILD_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </SelectWrap>
            </Field>

            <Field label="Spec / Finish Level" htmlFor="finishLevel">
              <SelectWrap>
                <select
                  id="finishLevel"
                  value={form.finishLevel}
                  onChange={e => handleChange('finishLevel', e.target.value as FormState['finishLevel'])}
                  className={selectBase}
                >
                  <option value="">Select finish level…</option>
                  {FINISH_LEVEL_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </SelectWrap>
            </Field>

            {/* ── Divider ─────────────────────────────────────────────────── */}
            <div className="h-px bg-slate-100" />

            {/* ── Group 2: Size & structure ───────────────────────────────── */}
            <Field label="Floor Area (m²)" htmlFor="floorArea">
              <input
                type="number"
                id="floorArea"
                value={form.floorArea}
                min={1}
                onChange={e =>
                  handleChange('floorArea', e.target.value === '' ? '' : Number(e.target.value))
                }
                className={inputBase}
                placeholder="e.g. 200"
              />
            </Field>

            {visible.bedrooms && (
              <Field label="Number of Bedrooms" htmlFor="bedrooms">
                <SelectWrap>
                  <select
                    id="bedrooms"
                    value={form.bedrooms}
                    onChange={e => handleChange('bedrooms', e.target.value === '' ? '' : Number(e.target.value) as FormState['bedrooms'])}
                    className={selectBase}
                  >
                    <option value="">Select…</option>
                    {BEDROOM_OPTIONS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </SelectWrap>
              </Field>
            )}

            <Field label="Number of Floors" htmlFor="numberOfFloors">
              <SelectWrap>
                <select
                  id="numberOfFloors"
                  value={form.numberOfFloors}
                  onChange={e => handleChange('numberOfFloors', e.target.value === '' ? '' : Number(e.target.value) as FormState['numberOfFloors'])}
                  className={selectBase}
                >
                  <option value="">Select…</option>
                  {FLOOR_OPTIONS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </SelectWrap>
            </Field>

            {visible.wallType && (
              <Field label="Wall Type" htmlFor="wallType">
                <SelectWrap>
                  <select
                    id="wallType"
                    value={form.wallType}
                    onChange={e => handleChange('wallType', e.target.value as FormState['wallType'])}
                    className={selectBase}
                  >
                    <option value="">Select wall type…</option>
                    {WALL_TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </SelectWrap>
              </Field>
            )}

            {/* ── Divider ─────────────────────────────────────────────────── */}
            <div className="h-px bg-slate-100" />

            {/* ── Group 3: Features & add-ons ─────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-3">
                Features &amp; Add-ons
              </p>
              <div className="flex flex-col gap-2.5">
                {visible.basement && (
                  <CheckboxField
                    label="Basement"
                    id="basement"
                    checked={form.basement}
                    onChange={v => handleChange('basement', v)}
                  />
                )}
                {visible.elevator && (
                  <CheckboxField
                    label="Elevator"
                    id="elevator"
                    checked={form.elevator}
                    onChange={v => handleChange('elevator', v)}
                  />
                )}
                {visible.mezzanine && (
                  <CheckboxField
                    label="Mezzanine"
                    id="mezzanine"
                    checked={form.mezzanine}
                    onChange={v => handleChange('mezzanine', v)}
                  />
                )}
                <CheckboxField
                  label="Ducted Air-Conditioning"
                  id="ductedAirConditioning"
                  checked={form.ductedAirConditioning}
                  onChange={v => handleChange('ductedAirConditioning', v)}
                />
              </div>
            </div>

            {/* ── Calculate button ─────────────────────────────────────────── */}
            <div className="pt-2">
              <button
                onClick={handleCalculate}
                className="w-full h-11 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
              >
                Calculate Estimate
              </button>
            </div>

            {validationFailed && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-3.5 py-3"
              >
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">
                  Please fill in all required fields before calculating.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ── Results panel (sticky on desktop) ────────────────────────────── */}
        <div className={`${cardClass} p-6 sm:p-8 flex-1 w-full min-w-0 lg:sticky lg:top-8 lg:self-start`}>
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Your Estimate</h2>

          {result === null ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <CalculatorIcon className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">Ready to calculate</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Fill in all property details and press&nbsp;<span className="font-medium text-slate-500">Calculate Estimate</span>.
              </p>
            </div>
          ) : (
            <>
              {/* Hero — selected finish estimate */}
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4 mb-5">
                <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-1.5">
                  {finishLabel} Finish Estimate
                </p>
                <p className="text-4xl font-bold text-slate-900 tracking-tight">
                  {aud.format(selectedFinishEstimate)}
                </p>
              </div>

              {/* Low / High / Range */}
              <div className="flex flex-col divide-y divide-slate-100 mb-5">
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">Low estimate</span>
                  <span className="text-sm font-medium text-slate-900">{aud.format(result.low)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">High estimate</span>
                  <span className="text-sm font-medium text-slate-900">{aud.format(result.high)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">Cost range</span>
                  <span className="text-sm font-medium text-slate-900">{aud.format(result.high - result.low)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                This estimate is indicative only. Actual construction costs vary based on site
                conditions, contractor pricing, and market conditions at the time of build. Seek
                professional quantity surveyor advice before making financial decisions.
              </p>
            </>
          )}

          {/* ── CTA ────────────────────────────────────────────────────────── */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-900 mb-3">
              Need a detailed cost breakdown?
            </p>
            <button
              type="button"
              className="w-full h-11 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
            >
              Order Initial Cost Report
            </button>
            <button
              type="button"
              className="w-full mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium text-center py-2 hover:underline transition-colors duration-150"
            >
              Email me the results
            </button>
          </div>
        </div>

      </div>

      {/* ── How your estimate is calculated ──────────────────────────────────── */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          How your estimate is calculated
        </h2>

        {result === null ? (
          <div className={`${cardClass} px-6 py-10 text-center`}>
            <p className="text-sm text-slate-400">
              Complete the calculator above to see a detailed explanation of your estimate.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* A — Your inputs */}
            <div className={`${cardClass} p-6`}>
              <HowCardHeader step="A" title="Your inputs" />
              <div className="flex flex-col">
                <DataRow label="Type"          value={typeLabel} />
                {visible.bedrooms && <DataRow label="Bedrooms"     value={String(form.bedrooms)} />}
                <DataRow label="Storeys"        value={String(form.numberOfFloors)} />
                <DataRow label="Area"           value={`${form.floorArea} m²`} />
                {visible.wallType && <DataRow label="Wall type"    value={wallLabel} />}
                <DataRow label="Spec"           value={finishLabel} />
                <DataRow label="Build type"     value={buildLabel} />
                <DataRow label="State &amp; year" value={`${form.investmentPropertyState}, ${form.constructionCompletionYear}`} />
                <div className="flex gap-4 py-2">
                  <span className="text-slate-500 text-sm w-28 shrink-0">Options</span>
                  <div className="flex flex-col gap-0.5">
                    {visibleAddons.map(o => (
                      <span key={o.label} className="text-sm">
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
            <div className={`${cardClass} p-6`}>
              <HowCardHeader step="B" title="How we calculated it" />
              <div className="flex flex-col gap-3 text-sm text-slate-600 leading-relaxed">
                <p>
                  Your {typeLabel} estimate starts from a base construction rate for
                  a <strong className="font-semibold text-slate-800">{finishLabel.toLowerCase()}</strong> finish across{' '}
                  <strong className="font-semibold text-slate-800">{form.floorArea} m²</strong> on{' '}
                  <strong className="font-semibold text-slate-800">{form.numberOfFloors} {floorCount === 1 ? 'floor' : 'floors'}</strong>
                  {visible.bedrooms && bedroomCount > 0
                    ? `, with ${form.bedrooms} ${bedroomCount === 1 ? 'bedroom' : 'bedrooms'}`
                    : ''
                  }
                  {visible.wallType && form.wallType
                    ? ` (${wallLabel.toLowerCase()} construction)`
                    : ''
                  }.
                </p>
                <p>
                  The <strong className="font-semibold text-slate-800">{form.investmentPropertyState}</strong> location and{' '}
                  <strong className="font-semibold text-slate-800">{form.constructionCompletionYear}</strong> completion year apply
                  regional and time-based cost adjustments to the base rate.
                </p>
                {checkedAddons.length > 0 ? (
                  <p>
                    Fixed add-on costs for{' '}
                    <strong className="font-semibold text-slate-800">{joinList(checkedAddons)}</strong> are
                    included in the total.
                  </p>
                ) : (
                  <p>No optional add-ons were selected.</p>
                )}
                <p>
                  The estimate for your selected{' '}
                  <strong className="font-semibold text-slate-800">{finishLabel}</strong> finish
                  is <strong className="font-semibold text-slate-800">{aud.format(selectedFinishEstimate)}</strong>. The low and
                  high figures represent the construction cost range around this value.
                </p>
              </div>
            </div>

            {/* C — What affects your estimate */}
            <div className={`${cardClass} p-6`}>
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
            <div className={`${cardClass} p-6`}>
              <HowCardHeader step="D" title="Totals" />
              <div className="flex flex-col divide-y divide-slate-100">
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">Low estimate</span>
                  <span className="text-sm font-medium text-slate-900">{aud.format(result.low)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">Finish (selected)</span>
                  <span className="text-sm font-semibold text-slate-900">{aud.format(selectedFinishEstimate)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">High estimate</span>
                  <span className="text-sm font-medium text-slate-900">{aud.format(result.high)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">Cost range</span>
                  <span className="text-sm font-medium text-slate-900">{aud.format(result.high - result.low)}</span>
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
