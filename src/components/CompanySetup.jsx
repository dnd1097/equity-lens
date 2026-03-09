import { useRef, useState, useCallback } from 'react'
import { formatNumber } from '../lib/utils'

const SHARE_CLASSES = [
  'Common', 'Preferred Series A', 'Preferred Series B', 'Preferred Series C',
  'Options (ISOs)', 'Options (NSOs)', 'RSUs', 'Warrants',
]

// ─── OCR text → share count extraction ───────────────────────────────────────
function extractSharesFromText(text) {
  // Normalise: collapse whitespace, keep commas and digits
  const normalised = text.replace(/\s+/g, ' ')

  const patterns = [
    // "Total Fully Diluted Shares: 10,000,000"
    /total\s+(?:fully\s+diluted\s+)?shares?\s*[:\-]?\s*([\d,]+)/i,
    // "Shares Outstanding: 10,000,000"
    /shares?\s+outstanding\s*[:\-]?\s*([\d,]+)/i,
    // "Outstanding: 10,000,000"
    /outstanding\s*[:\-]?\s*([\d,]+)/i,
    // "Fully Diluted: 10,000,000"
    /fully\s+diluted\s*[:\-]?\s*([\d,]+)/i,
    // "10,000,000 shares" (large number before "shares")
    /([\d,]{7,})\s+shares?/i,
    // "Total: 10,000,000" (last resort)
    /total\s*[:\-]?\s*([\d,]{6,})/i,
  ]

  for (const pattern of patterns) {
    const match = normalised.match(pattern)
    if (match) {
      const raw = match[1].replace(/,/g, '')
      const num = parseInt(raw, 10)
      // Sanity: plausible share count between 10K and 100B
      if (num >= 10_000 && num <= 100_000_000_000) return num
    }
  }
  return null
}

// ─── Run OCR via Tesseract.js (lazy-loaded) ───────────────────────────────────
async function runOCR(imageDataUrl) {
  // Lazy import — only loads tesseract.js when actually needed
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  const { data: { text } } = await worker.recognize(imageDataUrl)
  await worker.terminate()
  return text
}

