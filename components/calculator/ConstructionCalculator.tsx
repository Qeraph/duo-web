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
    <p className="text-[11px] font-semibold tracking-[0.10em] text-slate-500 uppercase mb-4">
      {children}
    </p>
  );
}

// Individual field label
function Field({ label, htmlFor, children, error }: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={`text-xs font-medium leading-none ${error ? 'text-red-500' : 'text-slate-700'}`}>
        {label}{error && <span className="ml-1.5 text-red-400 font-normal">required</span>}
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
  hint,
}: {
  label: string;
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
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
      <span className="flex-1 min-w-0">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="ml-1.5 text-[10px] font-normal text-slate-500">{hint}</span>}
      </span>
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

// ── Property Preview — premium SVG building + metadata strip ─────────────────

// SVG coordinate system: viewBox "0 0 280 150", ground at y=118
const SV_VB = '0 0 280 150';
const SV_G  = 118;

// Shared colour tokens — architectural render palette
const SVC = {
  body:  'rgba(232,236,242,0.96)',   // light grey-white facade
  bodyS: 'rgba(150,165,180,0.40)',   // subtle facade edge
  roof:  'rgba(38,42,50,0.92)',      // charcoal roof
  roofS: 'rgba(55,62,74,0.50)',      // charcoal roof edge
  win:   'rgba(14,20,34,0.82)',      // near-black window glass
  winS:  'rgba(10,15,26,0.50)',      // dark window frame
  gls:   'rgba(78,116,172,0.56)',    // office curtain-wall glass
  glsS:  'rgba(48,80,130,0.44)',     // office glass frame
  gnd:   'rgba(145,158,172,0.40)',   // ground line
  slab:  'rgba(175,188,200,0.22)',   // floor/slab line
  base:  'rgba(100,112,126,0.70)',   // basement concrete
  baseS: 'rgba(82,96,112,0.52)',     // basement edge
  elev:  'rgba(205,215,228,0.30)',   // elevator shaft
  elvS:  'rgba(130,148,168,0.40)',   // elevator edge
  mezz:  'rgba(72,128,210,0.44)',    // mezzanine dashed line
  flow:  'rgba(72,138,224,0.34)',    // ducted AC airflow
  door:  'rgba(178,102,44,0.88)',    // warm timber/orange entry
  doorS: 'rgba(138,78,30,0.68)',     // entry door edge
  drv:   'rgba(165,175,186,0.22)',   // driveway / ground plane
  lawn:  'rgba(68,116,55,0.28)',     // landscape strip
};

// Wall texture — brick courses or concrete panel joints rendered as inline lines
function SvgTex({ x, y, w, h, wt }: { x:number; y:number; w:number; h:number; wt:string }) {
  if (!wt) return null;
  if (wt === 'concrete') {
    const elems: React.ReactElement[] = [];
    for (let px = x + 28; px < x + w - 4; px += 28)
      elems.push(<line key={px} x1={px} y1={y+1} x2={px} y2={y+h-1} stroke="rgba(120,138,158,0.18)" strokeWidth="0.75"/>);
    return <>{elems}</>;
  }
  const sp = wt === 'double_brick' ? 4.5 : 6.5;
  const sc = wt === 'double_brick' ? 'rgba(162,95,58,0.22)' : 'rgba(178,128,82,0.17)';
  const elems: React.ReactElement[] = [];
  for (let py = y + sp; py < y + h - 1; py += sp)
    elems.push(<line key={py} x1={x+1} y1={py} x2={x+w-1} y2={py} stroke={sc} strokeWidth="0.5"/>);
  return <>{elems}</>;
}

// Window rect + architectural sill line below
function WinSill({ x, y, w = 18, h = 14 }: { x:number; y:number; w?:number; h?:number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={SVC.win} stroke={SVC.winS} strokeWidth="0.75" rx="0.5"/>
      <rect x={x-1} y={y+h} width={w+2} height={2} fill="rgba(155,168,182,0.42)" strokeWidth="0"/>
    </g>
  );
}

// Animated airflow lines: base = y of lowest line, step = upward spacing
function SvgFlow({ x1, x2, base, n, step }: { x1:number; x2:number; base:number; n:number; step:number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <line key={i} className="prop-airflow-path"
          x1={x1} y1={base - i*step} x2={x2} y2={base - i*step}
          stroke={SVC.flow} strokeWidth="0.8" strokeDasharray="7 7"
          style={{ animationDelay: `${i*0.5}s` }}/>
      ))}
    </>
  );
}

// ── House — wide detached, pitched roof, integral garage ──────────────────────

