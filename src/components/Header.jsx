import { useState } from 'react'

export default function Header({ simCount, onNewSimulation, onOpenSimulations, onSaveSimulation, hasData }) {
  const [confirmNew, setConfirmNew] = useState(false)

  const handleNew = () => {
    if (hasData) {
      setConfirmNew(true)
    } else {
      onNewSimulation()
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slategray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <span className="font-display font-bold text-navy-900 text-lg tracking-tight">EquityLens</span>
              <span className="hidden sm:inline ml-2 text-xs font-medium text-slategray-400 bg-slategray-50 px-2 py-0.5 rounded-full border border-slategray-100">
                Private Share Forecaster
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNew}
              className="btn-ghost text-slategray-500"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New</span>
            </button>

            <button
              onClick={onOpenSimulations}
              className="btn-secondary relative"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="hidden sm:inline">Simulations</span>
              {simCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center
                  text-[10px] font-bold text-white bg-teal-500 rounded-full px-1 shadow-sm">
                  {simCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Confirm New Simulation Dialog */}
      {confirmNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-900/20 backdrop-blur-sm" onClick={() => setConfirmNew(false)} />
          <div className="relative bg-white rounded-card shadow-card-hover p-6 max-w-sm w-full animate-fade-in">
            <h3 className="font-display font-semibold text-navy-900 text-lg mb-2">Start a new simulation?</h3>
            <p className="text-sm text-slategray-400 mb-5">
              Your current data will be cleared. Make sure you've saved your simulation first.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-ghost" onClick={() => setConfirmNew(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={() => { setConfirmNew(false); onNewSimulation() }}
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
