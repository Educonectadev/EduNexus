"use client"

import Image from "next/image"

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="EduNexus"
      width={48}
      height={48}
      className={className || "h-8 w-8"}
      priority
    />
  )
}