function HouseSvg({ fn, basement, elevator, mezzanine, ducted, wallType }: {
  fn:number; basement:boolean; elevator:boolean; mezzanine:boolean; ducted:boolean; wallType:string;
}) {
  const G = SV_G, FH = 30, BL = 8, BR = 196, rH = 26;
  const wT = G - fn*FH;
  const eX = BR - 20, eW = 20;
  const upperWxs = [20, 62, 106, ...(elevator ? [] : [150])] as number[];
  return (
    <svg viewBox={SV_VB} fill="none" className="prop-breathe w-full" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx={116} cy={G+3} rx={124} ry={5} fill="rgba(0,0,0,0.09)"/>
      {/* Driveway */}
      <rect x={194} y={G-2} width={70} height={4} fill={SVC.drv} strokeWidth="0" rx="1"/>
      {/* Lawn */}
      <rect x={BL} y={G-2} width={90} height={3} fill={SVC.lawn} strokeWidth="0"/>
      {basement && <rect x={BL} y={G} width={BR-BL} height={20} fill={SVC.base} stroke={SVC.baseS} strokeWidth="1"/>}
      {/* Main facade */}
      <rect x={BL} y={wT} width={BR-BL} height={fn*FH} fill={SVC.body} stroke={SVC.bodyS} strokeWidth="1"/>
      <SvgTex x={BL+1} y={wT+1} w={BR-BL-2} h={fn*FH-2} wt={wallType}/>
      {elevator && <rect x={eX} y={wT} width={eW} height={fn*FH} fill={SVC.elev} stroke={SVC.elvS} strokeWidth="1"/>}
      {/* Belt course between floors */}
      {fn > 1 && Array.from({ length: fn-1 }).map((_, i) => (
        <rect key={i} x={BL} y={G-(i+1)*FH-2} width={BR-BL} height={3}
          fill="rgba(215,220,228,0.55)" stroke={SVC.bodyS} strokeWidth="0.5"/>
      ))}
      {/* Charcoal pitched roof — steeper, wider overhang */}
      <polygon points={`${BL-12},${wT} 102,${wT-rH} ${BR+12},${wT}`} fill={SVC.roof} stroke={SVC.roofS} strokeWidth="1"/>
      {/* Fascia board at eave */}
      <line x1={BL-12} y1={wT} x2={BR+12} y2={wT} stroke="rgba(20,24,32,0.55)" strokeWidth="1.5"/>
      {/* Chimney at right slope */}
      <rect x={130} y={wT-rH+6} width={9} height={rH-2} fill="rgba(50,56,68,0.88)" stroke="rgba(25,28,36,0.35)" strokeWidth="0.75"/>
      <rect x={128} y={wT-rH+4} width={13} height={4} fill="rgba(35,40,50,0.82)" strokeWidth="0"/>
      {/* Garage */}
      <rect x={198} y={G-44} width={52} height={44} fill={SVC.body} stroke={SVC.bodyS} strokeWidth="1"/>
      <SvgTex x={199} y={G-43} w={50} h={42} wt={wallType}/>
      {/* Garage parapet */}
      <rect x={196} y={G-47} width={56} height={5} fill={SVC.roof} stroke={SVC.roofS} strokeWidth="0.75"/>
      {/* Garage roller door — dark with prominent tracks */}
      <rect x={200} y={G-34} width={46} height={34} fill="rgba(40,44,52,0.88)" stroke="rgba(20,24,30,0.5)" strokeWidth="0.75" rx="0.5"/>
      <line x1={200} y1={G-34} x2={200} y2={G} stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"/>
      <line x1={246} y1={G-34} x2={246} y2={G} stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"/>
      {[G-26, G-18, G-10].map(py => (
        <line key={py} x1={201} y1={py} x2={245} y2={py} stroke="rgba(255,255,255,0.09)" strokeWidth="0.5"/>
      ))}
      <line x1={223} y1={G-34} x2={223} y2={G} stroke="rgba(255,255,255,0.07)" strokeWidth="0.4"/>
      {/* Ground floor windows */}
      <WinSill x={20} y={G-FH+6} w={22} h={16}/>
      <WinSill x={50} y={G-FH+6} w={22} h={16}/>
      {/* Entry canopy */}
      <rect x={76} y={G-27} width={40} height={4} fill={SVC.roof} strokeWidth="0" rx="0.5"/>
      <line x1={74} y1={G-27} x2={118} y2={G-27} stroke="rgba(20,24,32,0.4)" strokeWidth="0.75"/>
      {/* Entry door */}
      <rect x={84} y={G-25} width={26} height={25} fill={SVC.door} stroke={SVC.doorS} strokeWidth="0.75" rx="0.5"/>
      <line x1={97} y1={G-25} x2={97} y2={G} stroke={SVC.doorS} strokeWidth="0.5"/>
      <circle cx={104} cy={G-12} r={1.3} fill="rgba(255,224,150,0.88)"/>
      {/* Entry step */}
      <rect x={80} y={G} width={32} height={3} fill="rgba(162,172,184,0.35)" rx="1" strokeWidth="0"/>
      {!elevator && <WinSill x={126} y={G-FH+6} w={22} h={16}/>}
      {!elevator && <WinSill x={155} y={G-FH+6} w={22} h={16}/>}
      {/* Upper floor windows */}
      {Array.from({ length: fn-1 }).map((_, fl) => {
        const f = fl + 1, wy = G - (f+1)*FH + 6;
        return upperWxs.map((wx, wi) => (
          <WinSill key={`${f}-${wi}`} x={wx} y={wy} w={22} h={16}/>
        ));
      })}
      {mezzanine && <line x1={BL+6} y1={G-Math.round(FH*0.52)} x2={elevator?eX-4:BR-6} y2={G-Math.round(FH*0.52)} stroke={SVC.mezz} strokeWidth="1" strokeDasharray="5 3"/>}
      {ducted && <SvgFlow x1={BL+10} x2={elevator?eX-5:BR-10} base={G-8} n={3} step={10}/>}
      <line x1={4} y1={G} x2={262} y2={G} stroke={SVC.gnd} strokeWidth="1"/>
    </svg>
  );
}

// ── Granny Flat — compact single-storey, yard fence hints ────────────────────

