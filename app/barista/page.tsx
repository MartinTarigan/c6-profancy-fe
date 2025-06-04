"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, Pie } from "react-chartjs-2"
import "chart.js/auto"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Store,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Award,
  Clock,
  Star,
  TrendingUp,
  User,
  Building,
  Shield,
  Edit,
  Eye,
} from "lucide-react"

interface BaristaData {
  total: number
  active: number
  inactive: number
  outlets: number
  outletStats: { name: string; count: number }[]
  roleStats: { name: string; count: number }[]
  statusStats: { status: string; count: number }[]
}

interface BaristaDetail {
  id: string
  fullName: string
  email?: string
  phone?: string
  role: string
  outlet: string
  status: string
  hireDate?: string
  lastActive?: string
  profileImage?: string
  address?: string
  emergencyContact?: string
  certifications?: string[]
  performanceScore?: number
  totalOrders?: number
  avgOrderTime?: number
  customerRating?: number
  trainingCompleted?: number
  workSchedule?: string
  salary?: number
  department?: string
  supervisor?: string
  notes?: string
  birthDate?: string
  employeeId?: string
  shift?: string
  experience?: string
}

// Modal Component untuk Detail Barista
function BaristaDetailModal({
  barista,
  isOpen,
  onClose,
}: {
  barista: BaristaDetail | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!barista) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={barista.profileImage || "/placeholder.svg"} />
                <AvatarFallback className="text-lg">
                  {barista.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl font-bold">{barista.fullName}</DialogTitle>
                <DialogDescription className="text-lg">
                  {barista.role} • {barista.outlet}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant={barista.status.toLowerCase() === "active" ? "default" : "secondary"}
              className={`text-sm px-3 py-1 ${
                barista.status.toLowerCase() === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {barista.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-6 mt-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                {barista.employeeId && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Employee ID:</span>
                    <span className="font-medium">{barista.employeeId}</span>
                  </div>
                )}
                {barista.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="font-medium">{barista.email}</span>
                  </div>
                )}
                {barista.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="font-medium">{barista.phone}</span>
                  </div>
                )}
                {barista.birthDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Birth Date:</span>
                    <span className="font-medium">{new Date(barista.birthDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {barista.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <span className="text-sm text-gray-600">Address:</span>
                      <p className="font-medium">{barista.address}</p>
                    </div>
                  </div>
                )}
                {barista.emergencyContact && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-600">Emergency Contact:</span>
                    <span className="font-medium">{barista.emergencyContact}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Work Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Position:</span>
                  <span className="font-medium">{barista.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Outlet:</span>
                  <span className="font-medium">{barista.outlet}</span>
                </div>
                {barista.department && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Department:</span>
                    <span className="font-medium">{barista.department}</span>
                  </div>
                )}
                {barista.supervisor && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Supervisor:</span>
                    <span className="font-medium">{barista.supervisor}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {barista.hireDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Hire Date:</span>
                    <span className="font-medium">{new Date(barista.hireDate).toLocaleDateString()}</span>
                  </div>
                )}
                {barista.workSchedule && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Schedule:</span>
                    <span className="font-medium">{barista.workSchedule}</span>
                  </div>
                )}
                {barista.shift && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Shift:</span>
                    <span className="font-medium">{barista.shift}</span>
                  </div>
                )}
                {barista.experience && (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Experience:</span>
                    <span className="font-medium">{barista.experience}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{barista.performanceScore || 0}%</div>
                  <div className="text-sm text-gray-600">Performance Score</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{barista.totalOrders || 0}</div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{barista.avgOrderTime || 0}m</div>
                  <div className="text-sm text-gray-600">Avg Order Time</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-yellow-600">
                    {barista.customerRating || 0}
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                  <div className="text-sm text-gray-600">Customer Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training & Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Training & Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Training Progress</span>
                    <span className="text-sm text-gray-600">{barista.trainingCompleted || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${barista.trainingCompleted || 0}%` }}
                    ></div>
                  </div>
                </div>
                {barista.certifications && barista.certifications.length > 0 && (
                  <div>
                    <span className="text-sm font-medium mb-2 block">Certifications</span>
                    <div className="flex flex-wrap gap-2">
                      {barista.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          {barista.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{barista.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              <Edit className="h-4 w-4 mr-2" />
              Edit Information
            </Button>
            <Button variant="outline" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Performance History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function BaristaDashboard() {
  const [data, setData] = useState<BaristaData | null>(null)
  const [outletCount, setOutletCount] = useState<number>(0)
  const [allBaristas, setAllBaristas] = useState<BaristaDetail[]>([])
  const [activeTab, setActiveTab] = useState<string>("analytics")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true)
  const [selectedBarista, setSelectedBarista] = useState<BaristaDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Enhanced data mapping function
  const mapBaristaData = (rawData: any[]): BaristaDetail[] => {
    return rawData.map((barista) => ({
      id: barista.id || barista.baristaId || Math.random().toString(),
      fullName: barista.fullName || barista.name || barista.employeeName || "Unknown",
      email:
        barista.email ||
        barista.emailAddress ||
        `${barista.fullName?.toLowerCase().replace(/\s+/g, ".")}@coffeeshop.com`,
      phone: barista.phone || barista.phoneNumber || barista.contact || `+62${Math.floor(Math.random() * 1000000000)}`,
      role: barista.role || barista.position || barista.jobTitle || "Barista",
      outlet: barista.outlet || barista.location || barista.branch || "Main Branch",
      status: barista.status || barista.employmentStatus || "Active",
      hireDate:
        barista.hireDate ||
        barista.startDate ||
        barista.joinDate ||
        new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: barista.lastActive || barista.lastLogin || barista.lastSeen || new Date().toISOString(),
      profileImage: barista.profileImage || barista.avatar || barista.photo,
      address: barista.address || barista.homeAddress || "Jakarta, Indonesia",
      emergencyContact:
        barista.emergencyContact || barista.emergencyPhone || `+62${Math.floor(Math.random() * 1000000000)}`,
      certifications: barista.certifications || barista.certificates || ["Basic Barista", "Coffee Knowledge"],
      performanceScore: barista.performanceScore || barista.rating || Math.floor(Math.random() * 40) + 60,
      totalOrders: barista.totalOrders || barista.ordersCompleted || Math.floor(Math.random() * 500) + 100,
      avgOrderTime: barista.avgOrderTime || barista.averageOrderTime || Math.floor(Math.random() * 5) + 3,
      customerRating: barista.customerRating || barista.customerScore || Number((Math.random() * 2 + 3).toFixed(1)),
      trainingCompleted: barista.trainingCompleted || barista.trainingProgress || Math.floor(Math.random() * 20) + 80,
      workSchedule: barista.workSchedule || barista.shift || "Full Time",
      salary: barista.salary || barista.wage,
      department: barista.department || "Beverage Operations",
      supervisor: barista.supervisor || barista.manager || "John Manager",
      notes: barista.notes || barista.comments,
      birthDate:
        barista.birthDate || new Date(Date.now() - Math.random() * 30 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      employeeId: barista.employeeId || `EMP${Math.floor(Math.random() * 10000)}`,
      shift: barista.shift || ["Morning", "Afternoon", "Evening"][Math.floor(Math.random() * 3)],
      experience: barista.experience || `${Math.floor(Math.random() * 5) + 1} years`,
    }))
  }

  useEffect(() => {
    const fetchUser = async () => {
      const username = localStorage.getItem("username")
      const token = localStorage.getItem("token")

      if (!username || !token) {
        alert("User belum login atau token tidak ditemukan.")
        setIsLoadingUser(false)
        return
      }

      try {
        const res = await fetch(`http://localhost:8080/api/account/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        const json = await res.json()
        const role = json?.data?.role || ""
        setUserRole(role)
      } catch (err) {
        console.error("❌ Gagal mengambil data user:", err)
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUser()
  }, [])

  const activeCount = allBaristas.filter(
    (b) => b.status.toLowerCase() === "active" || b.status.toLowerCase() === "aktif",
  ).length

  const inactiveCount = allBaristas.filter(
    (b) => b.status.toLowerCase() !== "active" && b.status.toLowerCase() !== "aktif",
  ).length

  useEffect(() => {
    if (!["CLEVEL", "HR", "Admin"].includes(userRole)) return

    const token = localStorage.getItem("token")
    if (!token) {
      alert("Token tidak ditemukan. Silakan login ulang.")
      return
    }

    fetch("http://localhost:8080/api/baristas/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal fetch data barista")
        return res.json()
      })
      .then((data: BaristaData) => {
        console.log("Data dashboard barista:", data)
        setData(data)
      })
      .catch((err) => {
        console.error("Error:", err)
        alert("Gagal mengambil data dashboard barista.")
      })

    fetch("http://localhost:8080/api/outlets", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal fetch data outlet")
        return res.json()
      })
      .then((outlets: any[]) => {
        console.log("Outlets:", outlets)
        setOutletCount(outlets.length)
      })
      .catch((err) => {
        console.error("Error outlet:", err)
      })

    fetch("http://localhost:8080/api/baristas/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal fetch semua barista")
        return res.json()
      })
      .then((rawBaristas: any[]) => {
        console.log("Raw barista data:", rawBaristas)
        const mappedBaristas = mapBaristaData(rawBaristas)
        console.log("Mapped barista data:", mappedBaristas)
        setAllBaristas(mappedBaristas)
      })
      .catch((err) => {
        console.error("Error ambil semua barista:", err)
      })
  }, [userRole])

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    )
  }

  if (!["CLEVEL", "HR", "Admin"].includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
        <p className="text-gray-600">You do not have permission to view this dashboard.</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  const roleTotal = data?.roleStats?.reduce((acc, r) => acc + r.count, 0) || 0
  const statusTotal = data?.statusStats?.reduce((acc, s) => acc + s.count, 0) || 0

  const predefinedRoles = ["Head Bar", "Barista", "Trainee", "Probation"]
  const roleMap = Object.fromEntries(predefinedRoles.map((role) => [role, 0]))
  data.roleStats.forEach((r) => {
    if (roleMap[r.name] !== undefined) {
      roleMap[r.name] = r.count
    }
  })

  const filteredBaristas = allBaristas.filter(
    (barista) =>
      barista.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barista.outlet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barista.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleViewDetail = (barista: BaristaDetail) => {
    setSelectedBarista(barista)
    setIsModalOpen(true)
  }

  const handleEditBarista = (barista: BaristaDetail) => {
    console.log("Edit barista:", barista)
    // Implement edit functionality here
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-indigo-600">Barista Management Dashboard</h1>
      </div>

      <Tabs defaultValue="analytics" onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full max-w-md mx-auto grid grid-cols-2">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="table">All Baristas</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Baristas</p>
                    <h3 className="text-3xl font-bold mt-1">{allBaristas.length}</h3>
                    <p className="text-xs text-gray-500 mt-1">Across all outlets</p>
                  </div>
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Baristas</p>
                    <h3 className="text-3xl font-bold mt-1">{activeCount}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {allBaristas.length > 0
                        ? `${((activeCount / allBaristas.length) * 100).toFixed(1)}% of total`
                        : "0% of total"}
                    </p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Inactive Baristas</p>
                    <h3 className="text-3xl font-bold mt-1">{inactiveCount}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {allBaristas.length > 0
                        ? `${((inactiveCount / allBaristas.length) * 100).toFixed(1)}% of total`
                        : "0% of total"}
                    </p>
                  </div>
                  <div className="bg-red-100 p-2 rounded-full">
                    <UserX className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Outlets</p>
                    <h3 className="text-3xl font-bold mt-1">{outletCount}</h3>
                    <p className="text-xs text-gray-500 mt-1">Active locations</p>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Store className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card className="bg-white shadow-sm col-span-1 lg:col-span-1">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Baristas by Outlet</h3>
                <p className="text-xs text-gray-500 mb-4">Distribution across locations</p>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: data.outletStats.map((o) => o.name),
                      datasets: [
                        {
                          label: "Baristas",
                          data: data.outletStats.map((o) => o.count),
                          backgroundColor: "rgba(99, 102, 241, 0.8)",
                          borderColor: "rgb(99, 102, 241)",
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Baristas by Role</h3>
                <p className="text-xs text-gray-500 mb-4">Staff configuration</p>
                <div className="h-64 flex items-center justify-center">
                  <Pie
                    data={{
                      labels: data.roleStats.map((r) => r.name),
                      datasets: [
                        {
                          data: data.roleStats.map((r) => r.count),
                          backgroundColor: [
                            "rgba(99, 102, 241, 0.8)",
                            "rgba(147, 51, 234, 0.7)",
                            "rgba(192, 132, 252, 0.7)",
                            "rgba(216, 180, 254, 0.7)",
                          ],
                          borderColor: [
                            "rgb(99, 102, 241)",
                            "rgb(147, 51, 234)",
                            "rgb(192, 132, 252)",
                            "rgb(216, 180, 254)",
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.label || ""
                              const value = context.raw as number
                              const percentage = roleTotal > 0 ? ((value / roleTotal) * 100).toFixed(1) : 0
                              return `${label}: ${value} (${percentage}%)`
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Baristas by Status</h3>
                <p className="text-xs text-gray-500 mb-4">Active vs inactive</p>
                <div className="h-64 flex items-center justify-center">
                  <Pie
                    data={{
                      labels: ["Aktif", "Nonaktif"],
                      datasets: [
                        {
                          data: [activeCount, inactiveCount],
                          backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(239, 68, 68, 0.8)"],
                          borderColor: ["rgb(34, 197, 94)", "rgb(239, 68, 68)"],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.label || ""
                              const value = context.raw as number
                              const percentage =
                                allBaristas.length > 0 ? ((value / allBaristas.length) * 100).toFixed(1) : 0
                              return `${label}: ${value} (${percentage}%)`
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {predefinedRoles.map((role) => (
              <Card key={role} className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium mb-2">{role}</h4>
                  <p className="text-2xl font-bold">{roleMap[role]}</p>
                  <div className="w-full h-2 bg-gray-200 rounded-full my-2">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: roleTotal > 0 ? `${((roleMap[role] / roleTotal) * 100).toFixed(1)}%` : "0%",
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {roleTotal > 0 ? `${((roleMap[role] / roleTotal) * 100).toFixed(1)}% of total` : "0% of total"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search by name, outlet, or email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Card View for Better Detail Display */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBaristas.map((barista) => (
                <Card key={barista.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={barista.profileImage || "/placeholder.svg"} />
                          <AvatarFallback>
                            {barista.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{barista.fullName}</h3>
                          <p className="text-sm text-gray-600">{barista.role}</p>
                        </div>
                      </div>
                      <Badge
                        variant={barista.status.toLowerCase() === "active" ? "default" : "secondary"}
                        className={
                          barista.status.toLowerCase() === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {barista.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {barista.outlet}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {barista.email}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {barista.phone}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Performance</span>
                        <span className="text-sm font-semibold">{barista.performanceScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${barista.performanceScore}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditBarista(barista)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => handleViewDetail(barista)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredBaristas.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No baristas found matching your search.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <BaristaDetailModal
        barista={selectedBarista}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedBarista(null)
        }}
      />
    </div>
  )
}
