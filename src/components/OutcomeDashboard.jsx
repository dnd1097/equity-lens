import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { LabeledSlider } from './ui/Slider'
import { formatCurrency, formatNumber } from '../lib/utils'

const SCENARIO_COLORS = {
  Low: '#94A3B8',
  Mid: '#14B8A6',
  High: '#0EA5E9',
}

// ─── Interactive Price Range Bar ─────────────────────────────────────────────
// A gradient slider from Low → High share price, linked to the same state
const PriceRangeBar = ({ lowPrice, highPrice, selectedPrice, onPriceChange }) => {
  if (!lowPrice || !highPrice || lowPrice >= highPrice) return null

  const clamped = Math.min(Math.max(selectedPrice || lowPrice, lowPrice), highPrice)
  const pct = valueToPct(clamped, lowPrice, highPrice)

  return (
    <div className="mb-8">
      {/* Low / Mid / High labels */}
      <div className="flex justify-between text-xs mb-2 px-0.5">
        <div className="text-left">
          <div className="font-bold text-slategray-500">{formatCurrency(lowPrice)}</div>
          <div className="text-[10px] text-slategray-400 font-medium uppercase tracking-wide">Low</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-navy-900">{formatCurrency((lowPrice + highPrice) / 2)}</div>
          <div className="text-[10px] text-slategray-400 font-medium uppercase tracking-wide">Mid</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-slategray-500">{formatCurrency(highPrice)}</div>
          <div className="text-[10px] text-slategray-400 font-medium uppercase tracking-wide">High</div>
        </div>
      </div>

      {/* Gradient slider track — range goes from Low to High */}
      <div className="relative mt-6">
        {/* Selected price bubble above thumb */}
        <div
          className="absolute -top-8 pointer-events-none transition-[left] duration-100"
          style={{
            left: `clamp(10px, calc(${pct}% - 30px), calc(100% - 70px))`,
          }}
        >
          <div className="bg-navy-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md whitespace-nowrap text-center">
            {formatCurrency(clamped)}
          </div>
          <svg className="w-full h-1.5" viewBox="0 0 16 6" preserveAspectRatio="none">
            <polygon points="8,6 0,0 16,0" fill="#0F1C2E" />
          </svg>
        </div>

        {/* The gradient bar itself (rendered behind the Radix track) */}
        <div
          className="absolute inset-y-0 left-0 right-0 rounded-full pointer-events-none"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            height: 14,
            background: 'linear-gradient(to right, #CCFBF1 0%, #14B8A6 45%, #0EA5E9 100%)',
          }}
        />

        <SliderPrimitive.Root
          value={[clamped]}
          min={lowPrice}
          max={highPrice}
          step={(highPrice - lowPrice) / 1000 || 0.001}
          onValueChange={([v]) => onPriceChange(v)}
          className="relative flex items-center w-full h-5 select-none touch-none"
        >
          <SliderPrimitive.Track
            className="relative grow h-3.5 rounded-full"
            style={{ background: 'transparent' }}
          >
            {/* Transparent range — gradient is in the background div */}
            <SliderPrimitive.Range className="absolute h-full rounded-full" style={{ background: 'transparent' }} />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className="block w-6 h-6 rounded-full bg-white border-[3px] border-navy-900 shadow-lg
              cursor-grab active:cursor-grabbing
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2
              hover:shadow-xl hover:scale-110 transition-shadow duration-150"
          />
        </SliderPrimitive.Root>
      </div>

      <p className="text-[10px] text-slategray-300 mt-2 text-center">
        Drag to set price within the Low–High range · Use the slider below to explore beyond
      </p>
    </div>
  )
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
function ScenarioTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-900 text-white rounded-xl p-3 shadow-xl text-xs">
      <div className="font-bold text-sm mb-1">{label}</div>
      <div className="text-teal-300 font-bold text-base">
        {formatCurrency(payload[0]?.value, { compact: true })}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function OutcomeDashboard({ computed, commission, onPriceChange }) {
  const {
    hasData,
    lowSharePrice,
    midSharePrice,
    highSharePrice,
    selectedPrice,
    sliderMin,
    sliderMax,
    myLowValue,
    myMidValue,
    myHighValue,
    grossValue,
    netValue,
    postTaxValue,
    impliedEV,
    lowEV,
    midEV,
    highEV,
    ownershipPct,
    sharesHeld,
    totalShares,
    brokerFee,
  } = computed

  const { showPostTax } = commission

  const scenarioData = useMemo(() => [
    { scenario: 'Low', 'Enterprise Value': lowEV, 'My Value': myLowValue },
    { scenario: 'Mid', 'Enterprise Value': midEV, 'My Value': myMidValue },
    { scenario: 'High', 'Enterprise Value': highEV, 'My Value': myHighValue },
  ], [lowEV, midEV, highEV, myLowValue, myMidValue, myHighValue])

  // Prices exist but are near-zero — user likely entered ARR in wrong unit (e.g. 12 vs 12000000)
  const pricesNearZero = midSharePrice > 0 && midSharePrice < 0.01

  if (!hasData) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-slategray-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slategray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="font-display font-semibold text-navy-900 text-lg mb-2">Outcome Dashboard</h3>
        <p className="text-slategray-400 text-sm max-w-xs mx-auto">
          Enter your <strong>shares held</strong>, <strong>total shares outstanding</strong>,
          and <strong>FY0 ARR forecast</strong> to unlock the full valuation dashboard.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          {['Company Setup', 'ARR Timeline'].map(step => (
            <span key={step} className="text-xs font-semibold px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
              {step}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Hero card ── */}
      <div className="card p-6 border border-teal-100/60"
        style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #F8F9FB 60%, #EFF6FF 100%)' }}>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-semibold text-navy-900 text-base">Equity Payout Estimator</h2>
              <p className="text-xs text-slategray-400 mt-0.5">Simulate price scenarios &amp; see your net proceeds</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slategray-400 font-semibold uppercase tracking-wider">Your Stake</div>
            <div className="font-display font-bold text-navy-900 text-lg">{ownershipPct.toFixed(3)}%</div>
          </div>
        </div>

        {/* ── Near-zero price warning ── */}
        {pricesNearZero && (
          <div className="flex items-start gap-3 p-3.5 mb-5 bg-amber-50 border border-amber-200 rounded-xl">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <div className="font-semibold text-amber-800 text-sm">Share prices appear near-zero</div>
              <div className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                Enter ARR as a full dollar amount in the <strong>ARR Timeline</strong> section.
                For example, enter <strong>12000000</strong> for $12M ARR — not <em>12</em>.
              </div>
            </div>
          </div>
        )}

        {/* ── Scenario reference chips (click to snap) ── */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { label: 'Low',  sp: lowSharePrice,  color: SCENARIO_COLORS.Low  },
            { label: 'Mid',  sp: midSharePrice,  color: SCENARIO_COLORS.Mid  },
            { label: 'High', sp: highSharePrice, color: SCENARIO_COLORS.High },
          ].map(({ label, sp, color }) => {
            const isActive = Math.abs((selectedPrice ?? midSharePrice) - sp) < 0.001
            return (
              <button
                key={label}
                onClick={() => onPriceChange(sp)}
                className="py-2.5 px-3 rounded-xl border-2 text-center transition-all duration-150
                  hover:shadow-sm active:scale-95 cursor-pointer"
                style={{
                  borderColor: isActive ? color : color + '40',
                  background: isActive ? color + '18' : color + '08',
                }}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color }}>
                  {label}
                </div>
                <div className="font-display font-bold text-navy-900 text-sm">{formatCurrency(sp)}</div>
              </button>
            )
          })}
        </div>

        {/* ── Single unified price slider ── */}
        <LabeledSlider
          value={selectedPrice || midSharePrice}
          min={sliderMin}
          max={sliderMax}
          step={(sliderMax - sliderMin) / 1000 || 0.01}
          onChange={onPriceChange}
          format={v => formatCurrency(v)}
          large
          showMinMax
        />
      </div>

      {/* ── 4 Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Estimated Share Price"
          value={formatCurrency(selectedPrice)}
          subvalue={`Mid: ${formatCurrency(midSharePrice)}`}
          accentColor="teal"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
        <MetricCard
          label="Gross Value of My Shares"
          value={formatCurrency(grossValue, { compact: true })}
          subvalue={`${formatNumber(sharesHeld)} shares`}
          accentColor="sky"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />}
        />
        <MetricCard
          label="Net Value After Commission"
          value={formatCurrency(netValue, { compact: true })}
          subvalue={showPostTax && postTaxValue !== null
            ? `After tax: ${formatCurrency(postTaxValue, { compact: true })}`
            : `Broker: ${formatCurrency(brokerFee, { compact: true })}`}
          accentColor="emerald"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />}
        />
        <MetricCard
          label="Implied EV at This Price"
          value={formatCurrency(impliedEV, { compact: true })}
          subvalue={`${formatNumber(totalShares)} shares total`}
          accentColor="amber"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />}
        />
      </div>

      {/* ── Scenario Bar Charts ── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="section-label mb-0.5">Scenario Analysis</div>
            <h3 className="font-display font-semibold text-navy-900 text-base">Low / Mid / High</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* EV Chart */}
          <div>
            <div className="text-xs font-semibold text-slategray-400 mb-3 uppercase tracking-wider">Enterprise Value</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F8" vertical={false} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false}
                    tickFormatter={v => formatCurrency(v, { compact: true })} width={52} />
                  <Tooltip content={<ScenarioTooltip />} />
                  <Bar dataKey="Enterprise Value" radius={[5, 5, 0, 0]}>
                    {scenarioData.map(e => <Cell key={e.scenario} fill={SCENARIO_COLORS[e.scenario]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* My Value Chart */}
          <div>
            <div className="text-xs font-semibold text-slategray-400 mb-3 uppercase tracking-wider">My Value</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F8" vertical={false} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false}
                    tickFormatter={v => formatCurrency(v, { compact: true })} width={52} />
                  <Tooltip content={<ScenarioTooltip />} />
                  <Bar dataKey="My Value" radius={[5, 5, 0, 0]}>
                    {scenarioData.map(e => <Cell key={e.scenario} fill={SCENARIO_COLORS[e.scenario]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Scenario snap row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slategray-100">
          {[
            { label: 'Low', ev: lowEV, val: myLowValue, sp: lowSharePrice, color: SCENARIO_COLORS.Low },
            { label: 'Mid', ev: midEV, val: myMidValue, sp: midSharePrice, color: SCENARIO_COLORS.Mid },
            { label: 'High', ev: highEV, val: myHighValue, sp: highSharePrice, color: SCENARIO_COLORS.High },
          ].map(({ label, ev, val, sp, color }) => (
            <button
              key={label}
              onClick={() => onPriceChange(sp)}
              className="text-center p-3 rounded-xl border transition-all duration-150 hover:shadow-md active:scale-95 cursor-pointer"
              style={{ borderColor: color + '40', background: color + '08' }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>{label}</div>
              <div className="font-display font-bold text-navy-900 text-sm">{formatCurrency(sp)}</div>
              <div className="text-[11px] text-slategray-400 mt-0.5">{formatCurrency(val, { compact: true })} my value</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, subvalue, accentColor, icon }) {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  const textMap = {
    teal: 'text-teal-600',
    sky: 'text-sky-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  }

  return (
    <div className="card card-hover p-4 group transition-all duration-200">
      <div className={`w-8 h-8 rounded-lg ${colorMap[accentColor]} flex items-center justify-center mb-3`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
      </div>
      <div className="text-[11px] font-semibold text-slategray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-display font-bold text-2xl number-transition ${textMap[accentColor]} leading-none`}>
        {value}
      </div>
      {subvalue && <div className="text-xs text-slategray-400 mt-1.5 font-medium">{subvalue}</div>}
    </div>
  )
}
