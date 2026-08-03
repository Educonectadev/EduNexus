import { redirect } from "next/navigation"

export default function DirectorRootPage() {
  redirect("/director/dashboard")
}

export const dynamic = "force-dynamic"