function GrannyFlatSvg({ basement, elevator, mezzanine, ducted, wallType }: {
  basement:boolean; elevator:boolean; mezzanine:boolean; ducted:boolean; wallType:string;
}) {
  const G = SV_G, FH = 34, BL = 78, BR = 202, rH = 20;
  const wT = G - FH;
  const mid = Math.round((BL + BR) / 2);
  return (
    <svg viewBox={SV_VB} fill="none" className="prop-breathe w-full" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx={mid} cy={G+3} rx={80} ry={4} fill="rgba(0,0,0,0.10)"/>
      {/* Lawn strip */}
      <rect x={BL-18} y={G-2} width={BR-BL+36} height={3} fill={SVC.lawn} strokeWidth="0"/>
      {/* Garden beds */}
      <rect x={BL-16} y={G-7} width={14} height={6} fill="rgba(80,115,55,0.22)" strokeWidth="0" rx="0.5"/>
      <rect x={BR+2}  y={G-7} width={14} height={6} fill="rgba(80,115,55,0.22)" strokeWidth="0" rx="0.5"/>
      {/* Fence posts — left */}
      {[50,58,66].map(fx => <line key={fx} x1={fx} y1={G-11} x2={fx} y2={G+2} stroke="rgba(175,185,198,0.35)" strokeWidth="1.2"/>)}
      <line x1={48} y1={G-6} x2={68} y2={G-6} stroke="rgba(175,185,198,0.30)" strokeWidth="0.75"/>
      <line x1={48} y1={G-10} x2={68} y2={G-10} stroke="rgba(175,185,198,0.20)" strokeWidth="0.5"/>
      {/* Fence posts — right */}
      {[214,222,230].map(fx => <line key={fx} x1={fx} y1={G-11} x2={fx} y2={G+2} stroke="rgba(175,185,198,0.35)" strokeWidth="1.2"/>)}
      <line x1={212} y1={G-6} x2={232} y2={G-6} stroke="rgba(175,185,198,0.30)" strokeWidth="0.75"/>
      <line x1={212} y1={G-10} x2={232} y2={G-10} stroke="rgba(175,185,198,0.20)" strokeWidth="0.5"/>
      {basement && <rect x={BL} y={G} width={BR-BL} height={20} fill={SVC.base} stroke={SVC.baseS} strokeWidth="1"/>}
      {/* Facade */}
      <rect x={BL} y={wT} width={BR-BL} height={FH} fill={SVC.body} stroke={SVC.bodyS} strokeWidth="1"/>
      <SvgTex x={BL+1} y={wT+1} w={BR-BL-2} h={FH-2} wt={wallType}/>
      {elevator && <rect x={BR-15} y={wT} width={15} height={FH} fill={SVC.elev} stroke={SVC.elvS} strokeWidth="0.75"/>}
      {/* Pitched charcoal roof — wider overhang */}
      <polygon points={`${BL-12},${wT} ${mid},${wT-rH} ${BR+12},${wT}`} fill={SVC.roof} stroke={SVC.roofS} strokeWidth="1"/>
      {/* Fascia board */}
      <line x1={BL-12} y1={wT} x2={BR+12} y2={wT} stroke="rgba(20,24,32,0.50)" strokeWidth="1.5"/>
      {/* Windows — wider with sills */}
      <WinSill x={88} y={wT+7} w={22} h={14}/>
      <WinSill x={166} y={wT+7} w={22} h={14}/>
      {/* Entry canopy */}
      <rect x={127} y={G-26} width={26} height={3} fill={SVC.roof} strokeWidth="0" rx="0.5"/>
      <line x1={125} y1={G-26} x2={155} y2={G-26} stroke="rgba(20,24,32,0.40)" strokeWidth="0.75"/>
      {/* Entry door */}
      <rect x={131} y={G-24} width={18} height={24} fill={SVC.door} stroke={SVC.doorS} strokeWidth="0.75" rx="0.5"/>
      <line x1={140} y1={G-24} x2={140} y2={G} stroke={SVC.doorS} strokeWidth="0.4"/>
      <circle cx={146} cy={G-12} r={1.1} fill="rgba(255,224,150,0.88)"/>
      {/* Entry step + path */}
      <rect x={133} y={G} width={14} height={3} fill="rgba(162,172,184,0.35)" strokeWidth="0"/>
      <line x1={140} y1={G+3} x2={140} y2={G+9} stroke={SVC.drv} strokeWidth="3"/>
      {mezzanine && <line x1={BL+5} y1={wT+Math.round(FH*0.5)} x2={elevator?BR-17:BR-5} y2={wT+Math.round(FH*0.5)} stroke={SVC.mezz} strokeWidth="1" strokeDasharray="4 3"/>}
      {ducted && <SvgFlow x1={BL+8} x2={elevator?BR-17:BR-8} base={G-9} n={2} step={10}/>}
      <line x1={4} y1={G} x2={275} y2={G} stroke={SVC.gnd} strokeWidth="1"/>
    </svg>
  );
}

// ── Townhouse — three narrow row-house units, vertical emphasis ───────────────

function TownhouseSvg({ fn, basement, elevator, mezzanine, ducted, wallType }: {
  fn:number; basement:boolean; elevator:boolean; mezzanine:boolean; ducted:boolean; wallType:string;
}) {
  const G = SV_G, FH = 28, FN = Math.max(2, Math.min(3, fn)), rH = 15;
  const wT = G - FN*FH;
  const units = [{ BL:54, BR:100 }, { BL:102, BR:148 }, { BL:150, BR:194 }];
  return (
    <svg viewBox={SV_VB} fill="none" className="prop-breathe w-full" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx={124} cy={G+3} rx={90} ry={4} fill="rgba(0,0,0,0.11)"/>
      {/* Street paving */}
      <rect x={50} y={G-1} width={148} height={3} fill={SVC.drv} strokeWidth="0" rx="0.5"/>
      {/* Landscape strip */}
      <rect x={50} y={G-3} width={148} height={2} fill={SVC.lawn} strokeWidth="0"/>
      {basement && <rect x={50} y={G} width={148} height={20} fill={SVC.base} stroke={SVC.baseS} strokeWidth="1"/>}
      {units.map((u, ui) => {
        const cx = Math.round((u.BL + u.BR) / 2);
        const uW = u.BR - u.BL;
        return (
          <g key={ui} opacity={ui === 2 ? 0.38 : 1}>
            {/* Facade */}
            <rect x={u.BL} y={wT} width={uW} height={FN*FH} fill={SVC.body} stroke={SVC.bodyS} strokeWidth="1"/>
            <SvgTex x={u.BL+1} y={wT+1} w={uW-2} h={FN*FH-2} wt={wallType}/>
            {/* Charcoal pitched roof — steeper */}
            <polygon points={`${u.BL-3},${wT} ${cx},${wT-rH} ${u.BR+3},${wT}`} fill={SVC.roof} stroke={SVC.roofS} strokeWidth="1"/>
            <line x1={u.BL-3} y1={wT} x2={u.BR+3} y2={wT} stroke="rgba(20,24,32,0.45)" strokeWidth="1.2"/>
            {/* Belt course between floors */}
            {Array.from({ length: FN-1 }).map((_, i) => (
              <rect key={i} x={u.BL} y={G-(i+1)*FH-1} width={uW} height={2.5}
                fill="rgba(210,216,225,0.55)" stroke={SVC.bodyS} strokeWidth="0.5"/>
            ))}
            {/* Balcony slab — protrudes slightly */}
            {FN > 1 && (
              <rect x={u.BL-2} y={G-FH-2} width={uW+4} height={3}
                fill="rgba(200,208,218,0.55)" stroke={SVC.bodyS} strokeWidth="0.5"/>
            )}
            {/* Ground floor: warm entry door */}
            <rect x={cx-9} y={G-22} width={18} height={22} fill={SVC.door} stroke={SVC.doorS} strokeWidth="0.75" rx="0.5"/>
            <line x1={cx} y1={G-22} x2={cx} y2={G} stroke={SVC.doorS} strokeWidth="0.4"/>
            <circle cx={cx+6} cy={G-11} r={1} fill="rgba(255,224,150,0.85)"/>
            {/* Upper floor windows with sills */}
            {Array.from({ length: FN-1 }).map((_, fl) => {
              const wy = G - (fl+2)*FH + 7;
              return <WinSill key={fl} x={cx-9} y={wy} w={18} h={15}/>;
            })}
          </g>
        );
      })}
      {elevator && <rect x={144} y={wT} width={8} height={FN*FH} fill={SVC.elev} stroke={SVC.elvS} strokeWidth="1"/>}
      {mezzanine && <line x1={54} y1={G-Math.round(FH*0.52)} x2={148} y2={G-Math.round(FH*0.52)} stroke={SVC.mezz} strokeWidth="1" strokeDasharray="4 3"/>}
      {ducted && <SvgFlow x1={58} x2={elevator?140:148} base={G-8} n={3} step={9}/>}
      <line x1={4} y1={G} x2={275} y2={G} stroke={SVC.gnd} strokeWidth="1"/>
    </svg>
  );
}

