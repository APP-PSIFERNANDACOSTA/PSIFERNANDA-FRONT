import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ColorProvider } from "@/components/color-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthThemeConnector } from "@/components/auth-theme-connector"
// import { PWAUpdatePrompt } from "@/components/pwa-update-prompt"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Psi Fernanda Costa",
  description: "Psicologa Fernanda Costa",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Psi Fernanda Costa",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  themeColor: "#EBBFDD",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`font-sans ${poppins.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="theme-preference"
          enableColorScheme={false}
        >
          <ColorProvider>
            <AuthProvider>
              <AuthThemeConnector />
              {/* <PWAUpdatePrompt /> */}
              {children}
            </AuthProvider>
            <Toaster />
            <Analytics />
          </ColorProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
