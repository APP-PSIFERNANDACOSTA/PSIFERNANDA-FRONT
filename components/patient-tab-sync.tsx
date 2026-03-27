"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

const VALID_TABS = new Set(["info", "diary", "sessions", "notes", "contracts", "quizzes"])

export function PatientTabSync({ setTab }: { setTab: (t: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const t = searchParams.get("tab")
    if (t && VALID_TABS.has(t)) {
      setTab(t)
    }
  }, [searchParams, setTab])

  return null
}
