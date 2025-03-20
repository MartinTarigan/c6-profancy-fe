"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface OvertimeLog {
  id: number;
  baristaId: number;
  userId: string;
  outletId: number;
  dateOvertime: string;
  startHour: string;
  duration: string;
  reason: string;
  status: string;
  statusDisplay: string;
  verifier: string | null;
  outletName: string;
  createdAt: string;
  updatedAt: string;
}

export default function DetailLogLembur() {
  const params = useParams();
  const router = useRouter();

  // Pastikan params.id diubah ke number
  const id = params.id ? Number(params.id) : NaN;

  const [overtimeLog, setOvertimeLog] = useState<OvertimeLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isNaN(id)) {
      fetchOvertimeLog(id);
    }
  }, [id]);

  const fetchOvertimeLog = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/overtime-logs/${id}`);
      if (!response.ok) throw new Error("Failed to fetch overtime log");

      const data = await response.json();
      setOvertimeLog(data);
    } catch (error) {
      console.error("Error fetching overtime log:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isNaN(id)) return <p className="text-center text-red-600">ID tidak valid</p>;
  if (loading) return <p className="text-center text-gray-600">Memuat data...</p>;
  if (!overtimeLog) return <p className="text-center text-gray-600">Log tidak ditemukan</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-center text-[#4169E1] mb-6">Detail Log Lembur</h1>

      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block font-medium">Tanggal Lembur</label>
            <Input value={overtimeLog.dateOvertime} readOnly />
          </div>
          <div className="space-y-2">
            <label className="block font-medium">Jam Mulai</label>
            <Input value={overtimeLog.startHour} readOnly />
          </div>
          <div className="space-y-2">
            <label className="block font-medium">Outlet</label>
            <Input value={overtimeLog.outletName} readOnly />
          </div>
          <div className="space-y-2">
            <label className="block font-medium">Durasi</label>
            <Input value={`${overtimeLog.duration} jam`} readOnly />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <label className="block font-medium">Alasan Lembur</label>
          <Textarea value={overtimeLog.reason} readOnly />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-2">
            <label className="block font-medium">Verifikator</label>
            <Input value={overtimeLog.verifier || "-"} readOnly />
          </div>
          <div className="space-y-2">
            <label className="block font-medium">Status</label>
            <Select defaultValue={overtimeLog.status} disabled>
              <SelectTrigger>
                <SelectValue>{overtimeLog.statusDisplay || overtimeLog.status}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVED">Diterima</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
                <SelectItem value="PENDING">Menunggu Konfirmasi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Button onClick={() => router.push("/jadwal/lembur")} className="w-40 bg-[#4169E1] hover:bg-[#3a5ecc]">
            Kembali
          </Button>
        </div>
      </div>
    </div>
  );
}
