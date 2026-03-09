import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value, opts = {}) {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) return '—'
  const { compact = false, decimals } = opts
  if (compact) {
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(decimals ?? 2)}B`
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(decimals ?? 1)}M`
    if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(decimals ?? 1)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals ?? 2,
    maximumFractionDigits: decimals ?? 2,
  }).format(value)
}

export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPercent(value, showSign = true) {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) return '—'
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatMultiple(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return `${value.toFixed(1)}×`
}

export function computeGrowthRate(current, previous) {
  if (!previous || !current || isNaN(current) || isNaN(previous)) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function lerp(a, b, t) {
  return a + (b - a) * t
}

export function valueToPct(value, min, max) {
  if (max === min) return 0
  return ((value - min) / (max - min)) * 100
}