// ── Apartment — residential tower, repeated window grid, podium ───────────────

function ApartmentSvg({ basement, elevator, mezzanine, ducted }: {
  basement:boolean; elevator:boolean; mezzanine:boolean; ducted:boolean;
}) {
  const G = SV_G, NF = 6, FH = 13, podH = 18;
  const BL = 92, BR = 188, tW = BR - BL;
  const wT = G - podH - NF*FH;
  const eX = Math.round((BL + BR) / 2) - 6, eW = 12;
  const mid = Math.round((BL+BR)/2);
  // 4 evenly-spaced windows per floor
  const winXs = elevator
    ? [BL+7, BL+22, eX+eW+3, BR-18]
    : [BL+11, BL+29, BL+47, BL+65];
  return (
    <svg viewBox={SV_VB} fill="none" className="prop-breathe w-full" aria-hidden="true">
      {/* Shadow */}
      <ellipse cx={mid} cy={G+3} rx={64} ry={4} fill="rgba(0,0,0,0.13)"/>
      {/* Landscape */}
      <rect x={78} y={G-2} width={tW+28} height={3} fill={SVC.lawn} strokeWidth="0"/>
      {basement && <rect x={82} y={G} width={tW+24} height={20} fill={SVC.base} stroke={SVC.baseS} strokeWidth="1"/>}
      {/* Tower */}
      <rect x={BL} y={wT} width={tW} height={NF*FH} fill={SVC.body} stroke={SVC.bodyS} strokeWidth="1"/>
      {elevator && <rect x={eX} y={wT} width={eW} height={NF*FH} fill={SVC.elev} stroke={SVC.elvS} strokeWidth="1"/>}
      {/* Window grid + balcony slabs */}
      {Array.from({ length: NF }).map((_, f) => {
        const wy = wT + f*FH + 2, wh = FH - 5;
        return (
          <g key={f}>
            {/* Balcony slab at each floor junction */}
            <rect x={BL-2} y={wT+(f+1)*FH-1} width={tW+4} height={2.5}
              fill="rgba(198,206,218,0.55)" stroke={SVC.bodyS} strokeWidth="0.5"/>
            {winXs.map((wx, wi) => (
              <rect key={wi} x={wx} y={wy} width={10} height={wh}
                fill={SVC.win} stroke={SVC.winS} strokeWidth="0.5" rx="0.3"/>
            ))}
          </g>
        );
      })}
      {/* Parapet cap + rooftop plant room */}
      <rect x={BL-2} y={wT-4} width={tW+4} height={4} fill={SVC.roof} stroke={SVC.roofS} strokeWidth="1"/>
      <rect x={mid-18} y={wT-16} width={36} height={12} fill={SVC.roof} stroke={SVC.roofS} strokeWidth="0.75"/>
      <rect x={mid-11} y={wT-16} width={8} height={4} fill={SVC.win} stroke={SVC.winS} strokeWidth="0.5"/>
      {/* Podium */}
      <rect x={82} y={G-podH} width={tW+24} height={podH} fill={SVC.body} stroke={SVC.bodyS} strokeWidth="1"/>
      <rect x={86}  y={G-podH+3} width={20} height={podH-5} fill={SVC.win} stroke={SVC.winS} strokeWidth="0.75" rx="0.3"/>
      <rect x={174} y={G-podH+3} width={18} height={podH-5} fill={SVC.win} stroke={SVC.winS} strokeWidth="0.75" rx="0.3"/>
      {/* Lobby entry — warm accent */}
      <rect x={mid-9} y={G-podH+1} width={18} height={podH-1} fill={SVC.door} stroke={SVC.doorS} strokeWidth="0.75" rx="0.3"/>
      <line x1={mid} y1={G-podH+1} x2={mid} y2={G} stroke={SVC.doorS} strokeWidth="0.4"/>
      {mezzanine && <line x1={BL+4} y1={G-podH-Math.round(FH*1.6)} x2={elevator?eX-3:BR-4} y2={G-podH-Math.round(FH*1.6)} stroke={SVC.mezz} strokeWidth="1" strokeDasharray="3 2"/>}
      {ducted && <SvgFlow x1={BL+5} x2={elevator?eX-3:BR-5} base={G-podH-5} n={3} step={FH}/>}
      <line x1={4} y1={G} x2={275} y2={G} stroke={SVC.gnd} strokeWidth="1"/>
    </svg>
  );
}

// ── Office — curtain-wall glass corporate tower ───────────────────────────────

