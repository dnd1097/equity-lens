import { LabeledSlider } from './ui/Slider'
import { formatCurrency, formatMultiple } from '../lib/utils'

const BENCHMARK_CONFIG = [
  {
    key: 'grossMargin',
    label: 'Gross Margin',
    min: 20, max: 90, step: 1,
    unit: '%',
    format: v => `${v}%`,
    description: 'Higher margins justify premium multiples',
  },
  {
    key: 'nrr',
    label: 'Net Revenue Retention (NRR)',
    min: 70, max: 160, step: 1,
    unit: '%',
    format: v => `${v}%`,
    description: 'NRR > 100% drives efficient ARR-adjusted valuation',
  },
  {
    key: 'burnMultiple',
    label: 'Burn Multiple',
    min: 0.5, max: 5.0, step: 0.1,
    unit: '×',
    format: v => `${v.toFixed(1)}×`,
    description: 'Net burn ÷ net new ARR — lower is more efficient',
  },
  {
    key: 'discountRate',
    label: 'Illiquidity Discount Rate',
    min: 5, max: 50, step: 1,
    unit: '%',
    format: v => `${v}%`,
    description: 'Private co. discount vs public comps',
  },
]

export default function ValuationInputs({ benchmarks, onChange, computed }) {
  const { lowMultiple, highMultiple } = benchmarks
  const { adjustedARR, lowEV, highEV, lowSharePrice, highSharePrice, hasData } = computed

  return (
    <div className="card card-hover p-6 animate-fade-in">
      {/* Card header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="font-display font-semibold text-navy-900 text-base">Valuation Model</h2>
            <p className="text-xs text-slategray-400 mt-0.5">Benchmark inputs & ARR multiple range</p>
          </div>
        </div>

        {hasData && (
          <div className="hidden sm:flex items-center gap-3">
            <EVPill label="Low EV" value={lowEV} />
            <div className="text-slategray-300">→</div>
            <EVPill label="High EV" value={highEV} accent />
          </div>
        )}
      </div>

      {/* ARR Multiple sliders — the primary drivers */}
      <div className="bg-navy-900 rounded-xl p-5 mb-5">
        <div className="section-label text-slategray-400 mb-4">ARR Revenue Multiple Range</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-semibold text-slategray-400 mb-3">Low Multiple</div>
            <LabeledSlider
              value={lowMultiple}
              min={2}
              max={Math.min(highMultiple, 30)}
              step={0.5}
              onChange={v => {
                onChange('lowMultiple', v)
                if (v >= highMultiple) onChange('highMultiple', Math.min(v + 1, 30))
              }}
              format={v => `${v.toFixed(1)}×`}
              showMinMax={false}
            />
            {hasData && (
              <div className="mt-3 text-xs text-slategray-400">
                EV: <span className="font-bold text-teal-400">{formatCurrency(lowEV, { compact: true })}</span>
                {' '}/ share: <span className="font-bold text-teal-400">{formatCurrency(lowSharePrice)}</span>
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-slategray-400 mb-3">High Multiple</div>
            <LabeledSlider
              value={highMultiple}
              min={Math.max(lowMultiple, 2)}
              max={30}
              step={0.5}
              onChange={v => {
                onChange('highMultiple', v)
                if (v <= lowMultiple) onChange('lowMultiple', Math.max(v - 1, 2))
              }}
              format={v => `${v.toFixed(1)}×`}
              showMinMax={false}
            />
            {hasData && (
              <div className="mt-3 text-xs text-slategray-400">
                EV: <span className="font-bold text-sky-400">{formatCurrency(highEV, { compact: true })}</span>
                {' '}/ share: <span className="font-bold text-sky-400">{formatCurrency(highSharePrice)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ARR adjustment note */}
        {hasData && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slategray-400">
            <span>Adjusted ARR = FY0 × (NRR / 100)</span>
            <span className="font-bold text-white">{formatCurrency(adjustedARR, { compact: true })}</span>
          </div>
        )}
      </div>

      {/* Benchmark sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {BENCHMARK_CONFIG.map(({ key, label, min, max, step, unit, format, description }) => (
          <div key={key} className="bg-slategray-50 rounded-xl p-4 border border-slategray-100">
            <LabeledSlider
              label={label}
              value={benchmarks[key]}
              min={min}
              max={max}
              step={step}
              unit={unit}
              format={format}
              onChange={v => onChange(key, v)}
            />
            <p className="mt-2 text-[11px] text-slategray-400 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* Benchmark table */}
      <div className="mt-5 rounded-xl border border-slategray-100 overflow-hidden">
        <div className="grid grid-cols-5 text-xs font-semibold text-slategray-400 uppercase tracking-wider
          bg-slategray-50 px-4 py-2.5 border-b border-slategray-100">
          <div className="col-span-2">Benchmark</div>
          <div className="text-center">Bear</div>
          <div className="text-center font-bold text-teal-600">Current</div>
          <div className="text-center">Bull</div>
        </div>
        {[
          { label: 'ARR Multiple', bear: '4×', current: `${((lowMultiple + highMultiple) / 2).toFixed(1)}×`, bull: '20×' },
          { label: 'Gross Margin', bear: '60%', current: `${benchmarks.grossMargin}%`, bull: '85%' },
          { label: 'NRR', bear: '90%', current: `${benchmarks.nrr}%`, bull: '140%' },
          { label: 'Burn Multiple', bear: '3.0×', current: `${benchmarks.burnMultiple.toFixed(1)}×`, bull: '0.8×' },
        ].map(row => (
          <div key={row.label} className="grid grid-cols-5 text-xs px-4 py-2.5 border-b border-slategray-50
            last:border-0 hover:bg-slategray-50/50 transition-colors">
            <div className="col-span-2 text-slategray-500 font-medium">{row.label}</div>
            <div className="text-center text-red-400 font-medium">{row.bear}</div>
            <div className="text-center font-bold text-teal-600">{row.current}</div>
            <div className="text-center text-emerald-600 font-medium">{row.bull}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EVPill({ label, value, accent }) {
  return (
    <div className="text-right">
      <div className={`font-display font-bold text-sm ${accent ? 'text-sky-accent' : 'text-teal-500'}`}>
        {formatCurrency(value, { compact: true })}
      </div>
      <div className="text-[10px] text-slategray-400 font-medium">{label}</div>
    </div>
  )
}
