/**
 * Máscaras para modo privacidade no painel do psicólogo.
 * Quando `active` é false, o valor original é devolvido (sem alteração).
 */

export function maskPatientName(value: string | undefined | null, active: boolean): string {
  if (value == null || value === "") return "N/A"
  const name = value.trim()
  if (!active) return name
  if (name.length <= 3) return `${name}*`
  return name.slice(0, 3) + "*".repeat(Math.min(name.length - 3, 12))
}

const digitsOnly = (s: string) => s.replace(/\D/g, "")

export function maskCpf(value: string | undefined | null, active: boolean): string {
  if (value == null || value === "") return ""
  if (!active) return value
  const d = digitsOnly(value)
  if (d.length === 0) return "••••••••••••"
  const head = d.slice(0, 3)
  return `${head}•••••••••`
}

export function maskPhone(value: string | undefined | null, active: boolean): string {
  if (value == null || value === "") return ""
  if (!active) return value
  const d = digitsOnly(value)
  if (d.length < 10) return "••••••••••"
  const ddd = d.slice(0, 2)
  return `(${ddd}) ••••••••`
}

export function maskCurrencyDisplay(_value: string | number | undefined | null, active: boolean, formatted: string): string {
  if (!active) return formatted
  return "R$ •••"
}

export function maskPlainCurrency(active: boolean): string {
  return active ? "R$ •••" : ""
}

export function maskMoneyBr(value: number | string | null | undefined, active: boolean): string {
  if (!active) {
    const n = typeof value === "string" ? parseFloat(value) : Number(value)
    if (value === null || value === undefined || value === "" || Number.isNaN(n)) return ""
    return `R$ ${n.toFixed(2)}`
  }
  return "R$ •••"
}

/** Texto livre (endereço, contato de emergência): início visível + máscara. */
export function maskLongText(
  value: string | undefined | null,
  active: boolean,
  keepStart: number = 10
): string {
  if (value == null || value === "") return ""
  if (!active) return value
  const t = value.trim()
  if (t.length <= keepStart) return "••••••••"
  return t.slice(0, keepStart) + "••••••"
}

export function maskEmail(value: string | undefined | null, active: boolean): string {
  if (value == null || value === "") return ""
  if (!active) return value
  const at = value.indexOf("@")
  if (at <= 0) return "•••@•••"
  const local = value.slice(0, at)
  const domain = value.slice(at + 1)
  const vis = local.slice(0, Math.min(2, local.length))
  return `${vis}•••@${domain.length > 0 ? domain : "•••"}`
}
