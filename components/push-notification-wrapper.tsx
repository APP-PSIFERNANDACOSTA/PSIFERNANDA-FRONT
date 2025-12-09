"use client"

import dynamic from "next/dynamic"

const PushNotificationRegister = dynamic(
  () => import("@/components/push-notification-register"),
  { ssr: false }
)

export default function PushNotificationWrapper() {
  return <PushNotificationRegister />
}

