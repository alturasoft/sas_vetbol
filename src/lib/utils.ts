import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "Bs. 0.00"
  return `Bs. ${Number(amount).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/La_Paz",
  })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/La_Paz",
  })
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/La_Paz",
  })
}

export function calculateAge(birthDate: string | Date | null | undefined): {
  years: number
  months: number
  text: string
} {
  if (!birthDate) return { years: 0, months: 0, text: "Edad no registrada" }
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate
  if (isNaN(birth.getTime())) return { years: 0, months: 0, text: "Edad no registrada" }

  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()

  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--
    months += 12
  }

  if (now.getDate() < birth.getDate()) {
    months = Math.max(0, months - 1)
  }

  if (years === 0 && months === 0) {
    const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
    return { years: 0, months: 0, text: `${days} días` }
  }

  if (years === 0) {
    return { years: 0, months, text: `${months} ${months === 1 ? "mes" : "meses"}` }
  }

  if (months === 0) {
    return { years, months: 0, text: `${years} ${years === 1 ? "año" : "años"}` }
  }

  return {
    years,
    months,
    text: `${years} ${years === 1 ? "año" : "años"} y ${months} ${months === 1 ? "mes" : "meses"}`,
  }
}

