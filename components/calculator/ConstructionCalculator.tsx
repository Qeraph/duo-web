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

// ── Shared field wrappers ─────────────────────────────────────────────────────

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function CheckboxField({ label, id, checked, onChange }: {
  label: string;
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 cursor-pointer"
      />
      <label htmlFor={id} className="text-sm font-medium cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}

const selectClass = 'w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const inputClass  = 'w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

// ── Module-level helpers ──────────────────────────────────────────────────────

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

// Maps the selected finish level to the appropriate estimate value.
// economy → low, standard → mid, premium/luxury → high, default → mid.
function getSelectedFinishEstimate(
  finishLevel: FormState['finishLevel'],
  r: { low: number; mid: number; high: number },
): number {
  if (finishLevel === 'economy')                              return r.low;
  if (finishLevel === 'premium' || finishLevel === 'luxury')  return r.high;
  return r.mid; // standard and fallback
}

function InputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
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

  // Property type change clears values for fields that are no longer visible,
  // so they cannot leak into validation or the calculation.
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

  // Breakdown variables — derived from form state, used in the How section
  const typeLabel    = optionLabel(PROPERTY_TYPE_OPTIONS, form.investmentPropertyType);
  const finishLabel  = optionLabel(FINISH_LEVEL_OPTIONS,  form.finishLevel);
  const buildLabel   = optionLabel(BUILD_TYPE_OPTIONS,    form.buildType);
  const wallLabel    = optionLabel(WALL_TYPE_OPTIONS,     form.wallType);
  const floorCount   = Number(form.numberOfFloors);
  const bedroomCount = Number(form.bedrooms);

  // All visible boolean add-ons in display order
  const visibleAddons = [
    { label: 'Ducted Air-Conditioning', checked: form.ductedAirConditioning },
    ...(visible.basement  ? [{ label: 'Basement',  checked: form.basement  }] : []),
    ...(visible.elevator  ? [{ label: 'Elevator',  checked: form.elevator  }] : []),
    ...(visible.mezzanine ? [{ label: 'Mezzanine', checked: form.mezzanine }] : []),
  ];
  const checkedAddons = visibleAddons.filter(o => o.checked).map(o => o.label.toLowerCase());
  const selectedFinishEstimate = result ? getSelectedFinishEstimate(form.finishLevel, result) : 0;

  return (
    <>
    <div className="flex flex-col md:flex-row gap-8 items-start">

      {/* ── Input panel ──────────────────────────────────────────────────── */}
      <div className="flex-1 w-full border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-semibold mb-5">Property Details</h2>

        <div className="flex flex-col gap-4">

          {/* Always visible */}
          <Field label="Investment Property Type" htmlFor="investmentPropertyType">
            <select
              id="investmentPropertyType"
              value={form.investmentPropertyType}
              onChange={e => handlePropertyTypeChange(e.target.value as FormState['investmentPropertyType'])}
              className={selectClass}
            >
              <option value="">Select…</option>
              {PROPERTY_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          {/* Always visible */}
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
              className={inputClass}
            />
          </Field>

          {/* Always visible */}
          <Field label="Investment Property State" htmlFor="investmentPropertyState">
            <select
              id="investmentPropertyState"
              value={form.investmentPropertyState}
              onChange={e => handleChange('investmentPropertyState', e.target.value as FormState['investmentPropertyState'])}
              className={selectClass}
            >
              <option value="">Select…</option>
              {STATE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          {/* Always visible */}
          <Field label="Build type" htmlFor="buildType">
            <select
              id="buildType"
              value={form.buildType}
              onChange={e => handleChange('buildType', e.target.value as FormState['buildType'])}
              className={selectClass}
            >
              <option value="">Select…</option>
              {BUILD_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          {/* Always visible */}
          <Field label="Spec / finish level" htmlFor="finishLevel">
            <select
              id="finishLevel"
              value={form.finishLevel}
              onChange={e => handleChange('finishLevel', e.target.value as FormState['finishLevel'])}
              className={selectClass}
            >
              <option value="">Select…</option>
              {FINISH_LEVEL_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          {/* Always visible */}
          <Field label="Floor area (m2)" htmlFor="floorArea">
            <input
              type="number"
              id="floorArea"
              value={form.floorArea}
              min={1}
              onChange={e =>
                handleChange('floorArea', e.target.value === '' ? '' : Number(e.target.value))
              }
              className={inputClass}
              placeholder="e.g. 200"
            />
          </Field>

          {/* House, Granny Flat, Townhouse, Apartment, Duplex only */}
          {visible.bedrooms && (
            <Field label="How Many Bedrooms?" htmlFor="bedrooms">
              <select
                id="bedrooms"
                value={form.bedrooms}
                onChange={e => handleChange('bedrooms', e.target.value === '' ? '' : Number(e.target.value) as FormState['bedrooms'])}
                className={selectClass}
              >
                <option value="">Select…</option>
                {BEDROOM_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </Field>
          )}

          {/* Always visible */}
          <Field label="Number of Floors?" htmlFor="numberOfFloors">
            <select
              id="numberOfFloors"
              value={form.numberOfFloors}
              onChange={e => handleChange('numberOfFloors', e.target.value === '' ? '' : Number(e.target.value) as FormState['numberOfFloors'])}
              className={selectClass}
            >
              <option value="">Select…</option>
              {FLOOR_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </Field>

          {/* House, Granny Flat, Townhouse, Duplex only */}
          {visible.wallType && (
            <Field label="Wall Type" htmlFor="wallType">
              <select
                id="wallType"
                value={form.wallType}
                onChange={e => handleChange('wallType', e.target.value as FormState['wallType'])}
                className={selectClass}
              >
                <option value="">Select…</option>
                {WALL_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          )}

          {/* House, Townhouse, Apartment, Office, Warehouse only */}
          {visible.basement && (
            <CheckboxField
              label="Basement"
              id="basement"
              checked={form.basement}
              onChange={v => handleChange('basement', v)}
            />
          )}

          {/* House, Apartment, Office only */}
          {visible.elevator && (
            <CheckboxField
              label="Elevator"
              id="elevator"
              checked={form.elevator}
              onChange={v => handleChange('elevator', v)}
            />
          )}

          {/* Office, Warehouse only */}
          {visible.mezzanine && (
            <CheckboxField
              label="Mezzanine"
              id="mezzanine"
              checked={form.mezzanine}
              onChange={v => handleChange('mezzanine', v)}
            />
          )}

          {/* Always visible */}
          <CheckboxField
            label="Ducted Air-Conditioning"
            id="ductedAirConditioning"
            checked={form.ductedAirConditioning}
            onChange={v => handleChange('ductedAirConditioning', v)}
          />

          <button
            onClick={handleCalculate}
            className="mt-2 w-full bg-blue-600 text-white font-medium rounded px-4 py-2 text-sm hover:bg-blue-700 active:bg-blue-800"
          >
            Calculate
          </button>

          {validationFailed && (
            <p role="alert" className="text-red-600 text-sm">
              Please fill in all required fields before calculating.
            </p>
          )}

        </div>
      </div>

      {/* ── Results panel ────────────────────────────────────────────────── */}
      <div className="flex-1 w-full border border-gray-200 rounded-lg p-6 flex flex-col">
        <h2 className="text-base font-semibold mb-5">Your Estimate</h2>

        {result === null ? (
          <p className="text-gray-500 text-sm">Complete the fields to see your estimate.</p>
        ) : (
          <div className="flex flex-col gap-4">

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-600">Low estimate</span>
                <span className="font-medium">{aud.format(result.low)}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-600">Finish (selected)</span>
                <span className="font-semibold text-lg">{aud.format(selectedFinishEstimate)}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-600">High estimate</span>
                <span className="font-medium">{aud.format(result.high)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm text-gray-600">Cost range</span>
                <span className="font-medium">{aud.format(result.high - result.low)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              This estimate is indicative only. Actual construction costs vary based on site
              conditions, contractor pricing, and market conditions at the time of build. Seek
              professional quantity surveyor advice before making financial decisions.
            </p>

          </div>
        )}

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold mb-3">Need a detailed cost breakdown?</h3>
          <button
            type="button"
            className="w-full bg-blue-600 text-white font-medium rounded px-4 py-2 text-sm hover:bg-blue-700 active:bg-blue-800"
          >
            Order Initial Cost Report
          </button>
          <button
            type="button"
            className="w-full mt-2 text-sm text-blue-600 hover:underline text-center py-1"
          >
            Email me the results
          </button>
        </div>

      </div>

    </div>

    {/* ── How your estimate is calculated ──────────────────────────────────── */}
    <div className="mt-8">
      <h2 className="text-base font-semibold mb-4">How your estimate is calculated</h2>

      {result === null ? (
        <p className="text-sm text-gray-500 border border-gray-200 rounded-lg p-6">
          Complete the calculator to see how your estimate is calculated.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* A. Your inputs */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-3">Your inputs</h3>
            <div className="flex flex-col gap-2 text-sm">
              <InputRow label="Type"            value={typeLabel} />
              {visible.bedrooms && <InputRow label="Bedrooms"    value={String(form.bedrooms)} />}
              <InputRow label="Storeys"          value={String(form.numberOfFloors)} />
              <InputRow label="Area"             value={`${form.floorArea} m²`} />
              {visible.wallType && <InputRow label="Wall"        value={wallLabel} />}
              <InputRow label="Spec"             value={finishLabel} />
              <InputRow label="Build type"       value={buildLabel} />
              <InputRow label="Location & year"  value={`${form.investmentPropertyState}, ${form.constructionCompletionYear}`} />
              <div className="flex gap-3">
                <span className="text-gray-500 w-32 shrink-0">Options</span>
                <span className="text-gray-900 leading-relaxed">
                  {visibleAddons.map((o, i) => (
                    <span key={o.label}>
                      {i > 0 && <span className="text-gray-300 mx-1">·</span>}
                      {o.label}:{' '}
                      <span className={o.checked ? 'text-green-700 font-medium' : ''}>
                        {o.checked ? 'Yes' : 'No'}
                      </span>
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>

          {/* B. How we calculated it */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-3">How we calculated it</h3>
            <div className="flex flex-col gap-2 text-sm text-gray-700">
              <p>
                Your {typeLabel} estimate starts from a base construction rate for
                a <strong>{finishLabel.toLowerCase()}</strong> finish across{' '}
                <strong>{form.floorArea} m²</strong> on{' '}
                <strong>{form.numberOfFloors} {floorCount === 1 ? 'floor' : 'floors'}</strong>
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
                The <strong>{form.investmentPropertyState}</strong> location and{' '}
                <strong>{form.constructionCompletionYear}</strong> completion year apply
                regional and time-based cost adjustments to the base rate.
              </p>
              {checkedAddons.length > 0 ? (
                <p>
                  Fixed add-on costs for <strong>{joinList(checkedAddons)}</strong> are
                  included in the total.
                </p>
              ) : (
                <p>No optional add-ons were selected.</p>
              )}
              <p>
                The estimate for your selected <strong>{finishLabel}</strong> finish
                is <strong>{aud.format(selectedFinishEstimate)}</strong>. The low and
                high figures represent the construction cost range around this value.
              </p>
            </div>
          </div>

          {/* C. What affects your estimate */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-3">What affects your estimate</h3>
            <ul className="flex flex-col gap-1.5 text-sm text-gray-700 list-disc list-inside marker:text-gray-400">
              <li>Property type sets the base construction rate per m².</li>
              <li>Floor area scales the total cost proportionally.</li>
              <li>Finish level applies a multiplier across the entire build cost.</li>
              <li>Build type adds a complexity premium for knockdown rebuilds or extensions.</li>
              {visible.bedrooms && (
                <li>Bedroom count adjusts for additional wet areas and joinery.</li>
              )}
              {visible.wallType && (
                <li>Wall type adds or reduces the per-m² cost.</li>
              )}
              <li>State and completion year apply regional and time-based cost indices.</li>
              <li>
                Add-ons ({visibleAddons.map(o => o.label).join(', ')}) each add a fixed
                cost when selected.
              </li>
              <li>Land price is not included in any estimate.</li>
            </ul>
          </div>

          {/* D. Totals */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-3">Totals</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-600">Low estimate</span>
                <span className="text-sm font-medium">{aud.format(result.low)}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-600">Finish (selected)</span>
                <span className="font-semibold">{aud.format(selectedFinishEstimate)}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-600">High estimate</span>
                <span className="text-sm font-medium">{aud.format(result.high)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm text-gray-600">Cost range</span>
                <span className="text-sm font-medium">{aud.format(result.high - result.low)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Indicative only. Not a final construction quote. Land price excluded.
            </p>
          </div>

        </div>
      )}
    </div>
    </>
  );
}
