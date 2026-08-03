"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"

export function useAuth() {
  const router = useRouter()
  const { user, role, institutionId, isLoading, setUser, setRole, setInstitutionId, setIsLoading, logout } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .single()

          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role, institution_id")
            .eq("user_id", authUser.id)
            .single()

          if (userData) setUser(userData)
          if (userRole) {
            setRole(userRole.role)
            setInstitutionId(userRole.institution_id)
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null)
          setRole(null)
          setInstitutionId(null)
          router.push("/login")
        } else if (event === "SIGNED_IN" && session) {
          getUser()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push("/login")
  }

  return {
    user,
    role,
    institutionId,
    isLoading,
    logout: handleLogout,
  }
}
