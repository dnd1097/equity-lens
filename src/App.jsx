import { useState, useEffect, useCallback, useMemo } from 'react'
import Header from './components/Header'
import CompanySetup from './components/CompanySetup'
import ARRTimeline from './components/ARRTimeline'
import ValuationInputs from './components/ValuationInputs'
import OutcomeDashboard from './components/OutcomeDashboard'
import CommissionPanel from './components/CommissionPanel'
import SimulationsDrawer from './components/SimulationsDrawer'
import { Toast } from './components/ui/Toast'
import { generateId } from './lib/utils'

const LOCAL_KEY_PREFIX = 'equitylens_sim_'

const DEFAULT_STATE = {
  company: {
    name: '',
    shareClass: 'Common',
    sharesHeld: '',
    totalShares: '',
    strikePriceCostBasis: '',
    capTableImage: null,
  },
  arr: {
    fy_minus3: '',
    fy_minus2: '',
    fy_minus1: '',
    fy0_forecast: '',
  },
  benchmarks: {
    lowMultiple: 6,
    highMultiple: 12,
    grossMargin: 70,
    nrr: 110,
    burnMultiple: 1.5,
    discountRate: 20,
  },
  outcome: {
    selectedSharePrice: null,
  },
  commission: {
    brokerPct: 1.5,
    flatFee: 0,
    taxRate: 25,
    showPostTax: false,
  },
}

function loadSimulations() {
  const sims = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(LOCAL_KEY_PREFIX)) {
      try {
        const data = JSON.parse(localStorage.getItem(key))
        sims.push(data)
      } catch (e) {
        // ignore corrupted entries
      }
    }
  }
  return sims.sort((a, b) => b.savedAt - a.savedAt)
}

