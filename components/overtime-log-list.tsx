"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Filter, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { OvertimeLog } from "@/types/overtime-log"
import { useRouter } from "next/navigation"
import OvertimeLogModal from "./overtime-log-modal"

export default function OvertimeLogList() {
  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortOrder, setSortOrder] = useState("desc")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchOvertimeLogs()
  }, [statusFilter, sortOrder])

  const fetchOvertimeLogs = async () => {
    setLoading(true)
    try {
      let url = "/api/overtime-logs?"
      if (statusFilter) url += `status=${statusFilter}&`
      if (sortOrder) url += `sort=${sortOrder}&`
      if (searchTerm) url += `baristaName=${searchTerm}`

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch overtime logs")

      const data = await response.json()
      setOvertimeLogs(data)
    } catch (error) {
      console.error("Error fetching overtime logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOvertimeLogs()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // Format HH:MM
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const handleViewDetail = (id: number) => {
    router.push(`/overtime-logs/${id}`)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Lembur</h1>
          <p className="text-gray-500">Kelola catatan lembur barista</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="mt-4 md:mt-0 bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Lembur
        </Button>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Cari nama barista..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="APPROVED">Disetujui</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <span className="mr-2">Urutkan</span>
                    {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOrder("asc")}>Terlama</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder("desc")}>Terbaru</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : overtimeLogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Tidak ada data lembur ditemukan</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {overtimeLogs.map((log) => (
            <Card key={log.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{log.outletName}</h3>
                      <p className="text-sm text-gray-500">ID: {log.id}</p>
                    </div>
                    <Badge className={getStatusColor(log.status)}>{log.statusDisplay}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tanggal Lembur</p>
                      <p>{formatDate(log.dateOvertime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Jam Mulai</p>
                      <p>{formatTime(log.startHour)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Durasi</p>
                      <p>{formatTime(log.duration)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-gray-50 flex justify-end">
                  <Button variant="outline" onClick={() => handleViewDetail(log.id)}>
                    Lihat Detail
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <OvertimeLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false)
          fetchOvertimeLogs()
        }}
      />
    </div>
  )
}

