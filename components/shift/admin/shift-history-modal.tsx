"use client";

import { useState, useEffect } from "react";
import { format, isValid } from "date-fns";
import { id } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Search,
  Loader2,
  Clock,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingIndicator from "@/components/LoadingIndicator";

interface ShiftHistoryModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  baristaId?: string | null;
  baristaName?: string;
  startDate: string;
  endDate: string;
  mode?: "modal" | "tab";
  outlets?: Array<{ id: number | null; name: string }>;
}

interface ShiftHistoryItem {
  date: string;
  shiftType: number;
  hours?: string;
  outletName: string;
  baristaName?: string;
  hasOvertime?: boolean;
  overtimeStatus?: string;
  overtimeDuration?: number;
}

interface AdminBaristaShiftDetailDTO {
  shiftDate: string;
  shiftType: number;
  outletId: number;
  outletName: string;
  baristaName?: string;
  baristaId?: string;
  hasOvertime?: boolean;
  overtimeStatus?: string;
  overtimeDuration?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

export function ShiftHistoryModal({
  isOpen = false,
  onClose = () => {},
  baristaId = null,
  baristaName = "",
  startDate,
  endDate,
  mode = "modal",
  outlets = [],
}: ShiftHistoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shiftHistory, setShiftHistory] = useState<ShiftHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    outletId: "all",
    baristaName: "",
  });

  useEffect(() => {
    if ((mode === "modal" && isOpen && baristaId) || mode === "tab") {
      loadShiftHistory();
    } else if (mode === "modal") {
      setShiftHistory([]);
      setError(null);
    }
  }, [isOpen, baristaId, startDate, endDate, mode]);

  const loadShiftHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Silakan login terlebih dahulu.");
        return;
      }

      const queryParams = new URLSearchParams({
        startDate,
        endDate,
      });

      // Endpoint berbeda berdasarkan mode
      const endpoint =
        mode === "modal" && baristaId
          ? `https://rumahbaristensbe-production.up.railway.app/api/admin/barista/${baristaId}/shifts?${queryParams.toString()}`
          : `https://rumahbaristensbe-production.up.railway.app/api/admin/shifts/schedule?${queryParams.toString()}`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        console.error("Unauthorized access, redirecting to login");
        setError("Sesi Anda telah berakhir. Silakan login kembali.");
        // Jangan langsung redirect, biarkan pengguna melihat pesan error
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<AdminBaristaShiftDetailDTO[]> =
        await response.json();
      console.log("Shift history API response:", data);

      if (data.success && data.data) {
        const mappedShifts: ShiftHistoryItem[] = data.data.map((shift) => ({
          date: shift.shiftDate,
          shiftType: shift.shiftType,
          hours: shift.shiftType === 1 ? "07:00 - 15:00" : "15:00 - 23:00",
          outletName: shift.outletName,
          baristaName: shift.baristaName,
          hasOvertime: shift.hasOvertime || false,
          overtimeStatus: shift.overtimeStatus,
          overtimeDuration: shift.overtimeDuration,
        }));
        setShiftHistory(mappedShifts);
      } else {
        throw new Error(data.message || "Gagal memuat riwayat shift");
      }
    } catch (error) {
      console.error("Error loading shift history:", error);
      setError("Terjadi kesalahan saat memuat data");
      setShiftHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getShiftTypeName = (type: number | null | undefined) => {
    if (type === null || type === undefined) {
      return "Lembur";
    }
    switch (type) {
      case 1:
        return "Pagi";
      case 2:
        return "Sore";
      default:
        return `Tipe ${type}`;
    }
  };

  const filteredShiftHistory = shiftHistory
    .filter((shift) => {
      if (filter.outletId && filter.outletId !== "all") {
        return (
          shift.outletName ===
          outlets.find((o) => o.id === Number(filter.outletId))?.name
        );
      }
      return true;
    })
    .filter((shift) => {
      if (filter.baristaName && shift.baristaName) {
        return shift.baristaName
          .toLowerCase()
          .includes(filter.baristaName.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      // Add null/undefined checks to prevent the error
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });

  // Render sebagai modal
  if (mode === "modal") {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md md:max-w-2xl bg-white">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-800">
                  Riwayat Shift: {baristaName}
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-1">
                  Detail shift untuk periode{" "}
                  {format(new Date(startDate), "dd MMM yyyy", { locale: id })} -{" "}
                  {format(new Date(endDate), "dd MMM yyyy", { locale: id })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingIndicator />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg p-6 my-4">
              {error}
            </div>
          ) : shiftHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg p-6 my-4">
              Tidak ada data shift untuk periode ini
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto my-4">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">
                      Tanggal
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Tipe Shift
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Outlet
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Overtime
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftHistory.map((shift, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-teal-50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-teal-500" />
                          <span className="font-medium text-slate-800">
                            {shift.date && isValid(new Date(shift.date))
                              ? format(new Date(shift.date), "dd MMM yyyy", {
                                  locale: id,
                                })
                              : "Tanggal tidak valid"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                            shift.shiftType === null
                              ? "bg-purple-100 text-purple-800"
                              : shift.shiftType === 1
                              ? "bg-amber-100 text-amber-800"
                              : "bg-cyan-100 text-cyan-800"
                          }`}
                        >
                          {getShiftTypeName(shift.shiftType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-rose-500" />
                          <span className="font-medium text-slate-700">
                            {shift.outletName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {shift.hasOvertime ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="font-medium text-amber-700">
                              {shift.overtimeDuration} jam
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={onClose} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Render sebagai tab content
  return (
    <>
      <Card className="border-teal-100 bg-gradient-to-br from-teal-50 to-white shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b border-teal-100">
          <CardTitle className="text-lg font-medium text-teal-800">
            Filter Data
          </CardTitle>
          <CardDescription>
            Sesuaikan filter untuk melihat data yang diinginkan
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block text-slate-700">
                Filter Outlet
              </label>
              <Select
                value={filter.outletId}
                onValueChange={(value) =>
                  setFilter({
                    ...filter,
                    outletId: value,
                  })
                }
              >
                <SelectTrigger className="border-slate-200 bg-white hover:border-slate-300 transition-colors">
                  <SelectValue placeholder="Pilih outlet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Outlet</SelectItem>
                  {outlets.map((outlet) =>
                    outlet && outlet.id !== null && outlet.id !== undefined ? (
                      <SelectItem
                        key={`outlet-filter-${outlet.id}`}
                        value={String(outlet.id)}
                      >
                        {outlet.name || `Outlet ${outlet.id}`}
                      </SelectItem>
                    ) : null
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block text-slate-700">
                Cari Barista
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Nama barista..."
                  value={filter.baristaName}
                  onChange={(e) =>
                    setFilter({
                      ...filter,
                      baristaName: e.target.value,
                    })
                  }
                  className="pl-9 border-slate-200 bg-white hover:border-slate-300 transition-colors"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md hover:shadow-lg transition-shadow bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <CardTitle className="text-lg font-medium text-slate-800">
              Jadwal Shift
            </CardTitle>
            <CardDescription>Detail jadwal shift semua barista</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredShiftHistory.length === 0 ? (
            <div className="flex justify-center items-center h-40 bg-slate-50 rounded-lg p-4">
              <p className="text-slate-500">
                Tidak ada jadwal shift. Silakan tambahkan data shift terlebih
                dahulu.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">
                      Tanggal
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Barista
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Tipe Shift
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Outlet
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Overtime
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShiftHistory.map((shift, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-teal-50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-teal-500" />
                          <span className="font-medium text-slate-800">
                            {shift.date && isValid(new Date(shift.date))
                              ? format(new Date(shift.date), "dd MMM yyyy", {
                                  locale: id,
                                })
                              : "Tanggal tidak valid"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {shift.baristaName}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                            shift.shiftType === null
                              ? "bg-purple-100 text-purple-800"
                              : shift.shiftType === 1
                              ? "bg-amber-100 text-amber-800"
                              : "bg-cyan-100 text-cyan-800"
                          }`}
                        >
                          {getShiftTypeName(shift.shiftType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-rose-500" />
                          <span className="font-medium text-slate-700">
                            {shift.outletName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {shift.hasOvertime ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="font-medium text-amber-700">
                              {shift.overtimeDuration} jam
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
