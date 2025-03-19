"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Outlet {
  id: number
  name: string
}

interface OvertimeLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function OvertimeLogModal({ isOpen, onClose, onSuccess }: OvertimeLogModalProps) {
  const { toast } = useToast()
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    outletId: "",
    dateOvertime: "",
    startHour: "",
    duration: "",
    reason: "",
  })

  // Mock data for demo purposes
  useEffect(() => {
    setOutlets([
      { id: 1, name: "Depok" },
      { id: 2, name: "Jakarta" },
      { id: 3, name: "Bogor" },
    ])
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
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

      const payload = {
        ...formData,
        baristaId,
        outletId: Number.parseInt(formData.outletId),
        userId,
      }

      const response = await fetch("/api/overtime-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to create overtime log")

      toast({
        title: "Berhasil!",
        description: "Catatan lembur berhasil ditambahkan",
      })

      onSuccess()
    } catch (error) {
      console.error("Error creating overtime log:", error)
      toast({
        title: "Gagal!",
        description: "Terjadi kesalahan saat menambahkan catatan lembur",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Log Lembur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="outletId">Outlet</Label>
              <Select
                value={formData.outletId}
                onChange={(value) => handleSelectChange("outletId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id.toString()}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOvertime">Tanggal Lembur</Label>
              <Input
                id="dateOvertime"
                name="dateOvertime"
                type="date"
                value={formData.dateOvertime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startHour">Jam Mulai</Label>
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
                <Label htmlFor="duration">Durasi (jam)</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => handleSelectChange("duration", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih durasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01:00:00">1 jam</SelectItem>
                    <SelectItem value="02:00:00">2 jam</SelectItem>
                    <SelectItem value="03:00:00">3 jam</SelectItem>
                    <SelectItem value="04:00:00">4 jam</SelectItem>
                    <SelectItem value="05:00:00">5 jam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Lembur</Label>
              <Textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Masukkan alasan lembur..."
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#4169E1] hover:bg-[#3a5ecc]">
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