function OfficeSvg({ basement, elevator, mezzanine, ducted }: {
  basement:boolean; elevator:boolean; mezzanine:boolean; ducted:boolean;
}) {
  const G = SV_G, NF = 5, FH = 16;
  const BL = 86, BR = 194, tW = BR - BL;
  const wT = G - NF*FH;
  const eX = Math.round((BL+BR)/2) - 6, eW = 12;
  const mullions = [BL+26, BL+52, BL+78, BL+104].filter(x => x < BR-4);
  const mid = Math.round((BL+BR)/2);
  return (
    <svg viewBox={SV_VB} fill="none" className="prop-breathe w-full" aria-hidden="true">
      {/* Shadow */}
      <ellipse cx={mid} cy={G+3} rx={66} ry={4} fill="rgba(0,0,0,0.12)"/>
      {/* Concrete plaza */}
      <rect x={BL-14} y={G-2} width={tW+28} height={4} fill={SVC.drv} strokeWidth="0" rx="0.5"/>
      {basement && <rect x={BL-8} y={G} width={tW+16} height={20} fill={SVC.base} stroke={SVC.baseS} strokeWidth="1"/>}
      {/* Structural corner columns */}
      <rect x={BL} y={wT} width={8} height={NF*FH} fill="rgba(210,215,222,0.60)" stroke={SVC.bodyS} strokeWidth="0.75"/>
      <rect x={BR-8} y={wT} width={8} height={NF*FH} fill="rgba(210,215,222,0.60)" stroke={SVC.bodyS} strokeWidth="0.75"/>
      {/* Facade infill */}
      <rect x={BL+8} y={wT} width={tW-16} height={NF*FH} fill={SVC.body} stroke={SVC.bodyS} strokeWidth="0.75"/>
      {/* Curtain-wall glass per floor */}
      {Array.from({ length: NF }).map((_, f) => {
        const fy = wT + f*FH;
        return (
          <g key={f}>
            <rect x={BL+10} y={fy+2} width={tW-20} height={FH-4} fill={SVC.gls} stroke={SVC.glsS} strokeWidth="0.75"/>
            {mullions.map(mx => (
              <line key={mx} x1={mx} y1={fy+2} x2={mx} y2={fy+FH-2} stroke="rgba(200,218,240,0.20)" strokeWidth="0.5"/>
            ))}
            {/* Spandrel band at floor junction */}
            <rect x={BL+10} y={fy+FH-3} width={tW-20} height={3} fill="rgba(175,192,215,0.28)" strokeWidth="0"/>
          </g>
        );
      })}
      {elevator && <rect x={eX} y={wT} width={eW} height={NF*FH} fill={SVC.elev} stroke={SVC.elvS} strokeWidth="1"/>}
      {/* Signage band / cornice */}
      <rect x={BL-6} y={wT-8} width={tW+12} height={8} fill="rgba(36,42,54,0.88)" stroke="rgba(20,24,32,0.40)" strokeWidth="0.75"/>
      {/* Roof parapet */}
      <rect x={BL-2} y={wT-13} width={tW+4} height={5} fill={SVC.roof} stroke={SVC.roofS} strokeWidth="0.75"/>
      {/* Wider lobby */}
      <rect x={BL-12} y={G-20} width={tW+24} height={20} fill={SVC.body} stroke={SVC.bodyS} strokeWidth="1"/>
      <rect x={BL-9}  y={G-17} width={tW+18} height={14} fill={SVC.gls} stroke={SVC.glsS} strokeWidth="1"/>
      {[BL-6, BL+22, BL+50, BL+78, BL+106].filter(mx => mx < BR+12).map((mx, i) => (
        <line key={i} x1={mx} y1={G-17} x2={mx} y2={G-3} stroke="rgba(200,218,240,0.18)" strokeWidth="0.5"/>
      ))}
      {/* Entry door */}
      <rect x={mid-9} y={G-17} width={18} height={17} fill={SVC.door} stroke={SVC.doorS} strokeWidth="0.75" rx="0.3"/>
      <line x1={mid} y1={G-17} x2={mid} y2={G} stroke={SVC.doorS} strokeWidth="0.4"/>
      {mezzanine && <line x1={BL+4} y1={wT+Math.round(FH*1.5)} x2={elevator?eX-3:BR-4} y2={wT+Math.round(FH*1.5)} stroke={SVC.mezz} strokeWidth="1" strokeDasharray="3 2"/>}
      {ducted && <SvgFlow x1={BL+5} x2={elevator?eX-3:BR-5} base={G-24} n={3} step={FH}/>}
      <line x1={4} y1={G} x2={275} y2={G} stroke={SVC.gnd} strokeWidth="1"/>
    </svg>
  );
}

// ── Warehouse — wide industrial shed, roller doors, skylights ────────────────

