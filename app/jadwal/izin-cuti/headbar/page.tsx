"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Clock, Users, CheckSquare, FileBarChart } from "lucide-react"
import Link from "next/link"

interface LeaveRequest {
  id: string
  userName: string
  requestDate: string
  leaveType: "OFF_DAY" | "IZIN"
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED"
  createdAt: string
  updatedAt: string
}

interface UserProfile {
  id: string
  username: string
  fullName: string
  role: string
  outlet: {
    id: string
    name: string
  }
}

// function parseJwt(token: string) {
//   try {
//     const base64Url = token.split(".")[1]
//     const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
//     const jsonPayload = decodeURIComponent(
//       atob(base64)
//         .split("")
//         .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
//         .join(""),
//     )
//     return JSON.parse(jsonPayload)
//   } catch (e) {
//     console.error("Failed to parse JWT:", e)
//     return null
//   }
// }

export default function HeadBarLeaveRequestPage() {
  const router = useRouter()
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Stats
  const [totalIzin, setTotalIzin] = useState(0)
  const [totalCuti, setTotalCuti] = useState(0)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [totalBaristas, setTotalBaristas] = useState(0)
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([])

  // Fetch leave requests for approval
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Checking auth...")
        const token = localStorage.getItem("token")

        if (!token) {
          console.log("No token, redirecting to login")
          router.push("/login")
          return
        }

        // // Get user profile first to get outlet ID
        // const jwtPayload = parseJwt(token)
        // if (!jwtPayload || !jwtPayload.sub) {
        //   console.log("Invalid token, redirecting to login")
        //   router.push("/login")
        //   return
        // }

        setIsLoading(true)

        // Tambahkan try-catch yang lebih baik pada bagian fetch user profile
        try {
          // Fetch user profile
          const profileResponse = await fetch(`http://localhost:8080/api/user/profile`, {
            method: "GET",
            // headers: {
            //   Authorization: `Bearer ${token}`,
            // },
          })

          if (!profileResponse.ok) {
            // Tambahkan logging untuk debugging
            console.error(`Profile response status: ${profileResponse.status}`)

            // Jika 401, kemungkinan token expired
            if (profileResponse.status === 401) {
              localStorage.clear() // Clear all localStorage
              router.push("/login")
              return
            }

            throw new Error(`Error fetching user profile: ${profileResponse.status}`)
          }

          const profileData = await profileResponse.json()
          const profile = profileData.data
          setUserProfile(profile)

          if (!profile || !profile.outlet || !profile.outlet.id) {
            console.error("Invalid profile data:", profile)
            throw new Error("User is not assigned to any outlet")
          }
        } 
        catch (err) {
          setError(err instanceof Error ? err.message : "An unknown error occurred")
          console.error("Error fetching user profile:", err)
          setIsLoading(false)
          return
        }

        const outletId = userProfile?.outlet?.id

        // Fetch leave requests for the outlet
        const leaveResponse = await fetch(
          `http://localhost:8080/api/shift-management/leave-request/outlet/${outletId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (!leaveResponse.ok) {
          throw new Error(`Error fetching leave requests: ${leaveResponse.status}`)
        }

        const leaveData = await leaveResponse.json()
        const requests = leaveData.data || []
        setLeaveRequests(requests)

        // Calculate stats
        let izinCount = 0
        let cutiCount = 0
        let pendingCount = 0

        requests.forEach((request: LeaveRequest) => {
          if (request.leaveType === "IZIN") {
            izinCount++
          } else if (request.leaveType === "OFF_DAY") {
            cutiCount++
          }

          if (request.status === "PENDING") {
            pendingCount++
          }
        })

        setTotalIzin(izinCount)
        setTotalCuti(cutiCount)
        setPendingRequests(pendingCount)

        // Get recent pending requests (last 5)
        const pendingReqs = requests
          .filter((req: LeaveRequest) => req.status === "PENDING")
          .sort((a: LeaveRequest, b: LeaveRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        setRecentRequests(pendingReqs)

        // Fetch total baristas in the outlet
        const baristasResponse = await fetch(`http://localhost:8080/api/users/baristas/outlet/${outletId}/count`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (baristasResponse.ok) {
          const baristasResult = await baristasResponse.json()
          setTotalBaristas(baristasResult.data || 0)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, userProfile])

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return new Date(dateString).toLocaleDateString("id-ID", options)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-destructive text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="bg-blue-600 -mx-6 -mt-6 px-6 py-4 mb-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        {userProfile && (
          <div className="text-white mt-1">
            <p>Selamat datang, {userProfile.fullName}</p>
            {userProfile.outlet && <p className="text-sm text-blue-100">Outlet: {userProfile.outlet.name}</p>}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Total Izin</h3>
                <p className="text-4xl font-bold mt-2">{totalIzin}</p>
                <p className="text-sm text-muted-foreground mt-1">Permohonan izin</p>
              </div>
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Total Cuti</h3>
                <p className="text-4xl font-bold mt-2">{totalCuti}</p>
                <p className="text-sm text-muted-foreground mt-1">Permohonan cuti</p>
              </div>
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Pending Requests</h3>
                <p className="text-4xl font-bold mt-2">{pendingRequests}</p>
                <p className="text-sm text-muted-foreground mt-1">Menunggu persetujuan</p>
              </div>
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Total Barista</h3>
                <p className="text-4xl font-bold mt-2">{totalBaristas}</p>
                <p className="text-sm text-muted-foreground mt-1">Aktif bulan ini</p>
              </div>
              <Users className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Menu */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-1">Menu Cepat</h2>
            <p className="text-sm text-muted-foreground mb-6">Akses cepat ke fitur utama</p>

            <div className="space-y-4">
              <Link href="/jadwal/izin-cuti/headbar/approval" className="w-full block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                  <CheckSquare size={18} />
                  <span>Approval Permohonan</span>
                </Button>
              </Link>

              <Link href="/jadwal/izin-cuti/headbar/reports" className="w-full block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                  <FileBarChart size={18} />
                  <span>Lihat Laporan Izin/Cuti</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-1">Permohonan Terbaru</h2>
            <p className="text-sm text-muted-foreground mb-6">Permohonan yang baru diajukan</p>

            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Tidak ada permohonan terbaru</div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{request.userName}</p>
                        <p className="text-sm">
                          {request.leaveType === "IZIN" ? "Izin" : "Cuti"}: {formatDate(request.requestDate)}
                        </p>
                        <p className="text-sm text-muted-foreground truncate max-w-[250px]">{request.reason}</p>
                      </div>
                      <Link href={`/jadwal/izin-cuti/headbar/approval?id=${request.id}`}>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

