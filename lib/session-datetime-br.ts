import { addDays, format, type Locale } from "date-fns"
import { TZDate } from "@date-fns/tz"

/** Fuso usado para cadastro: horário que o paciente/psicóloga informa (Brasil). */
export const SESSION_WALL_TIME_ZONE = "America/Sao_Paulo"

function hasExplicitUtcOrOffset(s: string): boolean {
  return /T.*(Z|[+-]\d{2}(:?\d{2})?)$/i.test(s.trim())
}

/**
 * Combina data (YYYY-MM-DD) e hora (HH:mm) como horário de Brasília → ISO UTC (API / Google).
 */
export function saoPauloWallDateTimeToUtcIso(dateStr: string, timeStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number)
  const [h, mi] = timeStr.split(":").map(Number)
  if (
    !y ||
    mo < 1 ||
    mo > 12 ||
    d < 1 ||
    d > 31 ||
    Number.isNaN(h) ||
    h < 0 ||
    h > 23 ||
    Number.isNaN(mi) ||
    mi < 0 ||
    mi > 59
  ) {
    return new Date(`${dateStr}T${timeStr}`).toISOString()
  }
  const tzd = new TZDate(y, mo - 1, d, h, mi, 0, 0, SESSION_WALL_TIME_ZONE)
  return tzd.toISOString()
}

/** ISO da API → partes para inputs (data + hora em Brasília). */
export function utcIsoToSaoPauloDateAndTime(iso: string): { date: string; time: string } {
  const ms = new Date(iso).getTime()
  if (Number.isNaN(ms)) return { date: "", time: "" }
  const tzd = new TZDate(ms, SESSION_WALL_TIME_ZONE)
  return { date: format(tzd, "yyyy-MM-dd"), time: format(tzd, "HH:mm") }
}

/**
 * Valor do formulário → ISO UTC: aceita ISO com Z/offset ou `YYYY-MM-DDTHH:mm` (interpretado como Brasília).
 */
export function sessionDateTimeToApiIso(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (hasExplicitUtcOrOffset(trimmed)) {
    const t = new Date(trimmed).getTime()
    return Number.isNaN(t) ? trimmed : new Date(t).toISOString()
  }
  const [datePart, timePartRaw] = trimmed.split("T")
  const timePart = (timePartRaw || "00:00").slice(0, 5)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const t = new Date(trimmed).getTime()
    return Number.isNaN(t) ? trimmed : new Date(t).toISOString()
  }
  return saoPauloWallDateTimeToUtcIso(datePart, timePart)
}

/** Formata instante UTC como relógio de parede em Brasília. */
export function formatSessionInstantInSaoPaulo(
  iso: string,
  pattern: string,
  options?: { locale?: Locale }
): string {
  const ms = new Date(iso).getTime()
  if (Number.isNaN(ms)) return ""
  const tzd = new TZDate(ms, SESSION_WALL_TIME_ZONE)
  return format(tzd, pattern, options?.locale ? { locale: options.locale } : {})
}

/**
 * Exibe data/hora no fuso do navegador (ex.: Lisboa), como o Google Calendar no seu dispositivo.
 * O cadastro da sessão continua em horário de Brasília; isso é só para leitura na agenda.
 */
export function formatSessionInstantInLocalTimezone(
  iso: string,
  pattern: string,
  options?: { locale?: Locale }
): string {
  const ms = new Date(iso).getTime()
  if (Number.isNaN(ms)) return ""
  return format(new Date(ms), pattern, options?.locale ? { locale: options.locale } : {})
}

/**
 * Chave yyyy-MM-dd do dia civil em Brasília (para comparar células da grade).
 * Cada célula da agenda deve usar um instante âncora (ex.: meio-dia em SP).
 */
export function getBrazilWallDateKey(day: Date): string {
  return format(new TZDate(day.getTime(), SESSION_WALL_TIME_ZONE), "yyyy-MM-dd")
}

/** Número do dia (1–31) em Brasília, para exibir na célula. */
export function formatBrazilCalendarDayNumber(day: Date): string {
  return format(new TZDate(day.getTime(), SESSION_WALL_TIME_ZONE), "d")
}

/** A célula representa o mesmo mês civil (y, m 0–11) que o âncora de navegação? */
export function isSaoPauloWallMonthEqual(day: Date, year: number, monthIndex: number): boolean {
  const c = new TZDate(day.getTime(), SESSION_WALL_TIME_ZONE)
  return c.getFullYear() === year && c.getMonth() === monthIndex
}

/**
 * Grade mensal: cada entrada é um Date no instante de 12:00 em America/Sao_Paulo
 * naquele dia civil — assim a coluna “sexta 3” bate com sessões “sexta em Brasília”.
 */
export function buildSaoPauloCalendarDays(visibleMonthAnchor: Date): Date[] {
  const y = visibleMonthAnchor.getFullYear()
  const m = visibleMonthAnchor.getMonth()
  const lastDay = new Date(y, m + 1, 0).getDate()

  const monthStart = new TZDate(y, m, 1, 12, 0, 0, SESSION_WALL_TIME_ZONE)
  const monthEnd = new TZDate(y, m, lastDay, 12, 0, 0, SESSION_WALL_TIME_ZONE)

  let start = monthStart
  while (start.getDay() !== 0) {
    start = addDays(start, -1)
  }
  let end = monthEnd
  while (end.getDay() !== 6) {
    end = addDays(end, 1)
  }

  const days: Date[] = []
  for (let cur = start; cur.getTime() <= end.getTime(); cur = addDays(cur, 1)) {
    days.push(new Date(cur.getTime()))
  }
  return days
}

/** Âncora de “hoje” (meio-dia em Brasília) para lista / botão Hoje. */
export function getSaoPauloTodayNoonDate(): Date {
  const br = new TZDate(Date.now(), SESSION_WALL_TIME_ZONE)
  const anchor = new TZDate(
    br.getFullYear(),
    br.getMonth(),
    br.getDate(),
    12,
    0,
    0,
    SESSION_WALL_TIME_ZONE
  )
  return new Date(anchor.getTime())
}

/** Intervalo UTC (ISO) do mês civil em Brasília — para buscar sessões/eventos sem falhar nas bordas. */
export function saoPauloMonthRangeUtcIso(anchor: Date): { start: string; end: string } {
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const lastD = new Date(y, m + 1, 0).getDate()
  const start = new TZDate(y, m, 1, 0, 0, 0, SESSION_WALL_TIME_ZONE)
  const end = new TZDate(y, m, lastD, 23, 59, 59, SESSION_WALL_TIME_ZONE)
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Posiciona sessão/evento no dia correto da grade (ambos em dia civil BR). */
export function isSameSaoPauloCalendarDay(iso: string, day: Date): boolean {
  const sessionDay = formatSessionInstantInSaoPaulo(iso, "yyyy-MM-dd")
  const cellDay = getBrazilWallDateKey(day)
  return sessionDay === cellDay
}
