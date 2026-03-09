import { LabeledSlider } from './ui/Slider'
import { formatCurrency } from '../lib/utils'

export default function CommissionPanel({ commission, computed, onChange }) {
  const { brokerPct, flatFee, taxRate, showPostTax } = commission
  const { grossValue, netValue, postTaxValue, brokerFee, hasData } = computed

  const flatFeeNum = parseFloat(flatFee) || 0
  const taxRateNum = parseFloat(taxRate) || 0

  return (
    <div className="card card-hover p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        </div>
        <div>
          <h2 className="font-display font-semibold text-navy-900 text-base">Commission & Net Proceeds</h2>
          <p className="text-xs text-slategray-400 mt-0.5">Fees, commissions, and tax impact</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: inputs */}
        <div className="space-y-5">
          {/* Broker commission slider */}
          <div className="bg-slategray-50 rounded-xl p-4 border border-slategray-100">
            <LabeledSlider
              label="Broker Commission"
              value={brokerPct}
              min={0}
              max={5}
              step={0.05}
              unit="%"
              format={v => `${v.toFixed(2)}%`}
              onChange={v => onChange('brokerPct', v)}
            />
          </div>

          {/* Flat fee */}
          <div>
            <label className="block text-xs font-semibold text-slategray-400 uppercase tracking-wider mb-1.5">
              Transaction Fee (flat)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slategray-400 text-sm font-medium">$</span>
              <input
                type="number"
                placeholder="0"
                value={flatFee}
                onChange={e => onChange('flatFee', e.target.value)}
                min="0"
                className="input-field pl-7"
              />
            </div>
          </div>

          {/* Tax toggle + rate */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slategray-400 uppercase tracking-wider">
                Post-Tax Estimate
              </label>
              <button
                onClick={() => onChange('showPostTax', !showPostTax)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200
                  ${showPostTax ? 'bg-teal-500' : 'bg-slategray-200'}`}
              >
                <span
                  className={`inline-block w-3.5 h-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200
                    ${showPostTax ? 'translate-x-4' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {showPostTax && (
              <div className="animate-fade-in">
                <label className="block text-xs font-medium text-slategray-400 mb-1.5">Tax Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="e.g. 30"
                    value={taxRate}
                    onChange={e => onChange('taxRate', e.target.value)}
                    min="0"
                    max="100"
                    className="input-field pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slategray-400 text-sm font-medium">%</span>
                </div>
                <p className="text-[11px] text-slategray-300 mt-1.5">
                  Consult a tax professional. Actual rates depend on holding period, ISO vs NSO, state, etc.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Net proceeds summary */}
        <div className="space-y-3">
          {hasData ? (
            <>
              {/* Waterfall breakdown */}
              <div className="space-y-0 rounded-xl overflow-hidden border border-slategray-100">
                <WaterfallRow
                  label="Gross Value"
                  value={grossValue}
                  isTotal
                  color="teal"
                />
                <WaterfallRow
                  label={`Broker Commission (${brokerPct.toFixed(2)}%)`}
                  value={-brokerFee}
                  color="red"
                />
                {flatFeeNum > 0 && (
                  <WaterfallRow
                    label="Transaction Fee"
                    value={-flatFeeNum}
                    color="red"
                  />
                )}
                <WaterfallRow
                  label="Net Proceeds"
                  value={netValue}
                  isTotal
                  color="emerald"
                  emphasize
                />
                {showPostTax && taxRateNum > 0 && (
                  <>
                    <WaterfallRow
                      label={`Estimated Tax (${taxRateNum}%)`}
                      value={-(netValue * taxRateNum / 100)}
                      color="red"
                    />
                    <WaterfallRow
                      label="After-Tax Proceeds"
                      value={netValue * (1 - taxRateNum / 100)}
                      isTotal
                      color="sky"
                      emphasize
                    />
                  </>
                )}
              </div>

              {/* Commission as % of gross */}
              {grossValue > 0 && (
                <div className="text-xs text-slategray-400 text-center">
                  Total deductions:{' '}
                  <span className="font-bold text-red-500">
                    {(((brokerFee + flatFeeNum) / grossValue) * 100).toFixed(2)}%
                  </span>
                  {' '}of gross value
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6
              border-2 border-dashed border-slategray-100 rounded-xl bg-slategray-50 min-h-[200px]">
              <p className="text-sm font-medium text-slategray-400">Net proceeds appear here</p>
              <p className="text-xs text-slategray-300 mt-1">Enter company data and ARR to calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WaterfallRow({ label, value, isTotal, color, emphasize }) {
  const colorMap = {
    teal: 'text-teal-700',
    red: 'text-red-500',
    emerald: 'text-emerald-700',
    sky: 'text-sky-600',
  }

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 border-b border-slategray-50 last:border-0
      ${emphasize ? 'bg-slategray-50' : 'bg-white'}`}>
      <span className={`text-xs ${emphasize ? 'font-semibold text-navy-900' : 'text-slategray-500'}`}>
        {isTotal && emphasize && (
          <span className="inline-block w-1 h-full bg-teal-400 mr-2 rounded" />
        )}
        {label}
      </span>
      <span className={`text-sm font-bold tabular-nums ${colorMap[color] || 'text-navy-900'}`}>
        {value < 0
          ? `(${formatCurrency(Math.abs(value), { compact: true })})`
          : formatCurrency(value, { compact: true })}
      </span>
    </div>
  )
}
