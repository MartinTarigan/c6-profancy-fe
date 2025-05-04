"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminDashboard } from "@/components/shift/admin/admin-dashboard"
import LoadingIndicator from "@/components/LoadingIndicator"
import { AppSidebar } from "@/components/app-sidebar"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user is authenticated and has admin role
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      const roles = localStorage.getItem("roles")

      if (!token) {
        console.log("No token found, redirecting to login")
        router.push("/login")
        return
      }

      // Check if user has admin role
      if (!roles || !roles.includes("Admin")) {
        console.log("User does not have admin role, redirecting to lembur/shift")
        router.push("/jadwal/shift")
        return
      }

      // User is authenticated and has admin role
      setIsAuthorized(true)
    }

    checkAuth()
  }, [router])

  // Show loading while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator />
      </div>
    )
  }

  // If authorized, show the admin dashboard
  if (isAuthorized) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <AdminDashboard />
      </div>
    )
  }

  // This should not be visible as the user would be redirected
  return null
}
