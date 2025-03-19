"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, SlidersHorizontal, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { OvertimeLog } from "@/types/overtime-log"
import { useRouter } from "next/navigation"

export default function OvertimeLogTable() {
  const router = useRouter()
  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchOvertimeLogs()
  }, [])

  const fetchOvertimeLogs = async () => {
    setLoading(true)
    try {
      // In a real app, you would filter by the current user's ID
      const response = await fetch("/api/overtime-logs")
      if (!response.ok) throw new Error("Failed to fetch overtime logs")

      const data = await response.json()
      setOvertimeLogs(data)
    } catch (error) {
      console.error("Error fetching overtime logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600"
      case "REJECTED":
        return "text-red-600"
      case "PENDING":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Diterima"
      case "REJECTED":
        return "Ditolak"
      case "PENDING":
        return "Menunggu Konfirmasi"
      default:
        return status
    }
  }

  const filteredLogs = overtimeLogs.filter(
    (log) =>
      log.outletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddClick = () => {
    router.push("/tambah-log-lembur")
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-between mb-6 md:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-[#4169E1]">Log Lembur Saya</h1>
        </div>
        <Button onClick={handleAddClick} className="mt-4 md:mt-0 bg-[#4169E1] hover:bg-[#3a5ecc]">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Log Lembur
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search by name or outlet..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <SlidersHorizontal size={16} />
            <span>Sort By</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <SlidersHorizontal size={16} />
            <span>Filter</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#4169E1] text-white">
              <th className="px-4 py-3 text-left">Tanggal Lembur</th>
              <th className="px-4 py-3 text-left">Jam Mulai</th>
              <th className="px-4 py-3 text-left">Outlet</th>
              <th className="px-4 py-3 text-left">Durasi</th>
              <th className="px-4 py-3 text-left">Alasan Lembur</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Verifikator</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-3 text-center">
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#4169E1]"></div>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-3 text-center">
                  Tidak ada data lembur ditemukan
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => (
                <tr key={log.id} className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <td className="px-4 py-3">
                    {new Date(log.dateOvertime).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">{log.startHour.substring(0, 5)}</td>
                  <td className="px-4 py-3">{log.outletName}</td>
                  <td className="px-4 py-3">{log.duration.split(":")[0]} jam</td>
                  <td className="px-4 py-3">{log.reason}</td>
                  <td className={`px-4 py-3 ${getStatusClass(log.status)}`}>{getStatusDisplay(log.status)}</td>
                  <td className="px-4 py-3">{log.verifier || "-"}</td>
                  <td className="px-4 py-3">
                    <Button className="bg-[#4169E1] hover:bg-[#3a5ecc]" size="sm">
                      Detail
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

