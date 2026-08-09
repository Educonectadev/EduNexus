import React from "react"
import type { Metadata, Viewport } from 'next'
import { Manrope, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { SbToastProvider } from "@/components/ui/sb"
import { DesignProvider } from "@/contexts/design-context"
import './globals.css'

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: '--font-manrope'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

export const metadata: Metadata = {
  title: 'EduNexus - Plataforma Educativa Nacional del Perú',
  description: 'El sistema integral de gestión escolar para colegios públicos y privados del Perú. Administra matrículas, notas, asistencia, comunicación y más en una sola plataforma.',
  generator: 'EduNexus',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EduNexus',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={`${manrope.variable} ${jetbrainsMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <svg aria-hidden="true" style={{position:'absolute',width:0,height:0,overflow:'hidden'}}>
          <defs>
            <filter id="mdGooey">
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
              <feColorMatrix in="blur" mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SbToastProvider>
            <DesignProvider>
              {children}
            </DesignProvider>
          </SbToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
