import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const dateTimeFormatterBR = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC'
})

export function formatDateToBR(dateString: string | null | undefined) {
  if (!dateString) return ''

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) return ''

  return dateTimeFormatterBR.format(date)
}

export function formatNumber(
  value: number | null | undefined,
  decimals: number = 2,
  fallback: string = 'N/A'
) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback
  }

  const formatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  return formatter.format(value)
}