export default function App() {
  const [company, setCompany] = useState(DEFAULT_STATE.company)
  const [arr, setArr] = useState(DEFAULT_STATE.arr)
  const [benchmarks, setBenchmarks] = useState(DEFAULT_STATE.benchmarks)
  const [outcome, setOutcome] = useState(DEFAULT_STATE.outcome)
  const [commission, setCommission] = useState(DEFAULT_STATE.commission)
  const [simulations, setSimulations] = useState(() => loadSimulations())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  // ─── Derived calculations ──────────────────────────────────────────────────

  const computed = useMemo(() => {
    const sharesHeld = parseFloat(company.sharesHeld) || 0
    const totalShares = parseFloat(company.totalShares) || 0
    const strikePriceCostBasis = parseFloat(company.strikePriceCostBasis) || 0
    const fy0 = parseFloat(arr.fy0_forecast) || 0
    const fy_minus1 = parseFloat(arr.fy_minus1) || 0
    const fy_minus2 = parseFloat(arr.fy_minus2) || 0
    const fy_minus3 = parseFloat(arr.fy_minus3) || 0
    const { lowMultiple, highMultiple, nrr } = benchmarks
    const { brokerPct, flatFee, taxRate, showPostTax } = commission

    const ownershipPct = totalShares > 0 ? (sharesHeld / totalShares) * 100 : 0

    // ARR growth rates
    const growthFy_minus2 = fy_minus3 && fy_minus2
      ? ((fy_minus2 - fy_minus3) / fy_minus3) * 100 : null
    const growthFy_minus1 = fy_minus2 && fy_minus1
      ? ((fy_minus1 - fy_minus2) / fy_minus2) * 100 : null
    const growthFy0 = fy_minus1 && fy0
      ? ((fy0 - fy_minus1) / fy_minus1) * 100 : null

    // Sparkline data
    const sparklineData = [
      fy_minus3 ? { label: 'FY-3', value: fy_minus3 } : null,
      fy_minus2 ? { label: 'FY-2', value: fy_minus2 } : null,
      fy_minus1 ? { label: 'FY-1', value: fy_minus1 } : null,
      fy0 ? { label: 'FY0', value: fy0 } : null,
    ].filter(Boolean)

    // Valuation
    const adjustedARR = fy0 * (nrr / 100)
    const lowEV = adjustedARR * lowMultiple
    const highEV = adjustedARR * highMultiple
    const midEV = (lowEV + highEV) / 2

    const lowSharePrice = totalShares > 0 ? lowEV / totalShares : 0
    const highSharePrice = totalShares > 0 ? highEV / totalShares : 0
    const midSharePrice = (lowSharePrice + highSharePrice) / 2

    const selectedPrice = outcome.selectedSharePrice ?? midSharePrice

    // Gross values
    const myLowValue = lowSharePrice * sharesHeld
    const myMidValue = midSharePrice * sharesHeld
    const myHighValue = highSharePrice * sharesHeld
    const grossValue = selectedPrice * sharesHeld

    // Net value
    const brokerFee = grossValue * (brokerPct / 100)
    const netValue = grossValue - brokerFee - flatFee
    const postTaxValue = showPostTax && taxRate ? netValue * (1 - taxRate / 100) : null

    // Implied EV at selected price
    const impliedEV = selectedPrice * totalShares

    // Unrealized gain
    const costBasis = strikePriceCostBasis * sharesHeld
    const unrealizedGain = grossValue - costBasis

    // Slider range: 0.5x low to 1.5x high
    const sliderMin = lowSharePrice * 0.5
    const sliderMax = highSharePrice > 0 ? highSharePrice * 1.5 : 100

    return {
      sharesHeld,
      totalShares,
      strikePriceCostBasis,
      ownershipPct,
      growthFy_minus2,
      growthFy_minus1,
      growthFy0,
      sparklineData,
      adjustedARR,
      lowEV,
      midEV,
      highEV,
      lowSharePrice,
      midSharePrice,
      highSharePrice,
      selectedPrice,
      myLowValue,
      myMidValue,
      myHighValue,
      grossValue,
      brokerFee,
      netValue,
      postTaxValue,
      impliedEV,
      costBasis,
      unrealizedGain,
      sliderMin,
      sliderMax,
      hasData: fy0 > 0 && totalShares > 0,
    }
  }, [company, arr, benchmarks, outcome, commission])

  // Auto-set selectedSharePrice to midpoint when data becomes available
  useEffect(() => {
    if (computed.hasData && outcome.selectedSharePrice === null && computed.midSharePrice > 0) {
      setOutcome(prev => ({ ...prev, selectedSharePrice: computed.midSharePrice }))
    }
  }, [computed.hasData, computed.midSharePrice, outcome.selectedSharePrice])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleCompanyChange = useCallback((field, value) => {
    setCompany(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleArrChange = useCallback((field, value) => {
    setArr(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleBenchmarkChange = useCallback((field, value) => {
    setBenchmarks(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleOutcomeChange = useCallback((price) => {
    setOutcome(prev => ({ ...prev, selectedSharePrice: price }))
  }, [])

  const handleCommissionChange = useCallback((field, value) => {
    setCommission(prev => ({ ...prev, [field]: value }))
  }, [])

  // ─── Toast system ──────────────────────────────────────────────────────────

  const showToast = useCallback((message, type = 'success') => {
    const id = generateId()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ─── Simulation save/load ──────────────────────────────────────────────────

  const refreshSimulations = useCallback(() => {
    setSimulations(loadSimulations())
  }, [])

  const handleSaveSimulation = useCallback((simName) => {
    const id = generateId()
    const key = `${LOCAL_KEY_PREFIX}${id}`
    const sim = {
      id,
      key,
      simName: simName || 'Untitled Simulation',
      savedAt: Date.now(),
      company,
      arr,
      benchmarks,
      outcome,
      commission,
      // snapshot of computed values for the list view
      snapshot: {
        companyName: company.name,
        fy0: arr.fy0_forecast,
        lowSharePrice: computed.lowSharePrice,
        highSharePrice: computed.highSharePrice,
        ownershipPct: computed.ownershipPct,
      },
    }
    localStorage.setItem(key, JSON.stringify(sim))
    refreshSimulations()
    showToast(`"${sim.simName}" saved successfully`)
  }, [company, arr, benchmarks, outcome, commission, computed, refreshSimulations, showToast])

  const handleLoadSimulation = useCallback((sim) => {
    setCompany(sim.company)
    setArr(sim.arr)
    setBenchmarks(sim.benchmarks)
    setOutcome(sim.outcome)
    setCommission(sim.commission)
    setDrawerOpen(false)
    showToast(`Loaded "${sim.simName}"`)
  }, [showToast])

  const handleDuplicateSimulation = useCallback((sim) => {
    const id = generateId()
    const key = `${LOCAL_KEY_PREFIX}${id}`
    const duplicate = {
      ...sim,
      id,
      key,
      simName: `${sim.simName} (Copy)`,
      savedAt: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(duplicate))
    refreshSimulations()
    showToast(`Duplicated as "${duplicate.simName}"`)
  }, [refreshSimulations, showToast])

  const handleDeleteSimulation = useCallback((sim) => {
    localStorage.removeItem(sim.key)
    refreshSimulations()
    showToast(`Deleted "${sim.simName}"`, 'info')
  }, [refreshSimulations, showToast])

  const handleImportSimulation = useCallback((simData) => {
    const id = generateId()
    const key = `${LOCAL_KEY_PREFIX}${id}`
    const imported = {
      ...simData,
      id,
      key,
      simName: simData.simName || 'Imported Simulation',
      savedAt: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(imported))
    refreshSimulations()
    showToast(`Imported "${imported.simName}"`)
  }, [refreshSimulations, showToast])

  const handleNewSimulation = useCallback(() => {
    setCompany(DEFAULT_STATE.company)
    setArr(DEFAULT_STATE.arr)
    setBenchmarks(DEFAULT_STATE.benchmarks)
    setOutcome(DEFAULT_STATE.outcome)
    setCommission(DEFAULT_STATE.commission)
    setDrawerOpen(false)
    showToast('Started a new simulation', 'info')
  }, [showToast])

  return (
    <div className="min-h-screen bg-slategray-bg">
      {/* Header */}
      <Header
        simCount={simulations.length}
        onNewSimulation={handleNewSimulation}
        onOpenSimulations={() => setDrawerOpen(true)}
        onSaveSimulation={handleSaveSimulation}
        hasData={computed.hasData}
      />

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 pb-20 pt-6 space-y-5">

        {/* Privacy notice */}
        <div className="flex items-center gap-2 text-xs text-slategray-400 justify-center">
          <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Your data never leaves your browser — all computations happen locally and are saved only to your device's storage.
        </div>

        {/* Company Setup */}
        <CompanySetup
          company={company}
          ownershipPct={computed.ownershipPct}
          onChange={handleCompanyChange}
        />

        {/* ARR Timeline */}
        <ARRTimeline
          arr={arr}
          growthRates={{
            fy_minus2: computed.growthFy_minus2,
            fy_minus1: computed.growthFy_minus1,
            fy0: computed.growthFy0,
          }}
          sparklineData={computed.sparklineData}
          onChange={handleArrChange}
        />

        {/* Valuation Inputs */}
        <ValuationInputs
          benchmarks={benchmarks}
          onChange={handleBenchmarkChange}
          computed={computed}
        />

        {/* Outcome Dashboard — main section */}
        <OutcomeDashboard
          computed={computed}
          commission={commission}
          onPriceChange={handleOutcomeChange}
        />

        {/* Commission Panel */}
        <CommissionPanel
          commission={commission}
          computed={computed}
          onChange={handleCommissionChange}
        />

        {/* Save button */}
        <div className="flex justify-center pb-4">
          <SaveSimulationButton
            hasData={computed.hasData}
            onSave={handleSaveSimulation}
          />
        </div>

      </main>

      {/* Simulations Drawer */}
      <SimulationsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        simulations={simulations}
        onLoad={handleLoadSimulation}
        onDuplicate={handleDuplicateSimulation}
        onDelete={handleDeleteSimulation}
        onNew={handleNewSimulation}
        onImport={handleImportSimulation}
      />

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Save Simulation Button ──────────────────────────────────────────────────
function SaveSimulationButton({ hasData, onSave }) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [inputVisible, setInputVisible] = useState(false)

  const handleClick = () => {
    if (!hasData) return
    setInputVisible(true)
  }

  const handleConfirm = () => {
    onSave(name.trim() || 'Untitled Simulation')
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setInputVisible(false)
      setName('')
    }, 600)
  }

  if (!inputVisible) {
    return (
      <button
        onClick={handleClick}
        disabled={!hasData}
        className={`
          flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold
          transition-all duration-200 shadow-md
          ${hasData
            ? 'bg-teal-500 hover:bg-teal-600 text-white hover:shadow-lg active:scale-95 cursor-pointer'
            : 'bg-slategray-100 text-slategray-300 cursor-not-allowed'
          }
        `}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        {hasData ? 'Save Simulation' : 'Enter company data to save'}
      </button>
    )
  }

  return (
    <div className="card p-4 flex items-center gap-3 animate-fade-in shadow-card-active">
      <input
        autoFocus
        type="text"
        placeholder="Name this simulation (e.g. Bull Case)"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleConfirm()}
        className="input-field flex-1"
      />
      <button onClick={handleConfirm} className="btn-primary">
        {saving ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : 'Save'}
      </button>
      <button
        onClick={() => { setInputVisible(false); setName('') }}
        className="btn-ghost"
      >
        Cancel
      </button>
    </div>
  )
}
