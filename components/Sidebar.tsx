
// Fichier : app/layout.tsx (NE PAS TOUCHER, OU REMETTRE COMME CECI)

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning> {/* J'ai mis lang="fr" */}
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children} {/* Le contenu des autres layouts/pages vient ici */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
