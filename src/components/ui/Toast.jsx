export function Toast({ message, type = 'success', onDismiss }) {
  const config = {
    success: {
      bg: 'bg-emerald-600',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M5 13l4 4L19 7" />
      ),
    },
    info: {
      bg: 'bg-navy-900',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    error: {
      bg: 'bg-red-500',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M6 18L18 6M6 6l12 12" />
      ),
    },
  }

  const { bg, icon } = config[type] || config.success

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl
        shadow-lg text-white text-sm font-medium animate-toast-in ${bg}
        min-w-[240px] max-w-[340px]`}
    >
      <div className="w-5 h-5 flex-shrink-0">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
          {icon}
        </svg>
      </div>
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={onDismiss}
        className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
