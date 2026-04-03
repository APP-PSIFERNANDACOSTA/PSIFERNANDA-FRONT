import type { ContractPaymentType, SignContractData } from "@/types/contract"

export type SignContractValidationErrors = Partial<Record<keyof SignContractData | "payment_day", string>>

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "")
}

/** CPF brasileiro: 11 dígitos e dígitos verificadores válidos */
export function isValidCPF(cpf: string): boolean {
  const d = digitsOnly(cpf)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i], 10) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(d[9], 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i], 10) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(d[10], 10)) return false

  return true
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSignContractForm(
  data: SignContractData,
  paymentType: ContractPaymentType,
  psychologistEmail: string | null | undefined,
  psychologistCpf: string | null | undefined
): { ok: true } | { ok: false; errors: SignContractValidationErrors } {
  const errors: SignContractValidationErrors = {}

  const name = data.patient_name.trim()
  if (!name) {
    errors.patient_name = "O nome completo é obrigatório."
  } else if (name.length > 255) {
    errors.patient_name = "O nome deve ter no máximo 255 caracteres."
  }

  const email = data.patient_email.trim()
  if (!email) {
    errors.patient_email = "O email é obrigatório."
  } else if (!EMAIL_RE.test(email)) {
    errors.patient_email = "O email deve ter um formato válido."
  } else if (email.length > 255) {
    errors.patient_email = "O email deve ter no máximo 255 caracteres."
  } else if (
    psychologistEmail &&
    email.toLowerCase() === psychologistEmail.trim().toLowerCase()
  ) {
    errors.patient_email =
      "Este e-mail já está em uso no sistema."
  }

  const phoneDigits = digitsOnly(data.patient_phone)
  if (!data.patient_phone?.trim()) {
    errors.patient_phone = "O telefone é obrigatório."
  } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    errors.patient_phone = "Informe um telefone válido com DDD (10 ou 11 dígitos)."
  }

  const cpfDigits = digitsOnly(data.patient_cpf)
  if (!data.patient_cpf?.trim()) {
    errors.patient_cpf = "O CPF é obrigatório."
  } else if (cpfDigits.length !== 11) {
    errors.patient_cpf = "O CPF deve ter 11 dígitos."
  } else if (!isValidCPF(data.patient_cpf)) {
    errors.patient_cpf = "CPF inválido."
  } else if (
    psychologistCpf &&
    cpfDigits === digitsOnly(psychologistCpf)
  ) {
    errors.patient_cpf =
      "Este CPF já está em uso no sistema."
  }

  if (!data.patient_birthdate?.trim()) {
    errors.patient_birthdate = "A data de nascimento é obrigatória."
  } else {
    const bd = new Date(`${data.patient_birthdate}T12:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (Number.isNaN(bd.getTime())) {
      errors.patient_birthdate = "A data de nascimento deve ser válida."
    } else if (bd.getTime() >= today.getTime()) {
      errors.patient_birthdate = "A data de nascimento deve ser anterior a hoje."
    }
  }

  const ec = data.emergency_contact.trim()
  if (!ec) {
    errors.emergency_contact = "O contato de emergência é obrigatório."
  } else if (ec.length > 500) {
    errors.emergency_contact = "O contato de emergência deve ter no máximo 500 caracteres."
  }

  if (
    paymentType === "mensal" &&
    (data.payment_day === undefined ||
      data.payment_day === null ||
      ![5, 10, 15, 20].includes(Number(data.payment_day)))
  ) {
    errors.payment_day = "Selecione o dia de pagamento para contratos mensais."
  }

  if (!data.accept_terms) {
    errors.accept_terms = "Você deve aceitar os termos do contrato."
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }
  return { ok: true }
}

/** Converte objeto de erros do Laravel (422) para uma mensagem por campo */
export function laravelErrorsToFieldMap(
  errors: Record<string, string[] | string> | undefined
): SignContractValidationErrors {
  if (!errors || typeof errors !== "object") return {}
  const out: SignContractValidationErrors = {}
  for (const [key, msgs] of Object.entries(errors)) {
    const field = key.split(".")[0] as keyof SignContractValidationErrors | "payment_day"
    const first = Array.isArray(msgs) ? msgs[0] : msgs
    if (typeof first === "string" && first) {
      ;(out as Record<string, string>)[field] = first
    }
  }
  return out
}
