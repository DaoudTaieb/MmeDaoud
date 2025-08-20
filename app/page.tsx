"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in by checking for token cookie
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard")
        } else {
          // User is not authenticated, redirect to login
          router.push("/login")
        }
      } catch (error) {
        // On error, redirect to login
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement du système de gestion...</p>
      </div>
    </div>
  )
}
