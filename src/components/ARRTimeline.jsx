import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts'
import { formatCurrency, formatPercent } from '../lib/utils'

const FY_FIELDS = [
  { key: 'fy_minus3', label: 'FY−3', growthKey: null },
  { key: 'fy_minus2', label: 'FY−2', growthKey: 'fy_minus2' },
  { key: 'fy_minus1', label: 'FY−1', growthKey: 'fy_minus1' },
  { key: 'fy0_forecast', label: 'FY0 Forecast', growthKey: 'fy0', accent: true },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-900 text-white rounded-lg px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold mb-0.5">{label}</div>
      <div className="text-teal-300">{formatCurrency(payload[0]?.value, { compact: true })}</div>
    </div>
  )
}

export default function ARRTimeline({ arr, growthRates, sparklineData, onChange }) {
  const hasData = sparklineData.length >= 2

  return (
    <div className="card card-hover p-6 animate-fade-in">
      {/* Card header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h2 className="font-display font-semibold text-navy-900 text-base">ARR Timeline</h2>
            <p className="text-xs text-slategray-400 mt-0.5">Annual Recurring Revenue history & forecast</p>
          </div>
        </div>

        {/* CAGR badge */}
        {sparklineData.length >= 2 && (() => {
          const first = sparklineData[0].value
          const last = sparklineData[sparklineData.length - 1].value
          const years = sparklineData.length - 1
          const cagr = (Math.pow(last / first, 1 / years) - 1) * 100
          return (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold
              ${cagr >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              <svg className={`w-3 h-3 ${cagr >= 0 ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {Math.abs(cagr).toFixed(0)}% {years}yr CAGR
            </div>
          )
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: ARR inputs */}
        <div className="space-y-3">
          {FY_FIELDS.map(({ key, label, growthKey, accent }, idx) => {
            const growth = growthKey ? growthRates[growthKey] : null
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-semibold uppercase tracking-wider
                    ${accent ? 'text-teal-600' : 'text-slategray-400'}`}>
                    {label}
                    {accent && (
                      <span className="ml-1.5 text-[9px] normal-case font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full tracking-normal">
                        Forecast
                      </span>
                    )}
                  </label>
                  {growth !== null && (
                    <GrowthBadge value={growth} />
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slategray-400 text-sm font-medium">$</span>
                  <input
                    type="number"
                    placeholder={accent ? 'e.g. 12000000 for $12M' : 'e.g. 5000000 for $5M'}
                    value={arr[key]}
                    onChange={e => onChange(key, e.target.value)}
                    min="0"
                    step="100000"
                    className={`input-field pl-7 ${accent ? 'border-teal-200 focus:ring-teal-400 font-semibold' : ''}`}
                  />
                </div>
                {accent && (
                  <p className="text-[10px] text-slategray-400 mt-1 ml-0.5">
                    Enter full dollar amount · e.g. <strong>12000000</strong> = $12M ARR
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Right: Sparkline chart */}
        <div className="flex flex-col">
          {hasData ? (
            <div className="flex-1 flex flex-col">
              <div className="section-label mb-3">ARR Trajectory</div>
              <div className="flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="arrGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#14B8A6" />
                        <stop offset="100%" stopColor="#0EA5E9" />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'DM Sans' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'DM Sans' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => formatCurrency(v, { compact: true })}
                      width={50}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="url(#arrGradient)"
                      strokeWidth={2.5}
                      dot={{ fill: '#14B8A6', strokeWidth: 0, r: 4 }}
                      activeDot={{ fill: '#0EA5E9', r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Growth rate chips */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: 'FY−3 → FY−2', value: growthRates.fy_minus2 },
                  { label: 'FY−2 → FY−1', value: growthRates.fy_minus1 },
                  { label: 'FY−1 → FY0', value: growthRates.fy0 },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slategray-50 rounded-lg p-2 text-center border border-slategray-100">
                    <div className={`font-display font-bold text-sm ${
                      value === null ? 'text-slategray-300' :
                      value >= 0 ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {value === null ? '—' : formatPercent(value)}
                    </div>
                    <div className="text-[10px] text-slategray-400 mt-0.5 font-medium truncate">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6
              border-2 border-dashed border-slategray-100 rounded-xl bg-slategray-50/50 min-h-[200px]">
              <div className="w-10 h-10 rounded-full bg-slategray-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-slategray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slategray-400">ARR chart appears here</p>
              <p className="text-xs text-slategray-300 mt-1">Enter at least 2 ARR data points</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GrowthBadge({ value }) {
  if (value === null) return null
  const isPositive = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full
      ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
      {isPositive ? '↑' : '↓'} {Math.abs(value).toFixed(0)}%
    </span>
  )
}