function WarehouseSvg({ basement, mezzanine, ducted }: {
  basement:boolean; mezzanine:boolean; ducted:boolean;
}) {
  const G = SV_G, BL = 5, BR = 273, BH = 44, rH = 14;
  const wT = G - BH;
  const mid = Math.round((BL + BR) / 2);
  return (
    <svg viewBox={SV_VB} fill="none" className="prop-breathe w-full" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx={mid} cy={G+3} rx={144} ry={5} fill="rgba(0,0,0,0.11)"/>
      {/* Concrete apron */}
      <rect x={BL} y={G-2} width={BR-BL} height={5} fill={SVC.drv} strokeWidth="0"/>
      {/* Loading dock platforms */}
      <rect x={20} y={G-4} width={62} height={6} fill="rgba(150,162,175,0.30)" strokeWidth="0" rx="1"/>
      <rect x={186} y={G-4} width={62} height={6} fill="rgba(150,162,175,0.30)" strokeWidth="0" rx="1"/>
      {basement && <rect x={BL} y={G} width={BR-BL} height={20} fill={SVC.base} stroke={SVC.baseS} strokeWidth="1"/>}
      {/* Shed body */}
      <rect x={BL} y={wT} width={BR-BL} height={BH} fill={SVC.body} stroke={SVC.bodyS} strokeWidth="1"/>
      {/* Charcoal roof — steeper */}
      <polygon points={`${BL},${wT} ${mid},${wT-rH} ${BR},${wT}`} fill={SVC.roof} stroke={SVC.roofS} strokeWidth="1"/>
      {/* Fascia board */}
      <line x1={BL} y1={wT} x2={BR} y2={wT} stroke="rgba(20,24,32,0.45)" strokeWidth="1.5"/>
      {/* Skylights — wider */}
      <rect x={84}  y={wT-9} width={22} height={8} fill={SVC.win} stroke={SVC.winS} strokeWidth="0.75" rx="0.75"/>
      <line x1={95}  y1={wT-9} x2={95}  y2={wT-1} stroke="rgba(255,255,255,0.09)" strokeWidth="0.4"/>
      <rect x={160} y={wT-9} width={22} height={8} fill={SVC.win} stroke={SVC.winS} strokeWidth="0.75" rx="0.75"/>
      <line x1={171} y1={wT-9} x2={171} y2={wT-1} stroke="rgba(255,255,255,0.09)" strokeWidth="0.4"/>
      {/* Structural bay columns */}
      <line x1={108} y1={wT} x2={108} y2={G} stroke="rgba(135,148,165,0.25)" strokeWidth="2"/>
      <line x1={170} y1={wT} x2={170} y2={G} stroke="rgba(135,148,165,0.25)" strokeWidth="2"/>
      {/* Left roller door — track guides */}
      <line x1={20} y1={G-38} x2={20} y2={G} stroke="rgba(120,132,148,0.40)" strokeWidth="2.5"/>
      <line x1={82} y1={G-38} x2={82} y2={G} stroke="rgba(120,132,148,0.40)" strokeWidth="2.5"/>
      <rect x={20} y={G-38} width={62} height={38} fill="rgba(38,42,52,0.88)" stroke="rgba(20,24,30,0.5)" strokeWidth="0.75" rx="0.5"/>
      <line x1={51} y1={G-38} x2={51} y2={G} stroke="rgba(255,255,255,0.09)" strokeWidth="0.5"/>
      {[G-29,G-20,G-11].map(py => <line key={py} x1={21} y1={py} x2={81} y2={py} stroke="rgba(255,255,255,0.09)" strokeWidth="0.5"/>)}
      {/* High-bay clerestory */}
      <rect x={116} y={wT+6} width={46} height={18} fill={SVC.win} stroke={SVC.winS} strokeWidth="0.75" rx="0.3"/>
      <line x1={139} y1={wT+6} x2={139} y2={wT+24} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
      {/* Right roller door — track guides */}
      <line x1={186} y1={G-38} x2={186} y2={G} stroke="rgba(120,132,148,0.40)" strokeWidth="2.5"/>
      <line x1={248} y1={G-38} x2={248} y2={G} stroke="rgba(120,132,148,0.40)" strokeWidth="2.5"/>
      <rect x={186} y={G-38} width={62} height={38} fill="rgba(38,42,52,0.88)" stroke="rgba(20,24,30,0.5)" strokeWidth="0.75" rx="0.5"/>
      <line x1={217} y1={G-38} x2={217} y2={G} stroke="rgba(255,255,255,0.09)" strokeWidth="0.5"/>
      {[G-29,G-20,G-11].map(py => <line key={py} x1={187} y1={py} x2={247} y2={py} stroke="rgba(255,255,255,0.09)" strokeWidth="0.5"/>)}
      {mezzanine && <line x1={BL+22} y1={wT+Math.round(BH*0.5)} x2={BR-22} y2={wT+Math.round(BH*0.5)} stroke={SVC.mezz} strokeWidth="1" strokeDasharray="5 3"/>}
      {ducted && <SvgFlow x1={BL+10} x2={BR-10} base={wT+26} n={3} step={9}/>}
      <line x1={4} y1={G} x2={275} y2={G} stroke={SVC.gnd} strokeWidth="1"/>
    </svg>
  );
}

// ── Default placeholder — blueprint frame shown before type is selected ───────

function DefaultPreviewSvg() {
  const G = SV_G;
  const corners: [number, number][] = [[60, G-72], [220, G-72], [60, G], [220, G]];
  return (
    <svg viewBox={SV_VB} fill="none" className="w-full" aria-hidden="true">
      {/* Ground */}
      <line x1={18} y1={G} x2={262} y2={G} stroke="rgba(147,197,253,0.18)" strokeWidth="0.75"/>
      {/* Building outline */}
      <rect x={60} y={G-72} width={160} height={72}
        stroke="rgba(147,197,253,0.20)" strokeWidth="0.75" strokeDasharray="5 3"/>
      {/* Roof */}
      <polygon points={`52,${G-72} 140,${G-98} 228,${G-72}`}
        stroke="rgba(147,197,253,0.16)" strokeWidth="0.75" strokeDasharray="5 3"/>
      {/* Window placeholders */}
      {[82, 116, 150, 184].map(wx => (
        <rect key={wx} x={wx} y={G-56} width={18} height={13}
          stroke="rgba(147,197,253,0.13)" strokeWidth="0.5" strokeDasharray="3 2"/>
      ))}
      {/* Door */}
      <rect x={130} y={G-28} width={20} height={28}
        stroke="rgba(147,197,253,0.16)" strokeWidth="0.5" strokeDasharray="3 2"/>
      {/* Corner tick marks */}
      {corners.map(([x, y], i) => (
        <g key={i}>
          <line x1={x-5} y1={y} x2={x+5} y2={y} stroke="rgba(147,197,253,0.22)" strokeWidth="0.75"/>
          <line x1={x} y1={y-5} x2={x} y2={y+5} stroke="rgba(147,197,253,0.22)" strokeWidth="0.75"/>
        </g>
      ))}
      {/* Centre cross */}
      <line x1={137} y1={G-38} x2={143} y2={G-38} stroke="rgba(147,197,253,0.14)" strokeWidth="0.5"/>
      <line x1={140} y1={G-41} x2={140} y2={G-35} stroke="rgba(147,197,253,0.14)" strokeWidth="0.5"/>
    </svg>
  );
}

// ── SVG dispatcher ────────────────────────────────────────────────────────────

function PropertyPreviewSvg({
  propertyType, floors, basement, elevator, mezzanine, ducted, wallType,
}: {
  propertyType: string; floors: number; basement: boolean; elevator: boolean;
  mezzanine: boolean; ducted: boolean; wallType: string;
}) {
  const fn = Math.max(1, Math.min(3, floors > 0 ? floors : 1));
  switch (propertyType) {
    case 'house':      return <HouseSvg fn={fn} basement={basement} elevator={elevator} mezzanine={mezzanine} ducted={ducted} wallType={wallType}/>;
    case 'granny_flat': return <GrannyFlatSvg basement={basement} elevator={elevator} mezzanine={mezzanine} ducted={ducted} wallType={wallType}/>;
    case 'townhouse':  return <TownhouseSvg fn={fn} basement={basement} elevator={elevator} mezzanine={mezzanine} ducted={ducted} wallType={wallType}/>;
    case 'apartment':  return <ApartmentSvg basement={basement} elevator={elevator} mezzanine={mezzanine} ducted={ducted}/>;
    case 'office':     return <OfficeSvg basement={basement} elevator={elevator} mezzanine={mezzanine} ducted={ducted}/>;
    case 'warehouse':  return <WarehouseSvg basement={basement} mezzanine={mezzanine} ducted={ducted}/>;
    default:           return null;
  }
}

