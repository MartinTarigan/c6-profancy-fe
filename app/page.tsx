"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import General from "@/components/Cards/General"
import ShiftDashboard from "@/components/ShiftDashboard"

export default function Home() {
  const router = useRouter()
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/peer-review/dashboard")
      return
    }

    // Extract user roles from token
    try {
      const tokenPayload = parseJwt(token)
      console.log("Token payload:", tokenPayload)

      // Get the roles array
      const roles = tokenPayload?.roles || []
      console.log("Detected roles:", roles)

      setUserRoles(roles)
    } catch (err) {
      console.error("Error parsing JWT token:", err)
    } finally {
      setLoading(false)
    }
  }, [router])

  // Function to parse JWT token
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (e) {
      console.error("Failed to parse JWT token:", e)
      return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3C67FF]"></div>
      </div>
    )
  }

  // Check if userRoles includes "ROLE_Admin" or "ROLE_HeadBar"
  const isAdminOrHeadBar = userRoles.some((role) => role === "ROLE_Admin" || role === "ROLE_HeadBar" || role === "ROLE_CLevel")

  // Show original home page for admin and headbar roles
  if (isAdminOrHeadBar) {
    console.log("User has admin or headbar role, showing General component")
    return (
      <div className="grid grid-cols-2">
        <General />
      </div>
    )
  }

  // Show shift dashboard for other roles
  console.log("User does not have admin or headbar role, showing ShiftDashboard")
  return <ShiftDashboard />
}
