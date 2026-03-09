import { useState, useMemo, useRef } from 'react'
import { formatCurrency } from '../lib/utils'

function formatDate(ts) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts))
}

function slugify(str) {
  return (str || 'simulation').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
}

// ─── Download helpers ─────────────────────────────────────────────────────────

function downloadSim(sim) {
  const filename = slugify(sim.simName) + '.equitylens.json'
  const blob = new Blob([JSON.stringify(sim, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Print / PDF report ───────────────────────────────────────────────────────

function printSimulation(sim) {
  const { company, arr, benchmarks, outcome, commission, simName, savedAt } = sim

  const fy0      = parseFloat(arr?.fy0_forecast) || 0
  const nrr      = benchmarks?.nrr ?? 110
  const lowMul   = benchmarks?.lowMultiple ?? 6
  const highMul  = benchmarks?.highMultiple ?? 12
  const gm       = benchmarks?.grossMargin ?? 70
  const bm       = benchmarks?.burnMultiple ?? 1.5
  const dr       = benchmarks?.discountRate ?? 20
  const shares   = parseFloat(company?.totalShares) || 0
  const myShares = parseFloat(company?.sharesHeld) || 0
  const adjARR   = fy0 * (nrr / 100)
  const lowEV    = adjARR * lowMul
  const highEV   = adjARR * highMul
  const midEV    = (lowEV + highEV) / 2
  const lowSP    = shares > 0 ? lowEV / shares : 0
  const highSP   = shares > 0 ? highEV / shares : 0
  const midSP    = (lowSP + highSP) / 2
  const selSP    = outcome?.selectedSharePrice ?? midSP
  const own      = shares > 0 ? (myShares / shares) * 100 : 0
  const gross    = selSP * myShares
  const broker   = gross * ((commission?.brokerPct ?? 1.5) / 100)
  const flat     = commission?.flatFee ?? 0
  const net      = gross - broker - flat
  const tax      = commission?.taxRate ?? 25
  const postTax  = net * (1 - tax / 100)

  const n  = (v, d = 2) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: d,
  }).format(v || 0)
  const c  = v => {
    if (!v) return '$0'
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B'
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'
    if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'
    return n(v)
  }
  const num = v => new Intl.NumberFormat('en-US').format(v || 0)
  const dt  = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(savedAt))

  const arrRows = [
    arr?.fy_minus3 && `<tr><td>FY−3</td><td>${c(parseFloat(arr.fy_minus3))}</td></tr>`,
    arr?.fy_minus2 && `<tr><td>FY−2</td><td>${c(parseFloat(arr.fy_minus2))}</td></tr>`,
    arr?.fy_minus1 && `<tr><td>FY−1</td><td>${c(parseFloat(arr.fy_minus1))}</td></tr>`,
    `<tr style="font-weight:700; color:#14B8A6"><td>FY0 Forecast</td><td>${c(fy0)}</td></tr>`,
  ].filter(Boolean).join('')

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>Equity Report — ${simName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#0F1C2E;background:#fff;padding:48px;font-size:13px;line-height:1.5}
  h1{font-size:22px;font-weight:800;letter-spacing:-0.5px}
  .subtitle{font-size:11px;color:#64748B;margin-top:2px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #14B8A6;padding-bottom:20px;margin-bottom:28px}
  .sim-name{font-size:16px;font-weight:700;color:#14B8A6;text-align:right}
  .date{font-size:11px;color:#94A3B8;margin-top:4px;text-align:right}
  .section{margin-bottom:26px}
  .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;border-bottom:1px solid #E2E8F0;padding-bottom:6px;margin-bottom:14px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  .card{background:#F8F9FB;border-radius:10px;padding:14px}
  .field label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94A3B8;display:block;margin-bottom:3px}
  .field span{font-size:14px;font-weight:600;color:#0F1C2E}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td{padding:6px 0;border-bottom:1px solid #F1F5F9}
  td:last-child{text-align:right;font-weight:600}
  .sc{border-radius:10px;padding:16px;text-align:center}
  .sc-low{background:#F8FAFC;border:1px solid #CBD5E1}
  .sc-mid{background:#F0FDFA;border:1px solid #99F6E4}
  .sc-hi{background:#EFF6FF;border:1px solid #BFDBFE}
  .sc-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
  .sc-low .sc-label{color:#64748B}
  .sc-mid .sc-label{color:#0D9488}
  .sc-hi .sc-label{color:#0369A1}
  .sc-price{font-size:20px;font-weight:800}
  .sc-ev{font-size:11px;color:#64748B;margin-top:4px}
  .sc-val{font-size:14px;font-weight:700;margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,.07)}
  .sc-mid .sc-val{color:#0D9488}
  .sc-hi .sc-val{color:#0369A1}
  .highlight{background:linear-gradient(135deg,#F0FDFA,#EFF6FF);border-radius:12px;padding:20px;border:1px solid #99F6E4;margin-bottom:16px}
  .hl-price{font-size:36px;font-weight:800;color:#14B8A6}
  .hl-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:4px}
  .disclaimer{margin-top:32px;padding:14px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;font-size:10px;color:#92400E;line-height:1.6}
  @media print{body{padding:24px}@page{margin:.5in}}
</style>
</head><body>

<div class="header">
  <div><h1>EquityLens</h1><div class="subtitle">Private Share Price Forecaster · Equity Simulation Report</div></div>
  <div><div class="sim-name">${simName}</div><div class="date">Generated ${dt}</div></div>
</div>

<div class="section">
  <div class="section-title">Company &amp; Position</div>
  <div class="grid2">
    <div class="card"><div class="grid2" style="gap:10px">
      <div class="field"><label>Company</label><span>${company?.name || '—'}</span></div>
      <div class="field"><label>Share Class</label><span>${company?.shareClass || 'Common'}</span></div>
      <div class="field"><label>Shares Held</label><span>${num(myShares)}</span></div>
      <div class="field"><label>Total Shares</label><span>${num(shares)}</span></div>
      ${company?.strikePriceCostBasis ? `<div class="field"><label>Strike / Cost Basis</label><span>${n(parseFloat(company.strikePriceCostBasis))}</span></div>` : ''}
    </div></div>
    <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
      <div style="font-size:32px;font-weight:800;color:#14B8A6">${own.toFixed(4)}%</div>
      <div style="font-size:11px;color:#64748B;margin-top:4px">Ownership Stake</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">ARR — Annual Recurring Revenue</div>
  <div class="grid2">
    <div class="card"><table>${arrRows}</table></div>
    <div class="card">
      <div class="field" style="margin-bottom:10px"><label>Adjusted ARR (NRR-weighted)</label><span style="color:#14B8A6;font-size:18px">${c(adjARR)}</span></div>
      <div style="font-size:11px;color:#64748B">${c(fy0)} × ${nrr}% NRR = ${c(adjARR)}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Valuation Assumptions</div>
  <div class="grid3">
    <div class="card"><div class="field"><label>ARR Multiple Range</label><span>${lowMul}× – ${highMul}×</span></div></div>
    <div class="card"><div class="field"><label>Net Revenue Retention</label><span>${nrr}%</span></div></div>
    <div class="card"><div class="field"><label>Gross Margin</label><span>${gm}%</span></div></div>
    <div class="card"><div class="field"><label>Burn Multiple</label><span>${bm}×</span></div></div>
    <div class="card"><div class="field"><label>Discount Rate</label><span>${dr}%</span></div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Scenario Analysis</div>
  <div class="grid3">
    <div class="sc sc-low">
      <div class="sc-label">Low</div>
      <div class="sc-price">${n(lowSP)}</div>
      <div class="sc-ev">EV: ${c(lowEV)}</div>
      <div class="sc-val">${c(lowSP * myShares)} my value</div>
    </div>
    <div class="sc sc-mid">
      <div class="sc-label">Mid</div>
      <div class="sc-price">${n(midSP)}</div>
      <div class="sc-ev">EV: ${c(midEV)}</div>
      <div class="sc-val">${c(midSP * myShares)} my value</div>
    </div>
    <div class="sc sc-hi">
      <div class="sc-label">High</div>
      <div class="sc-price">${n(highSP)}</div>
      <div class="sc-ev">EV: ${c(highEV)}</div>
      <div class="sc-val">${c(highSP * myShares)} my value</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Selected Price &amp; Net Proceeds</div>
  <div class="highlight">
    <div class="hl-label">Simulated Share Price</div>
    <div class="hl-price">${n(selSP)}</div>
    <div style="font-size:11px;color:#64748B;margin-top:4px">Implied Company EV: ${c(selSP * shares)}</div>
  </div>
  <div class="card"><table>
    <tr><td>Gross Value (${num(myShares)} shares × ${n(selSP)})</td><td>${c(gross)}</td></tr>
    <tr><td>Broker Commission (${commission?.brokerPct ?? 1.5}%)</td><td style="color:#EF4444">−${c(broker)}</td></tr>
    ${flat > 0 ? `<tr><td>Flat Fee</td><td style="color:#EF4444">−${c(flat)}</td></tr>` : ''}
    <tr><td>Net After Commission</td><td style="color:#0D9488">${c(net)}</td></tr>
    <tr style="font-weight:700;font-size:15px"><td>After Tax (${tax}%)</td><td>${c(postTax)}</td></tr>
  </table></div>
</div>

<div class="disclaimer">
  <strong>Disclaimer:</strong> This report is for informational purposes only and does not constitute financial or legal advice.
  Share price estimates are based on the valuation assumptions entered above and may differ significantly from actual outcomes.
  Private company valuations are inherently uncertain. Consult a qualified financial advisor before making any investment decisions.
  All computations were performed locally by EquityLens — no data was transmitted externally.
</div>

<script>window.onload = function(){ window.print() }</script>
</body></html>`

  const win = window.open('', '_blank', 'width=950,height=750')
  if (!win) { alert('Allow pop-ups to generate the PDF report.'); return }
  win.document.write(html)
  win.document.close()
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

export default function SimulationsDrawer({
  open, onClose, simulations, onLoad, onDuplicate, onDelete, onNew, onImport,
}) {
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const importRef = useRef(null)

  const grouped = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = simulations.filter(sim =>
      sim.snapshot?.companyName?.toLowerCase().includes(q) ||
      sim.simName?.toLowerCase().includes(q)
    )
    const groups = {}
    filtered.forEach(sim => {
      const company = sim.snapshot?.companyName || 'Unknown Company'
      if (!groups[company]) groups[company] = []
      groups[company].push(sim)
    })
    return groups
  }, [simulations, search])

  const companies = Object.keys(grouped).sort()

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result)
        if (!data.company || !data.arr || !data.benchmarks) {
          alert('Invalid file — please select a .equitylens.json simulation file.')
          return
        }
        onImport(data)
      } catch {
        alert('Could not read file. Make sure it is a valid .equitylens.json file.')
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-navy-900/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-xl z-50 bg-white shadow-2xl flex flex-col animate-slide-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slategray-100">
          <div>
            <h2 className="font-display font-bold text-navy-900 text-lg">Saved Simulations</h2>
            <p className="text-xs text-slategray-400 mt-0.5">
              {simulations.length} simulation{simulations.length !== 1 ? 's' : ''} saved locally
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Hidden file input for import */}
            <input
              ref={importRef}
              type="file"
              accept=".json,.equitylens.json"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              onClick={() => importRef.current?.click()}
              className="btn-ghost text-xs flex items-center gap-1.5 px-3"
              title="Import simulation from .equitylens.json file"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Import
            </button>
            <button
              onClick={() => { onNew(); onClose() }}
              className="btn-primary text-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
            <button onClick={onClose} className="btn-ghost w-9 h-9 p-0 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slategray-50">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slategray-300"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search simulations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
        </div>

        {/* Simulation list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {simulations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div className="w-14 h-14 rounded-full bg-slategray-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-slategray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-semibold text-navy-900 text-base mb-2">No simulations yet</h3>
              <p className="text-sm text-slategray-400 max-w-xs">
                Fill in your company data and hit "Save Simulation" to store scenarios here.
              </p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-sm text-slategray-400">
              No results match "{search}"
            </div>
          ) : (
            companies.map(company => (
              <div key={company}>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-5 h-5 rounded-md bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-navy-900 uppercase tracking-wide">{company}</span>
                  <span className="text-[10px] text-slategray-400 ml-auto">
                    {grouped[company].length} scenario{grouped[company].length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2 pl-1">
                  {grouped[company].map(sim => (
                    <SimCard
                      key={sim.id}
                      sim={sim}
                      onLoad={onLoad}
                      onDuplicate={onDuplicate}
                      onDelete={(s) => setDeleteConfirm(s)}
                      onDownload={downloadSim}
                      onPrint={printSimulation}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slategray-100 bg-slategray-50/50">
          <p className="text-[11px] text-slategray-400 text-center leading-relaxed flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            All data stored locally in your browser. Nothing is transmitted externally.
          </p>
        </div>
      </div>

      {/* Delete confirmation — z-[9999] ensures it renders above the drawer (z-50) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-card shadow-card-hover p-6 max-w-xs w-full animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-display font-semibold text-navy-900 text-base text-center mb-1">
              Delete simulation?
            </h3>
            <p className="text-xs text-slategray-400 text-center mb-4">
              "{deleteConfirm.simName}" will be permanently removed from your browser.
            </p>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1 justify-center" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600
                  text-white text-sm font-semibold rounded-lg transition-colors"
                onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null) }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Simulation card ──────────────────────────────────────────────────────────

function SimCard({ sim, onLoad, onDuplicate, onDelete, onDownload, onPrint }) {
  const { snapshot, simName, savedAt } = sim
  const lowPrice  = snapshot?.lowSharePrice
  const highPrice = snapshot?.highSharePrice
  const hasRange  = lowPrice && highPrice

  return (
    <div className="bg-white border border-slategray-100 rounded-xl p-4 hover:shadow-card transition-all duration-150 group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-navy-900 text-sm truncate">{simName}</div>
          <div className="text-[10px] text-slategray-400 mt-0.5">{formatDate(savedAt)}</div>
        </div>
        {hasRange && (
          <div className="text-right flex-shrink-0">
            <div className="text-xs font-bold text-teal-600">
              {formatCurrency(lowPrice)} – {formatCurrency(highPrice)}
            </div>
            <div className="text-[10px] text-slategray-400">share price range</div>
          </div>
        )}
      </div>

      {/* Stats chips */}
      <div className="flex items-center gap-2 text-[11px] text-slategray-500 mb-3">
        {snapshot?.fy0 && (
          <span className="bg-slategray-50 rounded-md px-1.5 py-0.5 border border-slategray-100">
            ARR: <span className="font-bold text-navy-900">
              {formatCurrency(parseFloat(snapshot.fy0), { compact: true })}
            </span>
          </span>
        )}
        {snapshot?.ownershipPct > 0 && (
          <span className="bg-teal-50 text-teal-700 rounded-md px-1.5 py-0.5 border border-teal-100">
            {snapshot.ownershipPct.toFixed(3)}% ownership
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onLoad(sim)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600
            text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Load
        </button>

        <button
          onClick={() => onDuplicate(sim)}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-slategray-200 hover:border-teal-300
            text-slategray-500 hover:text-teal-600 text-xs font-medium rounded-lg transition-colors"
          title="Duplicate"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </button>

        <button
          onClick={() => onDownload(sim)}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-slategray-200 hover:border-sky-300
            text-slategray-500 hover:text-sky-600 text-xs font-medium rounded-lg transition-colors"
          title="Download as .equitylens.json"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>

        <button
          onClick={() => onPrint(sim)}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-slategray-200 hover:border-purple-300
            text-slategray-500 hover:text-purple-600 text-xs font-medium rounded-lg transition-colors"
          title="Print / Export PDF report"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>

        <button
          onClick={() => onDelete(sim)}
          className="btn-danger px-2.5 py-1.5"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
