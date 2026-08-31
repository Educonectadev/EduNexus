import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Manrope, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { SbToastProvider } from "@/components/ui/sb"
import { DesignProvider } from "@/contexts/design-context"
import './globals.css'

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: '--font-manrope'
});

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter'
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
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EduNexus',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#1a3a8a',
    'theme-color': '#1a3a8a',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a3a8a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <meta name="theme-color" content="#1a3a8a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`} suppressHydrationWarning>
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
