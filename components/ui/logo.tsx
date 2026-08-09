"use client"

import { useTheme } from "next-themes"

export function Logo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  const bg = dark ? "#ffffff" : "#111111"
  const fg = dark ? "#000000" : "#ffffff"
  return (
    <svg
      viewBox="0 0 48 48"
      className={className || "h-8 w-8"}
      aria-label="EduNexus"
    >
      <rect width="48" height="48" rx="10" fill={bg} />
      <path d="M14 12 h20 v4 h-15 v5 h13 v4 h-13 v7 h15 v4 h-20 z" fill={fg} />
    </svg>
  )
}