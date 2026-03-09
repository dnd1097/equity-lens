import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '../../lib/utils'

/**
 * LabeledSlider — a full slider row with label, value bubble, and optional numeric override
 */
export function LabeledSlider({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
  format,
  unit = '',
  large = false,
  showMinMax = true,
  className,
}) {
  const safeValue = typeof value === 'number' && isFinite(value) ? value : min
  const pct = max > min ? Math.min(100, Math.max(0, ((safeValue - min) / (max - min)) * 100)) : 0
  const displayValue = format ? format(safeValue) : `${safeValue}${unit}`

  // Thumb half-width in px — used to keep bubble from overflowing edges
  const thumbHalf = large ? 16 : 10

  return (
    <div className={cn(className)}>
      {/* Label row with numeric override input */}
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slategray-500 uppercase tracking-wider">{label}</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={safeValue}
              min={min}
              max={max}
              step={step}
              onChange={e => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) onChange(Math.min(Math.max(v, min), max))
              }}
              className="w-20 text-right text-sm font-bold text-navy-900 border border-slategray-100
                rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-400
                focus:border-transparent transition-all duration-150 bg-slategray-50
                hover:border-slategray-200"
            />
            {unit && <span className="text-sm font-bold text-slategray-400 min-w-[16px]">{unit}</span>}
          </div>
        </div>
      )}

      {/* Slider container — top padding reserves space for the floating bubble */}
      <div className={cn('relative', large ? 'mt-10' : 'mt-8')}>

        {/* Floating value bubble — pinned above the thumb */}
        <div
          className="absolute -top-9 pointer-events-none transition-[left] duration-100 ease-out"
          style={{
            left: `clamp(${thumbHalf}px, calc(${pct}% - ${large ? 36 : 26}px), calc(100% - ${thumbHalf * 2 + (large ? 24 : 16)}px))`,
          }}
        >
          <div className={cn(
            'bg-navy-900 text-white font-bold rounded-lg shadow-lg whitespace-nowrap text-center select-none',
            large ? 'text-sm px-3 py-1.5 min-w-[72px]' : 'text-[11px] px-2 py-1 min-w-[44px]'
          )}>
            {displayValue}
          </div>
          {/* Caret pointer */}
          <svg className="w-full h-2" viewBox="0 0 20 8" preserveAspectRatio="none">
            <polygon points="10,8 0,0 20,0" fill="#0F1C2E" />
          </svg>
        </div>

        {/* Radix Slider */}
        <SliderPrimitive.Root
          value={[safeValue]}
          min={min}
          max={max}
          step={step}
          onValueChange={([v]) => onChange(v)}
          className={cn(
            'relative flex items-center w-full select-none touch-none',
            large ? 'h-8' : 'h-5'
          )}
        >
          <SliderPrimitive.Track
            className={cn('relative grow rounded-full', large ? 'h-2.5' : 'h-[6px]')}
            style={{ background: '#E2E8F0' }}
          >
            <SliderPrimitive.Range
              className="absolute h-full rounded-full"
              style={{ background: 'linear-gradient(to right, #14B8A6, #0EA5E9)' }}
            />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className={cn(
              'block rounded-full bg-white shadow-md cursor-grab active:cursor-grabbing',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2',
              'hover:shadow-lg transition-shadow duration-150',
              large
                ? 'w-8 h-8 border-[3px] border-teal-500 hover:border-teal-600'
                : 'w-5 h-5 border-2 border-teal-500 hover:border-teal-600'
            )}
          />
        </SliderPrimitive.Root>
      </div>

      {/* Min / Max labels */}
      {showMinMax && (
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-slategray-300 font-medium">
            {format ? format(min) : `${min}${unit}`}
          </span>
          <span className="text-[10px] text-slategray-300 font-medium">
            {format ? format(max) : `${max}${unit}`}
          </span>
        </div>
      )}
    </div>
  )
}