// ── Metadata sub-components ───────────────────────────────────────────────────

function PreviewChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-semibold tracking-[0.12em] uppercase leading-none" style={{ color: 'rgba(255,255,255,0.34)' }}>{label}</span>
      <span className="text-[12px] font-medium leading-none tabular-nums" style={{ color: 'rgba(255,255,255,0.72)' }}>{value}</span>
    </div>
  );
}

const WALL_SWATCHES: Record<string, { bg: string; label: string }> = {
  brick_veneer: { bg: 'rgba(176,118,72,0.42)', label: 'Brick Veneer' },
  double_brick: { bg: 'rgba(136,76,50,0.5)',   label: 'Double Brick' },
  concrete:     { bg: 'rgba(100,116,139,0.36)', label: 'Concrete' },
};

const FINISH_BADGES: Record<string, { bg: string; border: string; text: string }> = {
  economy:  { bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)',  text: 'text-slate-400' },
  standard: { bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.22)',  text: 'text-blue-300' },
  premium:  { bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.22)', text: 'text-violet-300' },
  luxury:   { bg: 'rgba(234,179,8,0.1)',    border: 'rgba(234,179,8,0.2)',   text: 'text-yellow-300/90' },
};

// ── Property Preview card — premium surface with mouse-reactive highlight ──────

