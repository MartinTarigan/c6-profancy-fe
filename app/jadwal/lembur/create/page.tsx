"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Toast from "@/components/toast"

export default function TambahLogLembur() {
  const [ toast, setToast ] = useState<{ type: string; message: string } | null >( null )
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dateOvertime: "",
    startHour: "",
    outlet: "",
    duration: "",
    reason: "",
    verifier: "Saras", // Pre-filled
    status: "ONGOING", // Default status (Ongoing/Cancelled)
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // For duration, only allow whole numbers
    if (name === "duration") {
      const numericValue = value.replace(/\D/g, "")
      setFormData((prev) => ({ ...prev, [name]: numericValue }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // In a real app, you would get the userId and baristaId from authentication context
      const userId = "00000000-0000-0000-0000-000000000000" // Mock UUID
      const baristaId = 1 // Mock barista ID
      const outletId = 1 // Mock outlet ID based on outlet name

      const payload = {
        baristaId,
        userId,
        outletId,
        dateOvertime: formData.dateOvertime,
        startHour: `${formData.startHour}:00`,
        duration: `${formData.duration}:00:00`, // Format as HH:00:00
        reason: formData.reason,
        outlet: formData.outlet,
        status: formData.status, // ONGOING or CANCELLED
      }

      const response = await fetch("/api/overtime-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to create overtime log")

      setToast({
        type: "Berhasil!",
        message: "Catatan lembur berhasil ditambahkan",
      });

      // Redirect back to the overtime logs list
      window.location.href = "/jadwal/lembur"
    } catch (error) {
      console.error("Error creating overtime log:", error)
      setToast({
        type: "Gagal!",
        message: "Terjadi kesalahan saat menambahkan catatan lembur",
      });
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    window.location.href = "/jadwal/lembur"
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center text-[#4169E1] mb-6">Tambah Log Lembur</h1>

      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="dateOvertime" className="block font-medium">
                Tanggal Lembur
              </label>
              <Input
                id="dateOvertime"
                name="dateOvertime"
                type="date"
                value={formData.dateOvertime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="startHour" className="block font-medium">
                Jam Mulai
              </label>
              <Input
                id="startHour"
                name="startHour"
                type="time"
                value={formData.startHour}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="outlet" className="block font-medium">
                Outlet
              </label>
              <Select value={formData.outlet} onChange={(value) => handleSelectChange("outlet", value)} required>
              <SelectTrigger>
                <SelectValue> Pilih status </SelectValue>
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Margonda">Margonda</SelectItem>
                  <SelectItem value="Kantin Vokasi UI">Kantin Vokasi UI</SelectItem>
                  <SelectItem value="UIN Ciputat">UIN Ciputat</SelectItem>
                  <SelectItem value="Pamulang">Pamulang</SelectItem>
                  <SelectItem value="UPN Veteran Jakarta">UPN Veteran Jakarta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="duration" className="block font-medium">
                Durasi
              </label>
              <div className="relative">
                <Input
                  id="duration"
                  name="duration"
                  type="text"
                  value={formData.duration}
                  onChange={handleChange}
                  className="pr-12"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  jam
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reason" className="block font-medium">
              Alasan Lembur
            </label>
            <div className="relative">
              <Textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={4}
                maxLength={20}
                required
              />
              <div className="text-xs text-gray-500 mt-1 text-right">{formData.reason.length}/20 karakter</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="verifier" className="block font-medium">
                Verifikator
              </label>
              <Input id="verifier" name="verifier" value={formData.verifier} onChange={handleChange} readOnly />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="block font-medium">
                Status
              </label>
              <Select value={formData.status} onVolumeChange={(value) => handleSelectChange("status", value)} required>
              <SelectTrigger>
                <SelectValue> Pilih status </SelectValue>
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-medium">Status Lembur</label>
            <div className="text-yellow-600">Menunggu Konfirmasi</div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-40 border-red-500 text-red-500 hover:bg-red-50"
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="w-40 bg-[#4169E1] hover:bg-[#3a5ecc]">
              {loading ? "Menyimpan..." : "Simpan Log"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