// ─── OCR Status Banner ────────────────────────────────────────────────────────
function OCRBanner({ status, extractedShares, onAccept, onDismiss }) {
  if (!status || status === 'idle') return null

  const configs = {
    scanning: {
      bg: 'bg-sky-50 border-sky-200',
      icon: (
        <svg className="w-4 h-4 text-sky-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ),
      text: 'Scanning cap table image for share data…',
      action: null,
    },
    found: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: (
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
      text: `Detected ${formatNumber(extractedShares)} total shares — pre-filled below`,
      action: null,
    },
    not_found: {
      bg: 'bg-amber-50 border-amber-200',
      icon: (
        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      ),
      text: "Couldn't detect total shares — please enter manually",
      action: null,
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: (
        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      text: 'OCR error — please enter shares manually',
      action: null,
    },
  }

  const cfg = configs[status]
  if (!cfg) return null

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium mt-2 animate-fade-in ${cfg.bg}`}>
      <div className="flex-shrink-0">{cfg.icon}</div>
      <span className="flex-1 text-navy-900">{cfg.text}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 text-slategray-400 hover:text-navy-900 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CompanySetup({ company, ownershipPct, onChange }) {
  const fileInputRef = useRef(null)
  const [ocrStatus, setOcrStatus] = useState('idle')
  const [extractedShares, setExtractedShares] = useState(null)

  const handleImageUpload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return

    // Read image as base64
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      onChange('capTableImage', base64)

      // Run OCR to extract total shares
      setOcrStatus('scanning')
      setExtractedShares(null)
      try {
        const text = await runOCR(base64)
        const shares = extractSharesFromText(text)
        if (shares) {
          setExtractedShares(shares)
          onChange('totalShares', String(shares))
          setOcrStatus('found')
        } else {
          setOcrStatus('not_found')
        }
      } catch (err) {
        console.warn('OCR failed:', err)
        setOcrStatus('error')
      }
    }
    reader.readAsDataURL(file)
  }, [onChange])

  const handleFileInput = (e) => handleImageUpload(e.target.files?.[0])

  const handleDrop = (e) => {
    e.preventDefault()
    handleImageUpload(e.dataTransfer.files?.[0])
  }

  const hasPosition = company.sharesHeld && company.totalShares

  return (
    <div className="card card-hover p-6 animate-fade-in">
      {/* Card header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="font-display font-semibold text-navy-900 text-base">Company & Position</h2>
            <p className="text-xs text-slategray-400 mt-0.5">Your equity stake and share details</p>
          </div>
        </div>

        {hasPosition && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 rounded-full border border-teal-100">
            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
            <span className="text-xs font-semibold text-teal-700">
              {ownershipPct.toFixed(3)}% ownership
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ── Left: company fields ── */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slategray-400 uppercase tracking-wider mb-1.5">
              Company Name
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={company.name}
              onChange={e => onChange('name', e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slategray-400 uppercase tracking-wider mb-1.5">
              Share Class
            </label>
            <select
              value={company.shareClass}
              onChange={e => onChange('shareClass', e.target.value)}
              className="input-field bg-white cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                backgroundSize: '16px',
                paddingRight: '36px',
              }}
            >
              {SHARE_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slategray-400 uppercase tracking-wider mb-1.5">
                Shares Held
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={company.sharesHeld}
                onChange={e => onChange('sharesHeld', e.target.value)}
                min="0"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slategray-400 uppercase tracking-wider mb-1.5">
                Total Shares Out.
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="e.g. 10000000"
                  value={company.totalShares}
                  onChange={e => onChange('totalShares', e.target.value)}
                  min="0"
                  className={`input-field ${ocrStatus === 'found' ? 'border-emerald-300 bg-emerald-50/40' : ''}`}
                />
                {ocrStatus === 'found' && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slategray-400 uppercase tracking-wider mb-1.5">
              Strike Price / Cost Basis (per share)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slategray-400 text-sm font-medium">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={company.strikePriceCostBasis}
                onChange={e => onChange('strikePriceCostBasis', e.target.value)}
                min="0"
                step="0.01"
                className="input-field pl-7"
              />
            </div>
          </div>

          {hasPosition && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <StatPill label="Shares" value={formatNumber(parseFloat(company.sharesHeld))} />
              <StatPill label="Ownership" value={`${ownershipPct.toFixed(3)}%`} />
              <StatPill label="Total Shares" value={formatNumber(parseFloat(company.totalShares))} small />
            </div>
          )}
        </div>

        {/* ── Right: cap table image upload ── */}
        <div>
          <label className="block text-xs font-semibold text-slategray-400 uppercase tracking-wider mb-1.5">
            Cap Table Screenshot
            <span className="ml-1.5 normal-case font-normal text-teal-600 text-[10px]">
              · OCR auto-extracts Total Shares
            </span>
          </label>

          {company.capTableImage ? (
            <div>
              <div
                className="relative group rounded-xl overflow-hidden border border-slategray-100 bg-slategray-50"
                style={{ minHeight: 160 }}
              >
                <img
                  src={company.capTableImage}
                  alt="Cap table"
                  className="w-full h-full object-contain max-h-48"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-navy-900/0 group-hover:bg-navy-900/40 transition-all duration-200
                  flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-navy-900 shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Replace
                    </button>
                    <button
                      onClick={() => { onChange('capTableImage', null); setOcrStatus('idle') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-red-500 shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>

                {/* Reference badge */}
                <div className="absolute bottom-2 left-2 bg-teal-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Reference · manual entry is source of truth
                </div>
              </div>

              {/* OCR status banner */}
              <OCRBanner
                status={ocrStatus}
                extractedShares={extractedShares}
                onDismiss={() => setOcrStatus('idle')}
              />
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-slategray-200 rounded-xl bg-slategray-50
                hover:border-teal-400 hover:bg-teal-50/30 transition-all duration-200
                cursor-pointer flex flex-col items-center justify-center p-6 gap-3 text-center"
              style={{ minHeight: 160 }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <div className="w-10 h-10 rounded-full bg-slategray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-slategray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-900">Upload cap table screenshot</p>
                <p className="text-xs text-slategray-400 mt-0.5">OCR will auto-extract Total Shares Outstanding</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Browse files or drag & drop
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />

          <p className="mt-2 text-[11px] text-slategray-300 leading-relaxed">
            Image stored only in your browser. OCR runs locally — no data sent externally. Manual entry overrides any auto-detected value.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatPill({ label, value, small }) {
  return (
    <div className="bg-slategray-50 rounded-lg px-2.5 py-2 text-center border border-slategray-100">
      <div className={`font-display font-bold text-navy-900 ${small ? 'text-xs' : 'text-sm'} truncate`}>{value}</div>
      <div className="text-[10px] text-slategray-400 mt-0.5 font-medium">{label}</div>
    </div>
  )
}