function PropertyPreview({
  propertyType, floors, basement, elevator, mezzanine, ducted,
  wallType, finishLevel, buildType, floorArea, bedrooms,
  state, year, visibleWallType, visibleBedrooms,
}: {
  propertyType: string; floors: number | ''; basement: boolean;
  elevator: boolean; mezzanine: boolean; ducted: boolean;
  wallType: string; finishLevel: string; buildType: string;
  floorArea: number | ''; bedrooms: number | '';
  state: string; year: number | '';
  visibleWallType: boolean; visibleBedrooms: boolean;
}) {
  const cardStyle = {
    background: 'linear-gradient(145deg, #1e3d68 0%, #152e52 100%)',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)',
  };

  if (!propertyType) {
    return (
      <div className="relative mt-0 rounded-xl overflow-hidden cursor-default select-none" style={cardStyle}>
        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-semibold tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.44)' }}>
            Property Preview
          </span>
          <span className="text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.32)' }}>
            Select a type to preview
          </span>
        </div>
        <div className="px-2 pb-2">
          <DefaultPreviewSvg />
        </div>
      </div>
    );
  }

  const fn      = typeof floors    === 'number' && floors    > 0 ? floors    : 0;
  const areaNum = typeof floorArea === 'number' && floorArea > 0 ? floorArea : 0;
  const bedNum  = typeof bedrooms  === 'number' && bedrooms  > 0 ? bedrooms  : 0;
  const yearNum = typeof year      === 'number' && year      > 0 ? year      : 0;

  const wallSwatch  = visibleWallType ? (WALL_SWATCHES[wallType] ?? null) : null;
  const finishBadge = FINISH_BADGES[finishLevel] ?? null;
  const buildLabel  = BUILD_TYPE_OPTIONS.find(o => o.value === buildType)?.label ?? '';
  const finishLabel = FINISH_LEVEL_OPTIONS.find(o => o.value === finishLevel)?.label ?? '';

  const activeAddons = [
    ducted    && 'Ducted AC',
    basement  && 'Basement',
    elevator  && 'Elevator',
    mezzanine && 'Mezzanine',
  ].filter(Boolean) as string[];

  const hasMaterialRow = !!(wallSwatch || finishBadge || buildLabel);
  const hasSpecRow     = fn > 0 || (visibleBedrooms && bedNum > 0) || areaNum > 0 || !!state || yearNum > 0;

  return (
    <div
      className="relative mt-0 rounded-xl overflow-hidden cursor-default select-none"
      style={cardStyle}
    >
      {/* ── Content ── */}
      <div className="relative z-10">

        {/* Header */}
        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-semibold tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.44)' }}>
            Property Preview
          </span>
          <span className="text-[9px] font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.36)' }}>
            {PROPERTY_SUBTITLES[propertyType] ?? ''}
          </span>
        </div>

        {/* Building SVG */}
        <div className="px-2 pb-0.5">
          <PropertyPreviewSvg
            propertyType={propertyType}
            floors={fn}
            basement={basement}
            elevator={elevator}
            mezzanine={mezzanine}
            ducted={ducted}
            wallType={visibleWallType ? wallType : ''}
          />
        </div>

        {/* Metadata strip */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}>

          {/* Material / finish / build type */}
          {hasMaterialRow && (
            <div className="px-4 py-2.5 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {wallSwatch && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm shrink-0"
                    style={{ background: wallSwatch.bg, boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.2)' }}/>
                  <span className="text-[10.5px] leading-none" style={{ color: 'rgba(255,255,255,0.58)' }}>{wallSwatch.label}</span>
                </div>
              )}
              {finishBadge && finishLabel && (
                <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded ${finishBadge.text}`}
                  style={{ background: finishBadge.bg, boxShadow: `inset 0 0 0 0.5px ${finishBadge.border}` }}>
                  {finishLabel}
                </span>
              )}
              {buildLabel && (
                <span className="text-[9px] font-semibold tracking-[0.1em] uppercase"
                  style={{ color: 'rgba(255,255,255,0.42)' }}>
                  {buildLabel}
                </span>
              )}
            </div>
          )}

          {/* Spec chips */}
          {hasSpecRow && (
            <div className="px-4 py-2.5 flex items-start gap-5 flex-wrap">
              {fn > 0                        && <PreviewChip label="Floors" value={String(fn)}/>}
              {visibleBedrooms && bedNum > 0 && <PreviewChip label="Beds"   value={String(bedNum)}/>}
              {areaNum > 0                   && <PreviewChip label="Area"   value={`${areaNum} m²`}/>}
              {state                         && <PreviewChip label="State"  value={state}/>}
              {yearNum > 0                   && <PreviewChip label="Year"   value={String(yearNum)}/>}
            </div>
          )}

          {/* Active add-on chips */}
          {activeAddons.length > 0 && (
            <div className="px-4 pb-3 pt-0.5 flex flex-wrap gap-1.5">
              {activeAddons.map(a => (
                <span key={a} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(96,165,250,0.10)', boxShadow: 'inset 0 0 0 0.5px rgba(96,165,250,0.30)', color: 'rgba(147,197,253,0.80)' }}>
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
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
  if (finishLevel === 'economy')                              return r.low;
  if (finishLevel === 'premium' || finishLevel === 'luxury') return r.high;
  return r.mid;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ConstructionCalculator() {
  const [form, setForm]       = useState<FormState>(INITIAL_FORM);
  const [touched, setTouched] = useState<Set<keyof FormState>>(new Set());

  const visible = getVisibleFields(form.investmentPropertyType);
  const result  = calculateEstimate(form, visible);

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => { const s = new Set(prev); s.add(field); return s; });
  }

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
    setTouched(prev => { const s = new Set(prev); s.add('investmentPropertyType'); return s; });
  }

  function isFieldError(field: keyof FormState): boolean {
    return touched.has(field) && !form[field];
  }

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
      <style href="prop-preview-animations" precedence="low">{`
        @keyframes prop-breathe {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(96,165,250,0.06)); opacity: 0.9; }
          50%       { filter: drop-shadow(0 0 4px rgba(96,165,250,0.15)); opacity: 1; }
        }
        @keyframes prop-airflow {
          from { stroke-dashoffset: 14; }
          to   { stroke-dashoffset: 0; }
        }
        .prop-breathe      { animation: prop-breathe 4.5s ease-in-out infinite; }
        .prop-airflow-path { animation: prop-airflow 2.4s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .prop-breathe, .prop-airflow-path { animation: none !important; }
        }
      `}</style>

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
              <Field label="Investment Property State" htmlFor="investmentPropertyState" error={isFieldError('investmentPropertyState')}>
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

            <Field label="Build Type" error={isFieldError('buildType')}>
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
              <div className={visible.bedrooms ? 'col-span-2' : ''}>
                <Field label="Floor Area (m²)" htmlFor="floorArea" error={isFieldError('floorArea')}>
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
              </div>
              {!visible.bedrooms && (
                <Field label="Number of Floors" error={isFieldError('numberOfFloors')}>
                  <Stepper
                    value={form.numberOfFloors}
                    options={FLOOR_OPTIONS}
                    onChange={v => handleChange('numberOfFloors', v as FormState['numberOfFloors'])}
                    ariaLabel="number of floors"
                  />
                </Field>
              )}
            </div>

            {visible.bedrooms && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Number of Floors" error={isFieldError('numberOfFloors')}>
                  <Stepper
                    value={form.numberOfFloors}
                    options={FLOOR_OPTIONS}
                    onChange={v => handleChange('numberOfFloors', v as FormState['numberOfFloors'])}
                    ariaLabel="number of floors"
                  />
                </Field>
                <Field label="Number of Bedrooms" error={isFieldError('bedrooms')}>
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
              <Field label="Wall Type" error={isFieldError('wallType')}>
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
                  hint="+$105/m²"
                />
              )}
              {visible.elevator && (
                <ToggleCard
                  label="Elevator"
                  id="elevator"
                  checked={form.elevator}
                  onChange={v => handleChange('elevator', v)}
                  hint="from $100k"
                />
              )}
              {visible.mezzanine && (
                <ToggleCard
                  label="Mezzanine"
                  id="mezzanine"
                  checked={form.mezzanine}
                  onChange={v => handleChange('mezzanine', v)}
                  hint="+$120/m²"
                />
              )}
              <ToggleCard
                label="Ducted Air-Conditioning"
                id="ductedAirConditioning"
                checked={form.ductedAirConditioning}
                onChange={v => handleChange('ductedAirConditioning', v)}
                hint="+$255/m²"
              />
            </div>
          </div>

        </div>

        {/* ── Results panel — dark navy ──────────────────────────────────────── */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-[#0d1b35] rounded-2xl p-6 sm:p-7 lg:sticky lg:top-8 lg:self-start">

          {/* Property Preview */}
          <PropertyPreview
            propertyType={form.investmentPropertyType}
            floors={form.numberOfFloors}
            basement={form.basement}
            elevator={form.elevator}
            mezzanine={form.mezzanine}
            ducted={form.ductedAirConditioning}
            wallType={form.wallType}
            finishLevel={form.finishLevel}
            buildType={form.buildType}
            floorArea={form.floorArea}
            bedrooms={form.bedrooms}
            state={form.investmentPropertyState}
            year={form.constructionCompletionYear}
            visibleWallType={visible.wallType}
            visibleBedrooms={visible.bedrooms}
          />

          {/* Estimate label */}
          <p className="text-[11px] font-semibold tracking-[0.10em] text-blue-300/90 uppercase mt-5 mb-2">
            Construction Cost Estimate
          </p>

          {/* Hero amount */}
          <p className="font-mono text-5xl font-bold text-white tracking-tight leading-none">
            {result ? aud.format(selectedFinishEstimate) : '$0'}
          </p>

          {/* Per-m² rate */}
          {result && perSqm !== null && (
            <p className="font-mono text-xs text-white/55 mt-1.5">
              {aud.format(perSqm)} per m²
            </p>
          )}

          {result ? (
            <>
              {/* Range bar */}
              <div className="mt-5">
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
                <div className="flex justify-between mt-2.5">
                  <div>
                    <p className="text-[10px] text-white/45 mb-0.5">Low</p>
                    <p className="text-xs font-mono font-semibold text-white/80">{aud.format(result.low)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/45 mb-0.5">High</p>
                    <p className="text-xs font-mono font-semibold text-white/80">{aud.format(result.high)}</p>
                  </div>
                </div>
              </div>

              {/* Cost range row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-[11px] text-white/45">Cost range</span>
                <span className="text-xs font-mono font-medium text-white/70">
                  {aud.format(result.low)} — {aud.format(result.high)}
                </span>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-white/35 leading-relaxed mt-3">
                Indicative only. Based on current Australian market benchmarks.
                Actual costs vary by site, subcontractors, and scope.
              </p>
            </>
          ) : (
            <p className="text-xs text-white/40 mt-3 leading-relaxed">
              Fill in all fields above to see your estimate.
            </p>
          )}

          {/* ── CTA — always visible ─────────────────────────────────────── */}
          <div className="mt-5 pt-5 border-t border-white/10">
            <button
              type="button"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:ring-offset-2 focus:ring-offset-[#0d1b35] transition-colors duration-150"
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
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
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
