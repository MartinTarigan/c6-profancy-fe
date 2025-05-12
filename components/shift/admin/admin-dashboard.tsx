"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Filter,
  Loader2,
  RefreshCcw,
  Users,
  Clock,
  Search,
  MapPin,
  BarChart3,
  Download,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { debounce } from "lodash";
import { format, isValid } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Toast from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingIndicator from "@/components/LoadingIndicator";
import { ShiftHistoryModal } from "@/components/shift/admin/shift-history-modal";
import { ShiftDistributionChart } from "@/components/shift/admin/shift-distribution-chart";

interface AdminDashboardFilterRequestDTO {
  startDate: string;
  endDate: string;
  outletId?: number;
  baristaName?: string;
}

interface ShiftDetail {
  shiftDate: string; // Change from 'date' to 'shiftDate' to match backend DTO
  shiftType: number;
}

interface BaristaShiftSummaryDTO {
  baristaId: string;
  baristaName: string;
  outletId: number;
  outletName: string;
  shifts: ShiftDetail[];
  overtimeDays: number;
}

// Sesuaikan dengan OutletResponseDTO dari backend
interface Outlet {
  outletId: number; // Perubahan dari id ke outletId untuk sesuai dengan backend
  name: string;
  location?: string;
  headBarName?: string;
  headBarId?: string;
}

interface BaristaTableData {
  baristaId: string;
  baristaName: string;
  outletId: number;
  outletName: string;
  workDays: number;
  overtimeDays: number;
}

interface HistogramData {
  range: string;
  count: number;
  [key: string]: number | string;
}

interface DashboardMetrics {
  averageWorkDays: number;
  totalBaristas: number;
  totalShifts: number;
  totalOvertimeDays: number;
  mostActiveOutlet: string;
  mostActiveBarista: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

export function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOutlets, setSelectedOutlets] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [summaryData, setSummaryData] = useState<BaristaShiftSummaryDTO[]>([]);
  const [tableData, setTableData] = useState<BaristaTableData[]>([]);
  const [histogramData, setHistogramData] = useState<HistogramData[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    averageWorkDays: 0,
    totalBaristas: 0,
    totalShifts: 0,
    totalOvertimeDays: 0,
    mostActiveOutlet: "",
    mostActiveBarista: "",
  });

  const [selectedBarista, setSelectedBarista] = useState<string | null>(null);
  const [selectedBaristaName, setSelectedBaristaName] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortField, setSortField] = useState<string>("workDays");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [shiftScheduleFilter, setShiftScheduleFilter] = useState({
    outletId: "all",
    baristaName: "",
  });

  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const roles = localStorage.getItem("roles");

    // Cek apakah token atau roles tidak ada
    if (!token || !roles) {
      setToastMessage({
        type: "error",
        message: "Akses ditolak. Silakan login sebagai admin.",
      });
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("roles");
      window.location.href = "/login";
      return;
    }

    // Cek apakah roles adalah JSON string atau string biasa
    let rolesArray: string[];
    if (roles.startsWith("[") && roles.endsWith("]")) {
      // Jika terlihat seperti JSON array
      try {
        rolesArray = JSON.parse(roles);
      } catch (e) {
        console.error("Failed to parse roles as JSON:", e);
        rolesArray = [roles]; // Jika gagal parse, anggap sebagai string biasa
      }
    } else {
      // Jika bukan JSON, anggap sebagai string biasa
      rolesArray = [roles];
    }

    // Cek apakah ada role "ADMIN" (case-insensitive)
    const hasAdminRole = rolesArray.some(
      (role) => typeof role === "string" && role.toUpperCase() === "ADMIN"
    );

    if (!hasAdminRole) {
      setToastMessage({
        type: "error",
        message: "Akses ditolak. Silakan login sebagai admin.",
      });
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("roles");
      window.location.href = "/login";
      return;
    }

    // Jika role valid, lanjutkan memuat data
    loadOutlets();
  }, []);

  // Fungsi loadOutlets dengan Bearer Token
  const loadOutlets = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setToastMessage({
          type: "error",
          message: "Silakan login terlebih dahulu.",
        });
        window.location.href = "/login";
        return;
      }

      const response = await fetch("http://localhost:8080/api/admin/outlets", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        setToastMessage({
          type: "error",
          message: "Sesi Anda telah berakhir. Silakan login kembali.",
        });
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("roles");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(`Gagal memuat outlet: ${response.statusText}`);
      }

      const result: ApiResponse<Outlet[]> = await response.json();
      console.log("Outlet data received:", result);
      console.log("Raw outlet data:", JSON.stringify(result.data, null, 2));

      if (result.success && result.data) {
        // Filter out outlets with null or undefined outletIds
        const validOutlets: Outlet[] = result.data
          .filter(
            (outlet) =>
              outlet &&
              outlet.outletId !== null &&
              outlet.outletId !== undefined
          )
          .map((outlet) => ({
            outletId: outlet.outletId,
            name: outlet.name || `Outlet ${outlet.outletId}`,
            location: outlet.location || "",
            headBarName: outlet.headBarName || "",
            headBarId: outlet.headBarId ? String(outlet.headBarId) : "",
          }));

        console.log("Processed valid outlets:", validOutlets);
        setOutlets(validOutlets);

        // After loading outlets, load dashboard data
        loadDashboardData();
      } else {
        throw new Error(result.message || "Gagal memuat data outlet");
      }
    } catch (error) {
      console.error("Error loading outlets:", error);
      setToastMessage({
        type: "error",
        message: "Gagal memuat data outlet. Silakan coba lagi.",
      });
      setError("Gagal memuat data outlet. Silakan coba lagi nanti.");
    }
  };

  // Fungsi loadDashboardData dengan Bearer Token
  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setToastMessage({
          type: "error",
          message: "Silakan login terlebih dahulu.",
        });
        window.location.href = "/login";
        return;
      }

      const requestDTO: AdminDashboardFilterRequestDTO = {
        startDate: format(dateRange?.from || new Date(), "yyyy-MM-dd"),
        endDate: format(dateRange?.to || new Date(), "yyyy-MM-dd"),
        outletId: selectedOutlets.length > 0 ? selectedOutlets[0] : undefined,
        baristaName: searchQuery || undefined,
      };

      console.log("Sending filter request:", requestDTO);

      const queryParams = new URLSearchParams();
      queryParams.append("startDate", requestDTO.startDate);
      queryParams.append("endDate", requestDTO.endDate);
      if (requestDTO.baristaName)
        queryParams.append("baristaName", requestDTO.baristaName);
      if (requestDTO.outletId)
        queryParams.append("outletId", requestDTO.outletId.toString());

      const response = await fetch(
        `http://localhost:8080/api/admin/dashboard/summary?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.status === 401) {
        setToastMessage({
          type: "error",
          message: "Sesi Anda telah berakhir. Silakan login kembali.",
        });
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("roles");
        window.location.href = "/login";
        return;
      }

      if (!response.ok)
        throw new Error(`Gagal memuat data: ${response.statusText}`);

      const result: ApiResponse<BaristaShiftSummaryDTO[]> =
        await response.json();
      console.log("Dashboard API response:", result);

      if (result.success && result.data) {
        // Log shift dates for debugging
        result.data.forEach((summary) => {
          console.log(
            `Barista: ${summary.baristaName}, Shifts:`,
            summary.shifts
          );
          summary.shifts.forEach((shift) => {
            console.log(
              `Shift date: ${shift.shiftDate}, type: ${shift.shiftType}`
            );
          });
        });

        const summaryData = result.data;
        const tableData: BaristaTableData[] = summaryData.map((summary) => ({
          baristaId: summary.baristaId,
          baristaName: summary.baristaName,
          outletId: summary.outletId,
          outletName: summary.outletName,
          workDays: summary.shifts ? summary.shifts.length : 0,
          overtimeDays: summary.overtimeDays || 0,
        }));

        setTableData(tableData);
        setSummaryData(summaryData);

        const totalBaristas = tableData.length;
        const totalShifts = tableData.reduce(
          (sum, barista) => sum + barista.workDays,
          0
        );
        const totalOvertimeDays = summaryData.reduce(
          (sum, summary) => sum + (summary.overtimeDays || 0),
          0
        );
        const averageWorkDays =
          totalBaristas > 0 ? Math.round(totalShifts / totalBaristas) : 0;

        const outletCounts = new Map<string, number>();
        tableData.forEach((barista) => {
          const count = outletCounts.get(barista.outletName) || 0;
          outletCounts.set(barista.outletName, count + barista.workDays);
        });

        let mostActiveOutlet = "";
        let maxOutletShifts = 0;
        outletCounts.forEach((count, outlet) => {
          if (count > maxOutletShifts) {
            mostActiveOutlet = outlet;
            maxOutletShifts = count;
          }
        });

        let mostActiveBarista = "";
        let maxBaristaShifts = 0;
        tableData.forEach((barista) => {
          if (barista.workDays > maxBaristaShifts) {
            mostActiveBarista = barista.baristaName;
            maxBaristaShifts = barista.workDays;
          }
        });

        setMetrics({
          averageWorkDays,
          totalBaristas,
          totalShifts,
          totalOvertimeDays,
          mostActiveOutlet,
          mostActiveBarista,
        });

        // Generate histogram data menggunakan fungsi helper
        const histogramData = generateHistogramData(tableData, outlets);
        setHistogramData(histogramData);

        setToastMessage({
          type: "success",
          message:
            result.message ||
            `Data berhasil dimuat untuk periode ${format(
              dateRange?.from || new Date(),
              "yyyy-MM-dd"
            )} - ${format(dateRange?.to || new Date(), "yyyy-MM-dd")}`,
        });
      } else {
        setToastMessage({
          type: "info",
          message:
            "Tidak ada data barista untuk periode ini. Silakan tambahkan data shift terlebih dahulu.",
        });
        setTableData([]);
        setSummaryData([]);
        const emptyHistogram = [
          { range: "0-9", count: 0 },
          { range: "10-14", count: 0 },
          { range: "15-19", count: 0 },
          { range: "20-24", count: 0 },
          { range: "25+", count: 0 },
        ];
        setHistogramData(emptyHistogram);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setToastMessage({
        type: "error",
        message: "Gagal memuat data dashboard. Silakan coba lagi.",
      });
      setError("Gagal memuat data dashboard. Silakan coba lagi nanti.");
      setTableData([]);
      setSummaryData([]);
      const emptyHistogram = [
        { range: "0-9", count: 0 },
        { range: "10-14", count: 0 },
        { range: "15-19", count: 0 },
        { range: "20-24", count: 0 },
        { range: "25+", count: 0 },
      ];
      setHistogramData(emptyHistogram);
    } finally {
      setIsLoading(false);
    }
  };

  // Tambahkan fungsi untuk memastikan data histogram dibuat dengan benar
  const generateHistogramData = (
    tableData: BaristaTableData[],
    outlets: Outlet[]
  ): HistogramData[] => {
    console.log("Generating histogram data with:", { tableData, outlets });

    const ranges = [
      { min: 0, max: 9, label: "0-9" },
      { min: 10, max: 14, label: "10-14" },
      { min: 15, max: 19, label: "15-19" },
      { min: 20, max: 24, label: "20-24" },
      { min: 25, max: Number.POSITIVE_INFINITY, label: "25+" },
    ];

    // Make sure we have valid outlets with IDs
    const validOutlets = outlets.filter(
      (outlet) =>
        outlet && outlet.outletId !== null && outlet.outletId !== undefined
    );

    const histogramData: HistogramData[] = ranges.map((range) => {
      const item: HistogramData = { range: range.label, count: 0 };

      // Add a default value for each outlet to ensure the chart renders properly
      validOutlets.forEach((outlet) => {
        if (outlet.outletId !== null && outlet.outletId !== undefined) {
          item[`outlet${outlet.outletId}`] = 0;
        }
      });

      // Now count the actual data
      if (validOutlets.length > 0 && tableData.length > 0) {
        validOutlets.forEach((outlet) => {
          if (outlet.outletId !== null && outlet.outletId !== undefined) {
            const count = tableData.filter(
              (barista) =>
                barista.outletId === outlet.outletId &&
                barista.workDays >= range.min &&
                barista.workDays <=
                  (range.max === Number.POSITIVE_INFINITY ? 999 : range.max)
            ).length;
            item[`outlet${outlet.outletId}`] = count;
            item.count = (item.count as number) + count;
          }
        });
      }

      return item;
    });

    console.log("Generated histogram data:", histogramData);
    return histogramData;
  };

  const debouncedLoadDashboardData = debounce(loadDashboardData, 500);

  // Process shift schedule data with proper date handling
  const filteredShiftScheduleData = summaryData
    .filter((summary) => {
      if (
        shiftScheduleFilter.outletId &&
        shiftScheduleFilter.outletId !== "all"
      ) {
        return (
          summary.outletId === Number.parseInt(shiftScheduleFilter.outletId)
        );
      }
      return true;
    })
    .filter((summary) => {
      if (shiftScheduleFilter.baristaName) {
        return summary.baristaName
          .toLowerCase()
          .includes(shiftScheduleFilter.baristaName.toLowerCase());
      }
      return true;
    })
    .flatMap((summary) =>
      (summary.shifts || []).map((shift) => {
        let formattedDate = "Tanggal tidak valid";
        if (
          shift.shiftDate &&
          typeof shift.shiftDate === "string" &&
          shift.shiftDate.match(/^\d{4}-\d{2}-\d{2}$/)
        ) {
          try {
            const dateObj = new Date(shift.shiftDate);
            if (isValid(dateObj)) {
              formattedDate = format(dateObj, "yyyy-MM-dd");
            } else {
              console.warn(
                `Invalid date format for shift: ${shift.shiftDate}, barista: ${summary.baristaName}`
              );
            }
          } catch (e) {
            console.error(
              `Error parsing date "${shift.shiftDate}" for barista ${summary.baristaName}:`,
              e
            );
          }
        } else {
          console.warn(
            `Missing or invalid shift date for barista ${summary.baristaName}:`,
            shift.shiftDate
          );
        }

        return {
          date: formattedDate,
          shiftType: shift.shiftType,
          outletId: summary.outletId,
          outletName: summary.outletName,
          baristaName: summary.baristaName,
        };
      })
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const resetFilters = () => {
    setConfirmTitle("Konfirmasi Reset Filter");
    setConfirmMessage("Apakah Anda yakin ingin mereset semua filter?");
    setConfirmAction(() => () => {
      setSelectedOutlets([]);
      setSearchQuery("");
      setDateRange({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      });
      setShiftScheduleFilter({
        outletId: "all",
        baristaName: "",
      });
      setToastMessage({
        type: "info",
        message: "Filter telah direset",
      });

      // Reload data after resetting filters
      setTimeout(() => loadDashboardData(), 100);
    });
    setShowConfirmModal(true);
  };

  const getShiftTypeName = (type: number) => {
    switch (type) {
      case 1:
        return "Pagi";
      case 2:
        return "Sore";
      default:
        return `Tipe ${type}`;
    }
  };

  // Fungsi untuk mengekspor data barista ke CSV
  const exportBaristaToCSV = () => {
    // Membuat header CSV
    const headers = ["Nama Barista", "Outlet", "Hari Kerja", "Lembur", "Total"];

    // Urutkan data sesuai dengan pengaturan sort saat ini
    const sortedData = [...tableData].sort((a, b) => {
      const aValue = a[sortField as keyof BaristaTableData];
      const bValue = b[sortField as keyof BaristaTableData];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    // Membuat konten CSV
    const csvContent = [
      headers.join(","),
      ...sortedData.map((barista) =>
        [
          `"${barista.baristaName.replace(/"/g, '""')}"`,
          `"${barista.outletName.replace(/"/g, '""')}"`,
          barista.workDays,
          barista.overtimeDays,
          barista.workDays + barista.overtimeDays,
        ].join(",")
      ),
    ].join("\n");

    // Membuat link download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    // Membuat nama file dengan periode
    const startDate = format(dateRange?.from || new Date(), "yyyyMMdd");
    const endDate = format(dateRange?.to || new Date(), "yyyyMMdd");
    link.setAttribute(
      "download",
      `laporan-barista-${startDate}-${endDate}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage({
      type: "success",
      message: "Data barista berhasil diekspor ke CSV",
    });
  };

  // Fungsi untuk mengekspor jadwal shift ke CSV
  const exportShiftScheduleToCSV = () => {
    // Membuat header CSV
    const headers = ["Tanggal", "Barista", "Tipe Shift", "Outlet"];

    // Membuat konten CSV
    const csvContent = [
      headers.join(","),
      ...filteredShiftScheduleData.map((shift) =>
        [
          shift.date,
          `"${shift.baristaName.replace(/"/g, '""')}"`,
          getShiftTypeName(shift.shiftType),
          `"${shift.outletName.replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    // Membuat link download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    // Membuat nama file dengan periode
    const startDate = format(dateRange?.from || new Date(), "yyyyMMdd");
    const endDate = format(dateRange?.to || new Date(), "yyyyMMdd");
    link.setAttribute("download", `jadwal-shift-${startDate}-${endDate}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage({
      type: "success",
      message: "Jadwal shift berhasil diekspor ke CSV",
    });
  };

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      debouncedLoadDashboardData();
    }
  }, [selectedOutlets, dateRange, searchQuery]);

  useEffect(() => {
    // Reset filter outlet jika outlets berubah
    if (outlets.length > 0 && selectedOutlets.length > 0) {
      // Verifikasi bahwa outlet yang dipilih ada dalam daftar
      const outletExists = outlets.some(
        (outlet) => outlet.outletId === selectedOutlets[0]
      );
      if (!outletExists) {
        setSelectedOutlets([]);
      }
    }
  }, [outlets]);

  useEffect(() => {
    console.log("Current outlets state:", outlets);
    console.log("Current selectedOutlets state:", selectedOutlets);
  }, [outlets, selectedOutlets]);

  if (error) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && tableData.length === 0) {
    return <LoadingIndicator />;
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-8">
        {toastMessage && (
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
          />
        )}

        {showConfirmModal && (
          <ConfirmModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={confirmAction}
            title={confirmTitle}
            message={confirmMessage}
          />
        )}

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-800 data-[state=active]:shadow-sm rounded-md"
            >
              Ringkasan
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-800 data-[state=active]:shadow-sm rounded-md"
            >
              Detail Barista
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-800 data-[state=active]:shadow-sm rounded-md"
            >
              Jadwal Shift
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm">
            <p className="text-slate-500">
              Periode: {format(dateRange?.from || new Date(), "dd MMM yyyy")} -{" "}
              {format(dateRange?.to || new Date(), "dd MMM yyyy")}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Filter className="mr-2 h-4 w-4" />
                Reset Filter
              </Button>
              <Button
                onClick={loadDashboardData}
                disabled={isLoading}
                className="bg-teal-600 hover:bg-teal-700 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memuat
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>

          <TabsContent value="summary" className="space-y-8">
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
                      Outlet
                    </label>
                    <Select
                      value={
                        selectedOutlets.length === 0
                          ? "all"
                          : String(selectedOutlets[0])
                      }
                      onValueChange={(value) => {
                        console.log("Outlet selection changed to:", value);
                        if (value === "all") {
                          setSelectedOutlets([]);
                        } else {
                          const id = Number.parseInt(value);
                          if (!isNaN(id)) {
                            console.log("Setting selected outlet to:", id);
                            setSelectedOutlets([id]);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="border-slate-200 bg-white hover:border-slate-300 transition-colors">
                        <SelectValue placeholder="Pilih outlet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Outlet</SelectItem>
                        {outlets.length > 0 ? (
                          outlets.map((outlet) => (
                            <SelectItem
                              key={`outlet-${outlet.outletId}`}
                              value={String(outlet.outletId)}
                            >
                              {outlet.name || `Outlet ${outlet.outletId}`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-outlets" disabled>
                            Tidak ada outlet tersedia
                          </SelectItem>
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
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-slate-200 bg-white hover:border-slate-300 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block text-slate-700">
                      Periode
                    </label>
                    <DatePickerWithRange
                      dateRange={dateRange}
                      setDateRange={(range: DateRange | undefined) => {
                        if (range?.from && range?.to) {
                          setDateRange(range);
                        }
                      }}
                    />
                  </div>
                </div>

                {selectedOutlets.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedOutlets.map((id) => {
                      const outlet = outlets.find((o) => o.outletId === id);
                      if (!outlet) return null;

                      return (
                        <Badge
                          key={`selected-outlet-${id}`}
                          variant="secondary"
                          className="flex items-center gap-1 bg-teal-100 text-teal-800 hover:bg-teal-200 transition-colors"
                        >
                          {outlet.name || `Outlet ${id}`}
                          <button
                            onClick={() =>
                              setSelectedOutlets(
                                selectedOutlets.filter((o) => o !== id)
                              )
                            }
                            className="ml-1 rounded-full hover:bg-teal-300 p-1 transition-colors"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {error ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-4">
                  <Card className="border-l-4 border-l-teal-500 shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Total Barista
                      </CardTitle>
                      <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-teal-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {metrics.totalBaristas}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        aktif dalam periode ini
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-cyan-500 shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Total Shift
                      </CardTitle>
                      <div className="h-10 w-10 rounded-full bg-cyan-50 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-cyan-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {metrics.totalShifts}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        dalam periode ini
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Total Lembur
                      </CardTitle>
                      <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {metrics.totalOvertimeDays}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        dalam periode ini
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Rata-rata Shift per Barista
                      </CardTitle>
                      <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {metrics.totalBaristas > 0
                          ? (
                              metrics.totalShifts / metrics.totalBaristas
                            ).toFixed(1)
                          : 0}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        shift per barista
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <Card className="shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-medium text-slate-800">
                            Distribusi Hari Kerja
                          </CardTitle>
                          <CardDescription>
                            Jumlah barista berdasarkan rentang hari kerja
                          </CardDescription>
                        </div>
                        <BarChart3 className="h-5 w-5 text-teal-500" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {histogramData.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg">
                          Tidak ada data distribusi hari kerja. Tambahkan data
                          shift untuk melihat distribusi.
                        </div>
                      ) : (
                        <ShiftDistributionChart
                          data={histogramData}
                          outlets={outlets.filter(
                            (outlet) =>
                              outlet &&
                              outlet.outletId !== null &&
                              outlet.outletId !== undefined
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-medium text-slate-800">
                            Highlight & Peringatan
                          </CardTitle>
                          <CardDescription>
                            Informasi penting yang perlu diperhatikan
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                      {metrics.mostActiveOutlet ? (
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-teal-50 border border-teal-200 shadow-sm">
                          <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center text-white mt-0.5 shrink-0">
                            <span className="text-sm">✓</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-teal-800 text-base">
                              Outlet Paling Aktif
                            </h4>
                            <p className="text-sm text-teal-700 mt-1.5">
                              <span className="font-semibold">
                                {metrics.mostActiveOutlet}
                              </span>{" "}
                              memiliki jumlah shift tertinggi dalam periode ini.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                          <div className="h-8 w-8 rounded-full bg-slate-400 flex items-center justify-center text-white mt-0.5 shrink-0">
                            <span className="text-sm">-</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800 text-base">
                              Outlet Paling Aktif
                            </h4>
                            <p className="text-sm text-slate-600 mt-1.5">
                              Belum ada data shift untuk menentukan outlet
                              paling aktif.
                            </p>
                          </div>
                        </div>
                      )}

                      {metrics.mostActiveBarista ? (
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-cyan-50 border border-cyan-200 shadow-sm">
                          <div className="h-8 w-8 rounded-full bg-cyan-500 flex items-center justify-center text-white mt-0.5 shrink-0">
                            <span className="text-sm">i</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-cyan-800 text-base">
                              Barista Paling Aktif
                            </h4>
                            <p className="text-sm text-cyan-700 mt-1.5">
                              <span className="font-semibold">
                                {metrics.mostActiveBarista}
                              </span>{" "}
                              memiliki jumlah hari kerja tertinggi dalam periode
                              ini.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                          <div className="h-8 w-8 rounded-full bg-slate-400 flex items-center justify-center text-white mt-0.5 shrink-0">
                            <span className="text-sm">-</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800 text-base">
                              Barista Paling Aktif
                            </h4>
                            <p className="text-sm text-slate-600 mt-1.5">
                              Belum ada data shift untuk menentukan barista
                              paling aktif.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-50 border border-amber-200 shadow-sm">
                        <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white mt-0.5 shrink-0">
                          <span className="text-sm">!</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-amber-800 text-base">
                            Rata-rata Hari Kerja
                          </h4>
                          <p className="text-sm text-amber-700 mt-1.5">
                            Rata-rata hari kerja barista adalah{" "}
                            <span className="font-semibold">
                              {metrics.averageWorkDays} hari
                            </span>{" "}
                            dalam periode ini.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
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
                      Outlet
                    </label>
                    <Select
                      value={
                        selectedOutlets.length === 0
                          ? "all"
                          : String(selectedOutlets[0])
                      }
                      onValueChange={(value) => {
                        console.log("Outlet selection changed to:", value);
                        if (value === "all") {
                          setSelectedOutlets([]);
                        } else {
                          const id = Number.parseInt(value);
                          if (!isNaN(id)) {
                            console.log("Setting selected outlet to:", id);
                            setSelectedOutlets([id]);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="border-slate-200 bg-white hover:border-slate-300 transition-colors">
                        <SelectValue placeholder="Pilih outlet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Outlet</SelectItem>
                        {outlets.length > 0 ? (
                          outlets.map((outlet) => (
                            <SelectItem
                              key={`outlet-${outlet.outletId}`}
                              value={String(outlet.outletId)}
                            >
                              {outlet.name || `Outlet ${outlet.outletId}`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-outlets" disabled>
                            Tidak ada outlet tersedia
                          </SelectItem>
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
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-slate-200 bg-white hover:border-slate-300 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block text-slate-700">
                      Periode
                    </label>
                    <DatePickerWithRange
                      dateRange={dateRange}
                      setDateRange={(range: DateRange | undefined) => {
                        if (range?.from && range?.to) {
                          setDateRange(range);
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow bg-white">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <CardTitle className="text-lg font-medium text-slate-800">
                    Detail Hari Kerja Barista
                  </CardTitle>
                  <CardDescription>
                    Daftar lengkap barista beserta jumlah hari kerja
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={exportBaristaToCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-md border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <tr>
                        <TableHead className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                          <div
                            className="flex items-center gap-1 cursor-pointer"
                            onClick={() => {
                              if (sortField === "baristaName") {
                                setSortDirection(
                                  sortDirection === "asc" ? "desc" : "asc"
                                );
                              } else {
                                setSortField("baristaName");
                                setSortDirection("asc");
                              }
                            }}
                          >
                            Nama Barista
                            {sortField === "baristaName" && (
                              <span className="ml-1">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                          <div
                            className="flex items-center gap-1 cursor-pointer"
                            onClick={() => {
                              if (sortField === "outletName") {
                                setSortDirection(
                                  sortDirection === "asc" ? "desc" : "asc"
                                );
                              } else {
                                setSortField("outletName");
                                setSortDirection("asc");
                              }
                            }}
                          >
                            Outlet
                            {sortField === "outletName" && (
                              <span className="ml-1">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                          <div
                            className="flex items-center justify-end gap-1 cursor-pointer"
                            onClick={() => {
                              if (sortField === "workDays") {
                                setSortDirection(
                                  sortDirection === "asc" ? "desc" : "asc"
                                );
                              } else {
                                setSortField("workDays");
                                setSortDirection("desc");
                              }
                            }}
                          >
                            Hari Kerja
                            {sortField === "workDays" && (
                              <span className="ml-1">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                          <div
                            className="flex items-center justify-end gap-1 cursor-pointer"
                            onClick={() => {
                              if (sortField === "overtimeDays") {
                                setSortDirection(
                                  sortDirection === "asc" ? "desc" : "asc"
                                );
                              } else {
                                setSortField("overtimeDays");
                                setSortDirection("desc");
                              }
                            }}
                          >
                            Lembur
                            {sortField === "overtimeDays" && (
                              <span className="ml-1">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                          <div className="flex items-center justify-end gap-1">
                            Total
                          </div>
                        </TableHead>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {tableData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-slate-500 bg-slate-50"
                          >
                            Tidak ada data barista. Silakan tambahkan data shift
                            terlebih dahulu.
                          </td>
                        </tr>
                      ) : (
                        tableData
                          .sort((a, b) => {
                            const aValue =
                              a[sortField as keyof BaristaTableData];
                            const bValue =
                              b[sortField as keyof BaristaTableData];

                            if (
                              typeof aValue === "string" &&
                              typeof bValue === "string"
                            ) {
                              return sortDirection === "asc"
                                ? aValue.localeCompare(bValue)
                                : bValue.localeCompare(aValue);
                            } else {
                              return sortDirection === "asc"
                                ? (aValue as number) - (bValue as number)
                                : (bValue as number) - (aValue as number);
                            }
                          })
                          .map((barista) => (
                            <tr
                              key={barista.baristaId}
                              className="cursor-pointer hover:bg-teal-50 transition-colors"
                              onClick={() => {
                                if (
                                  !barista.baristaId ||
                                  !barista.baristaName
                                ) {
                                  setToastMessage({
                                    type: "error",
                                    message:
                                      "Gagal membuka detail shift: ID atau nama barista tidak valid.",
                                  });
                                  return;
                                }
                                if (!dateRange?.from || !dateRange?.to) {
                                  setToastMessage({
                                    type: "error",
                                    message:
                                      "Gagal membuka detail shift: Rentang tanggal tidak valid.",
                                  });
                                  return;
                                }
                                setSelectedBarista(barista.baristaId);
                                setSelectedBaristaName(barista.baristaName);
                                setIsModalOpen(true);
                              }}
                            >
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {barista.baristaName}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-teal-500" />
                                  {barista.outletName}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700 font-medium">
                                {barista.workDays}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {barista.overtimeDays > 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-50 text-amber-700 border-amber-200 font-medium"
                                  >
                                    {barista.overtimeDays}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-500">0</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-slate-800">
                                {barista.workDays + barista.overtimeDays}
                              </td>
                            </tr>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between text-sm text-slate-500 border-t border-slate-100 pt-4">
                <div>
                  Menampilkan {tableData.length} dari {tableData.length} barista
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-teal-500 rounded-full"></span>
                  Klik pada baris untuk melihat detail shift
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
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
                      value={shiftScheduleFilter.outletId}
                      onValueChange={(value) =>
                        setShiftScheduleFilter({
                          ...shiftScheduleFilter,
                          outletId: value,
                        })
                      }
                    >
                      <SelectTrigger className="border-slate-200 bg-white hover:border-slate-300 transition-colors">
                        <SelectValue placeholder="Pilih outlet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Outlet</SelectItem>
                        {outlets.length > 0 ? (
                          outlets.map((outlet) => (
                            <SelectItem
                              key={`outlet-filter-${outlet.outletId}`}
                              value={String(outlet.outletId)}
                            >
                              {outlet.name || `Outlet ${outlet.outletId}`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-outlets" disabled>
                            Tidak ada outlet tersedia
                          </SelectItem>
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
                        value={shiftScheduleFilter.baristaName}
                        onChange={(e) =>
                          setShiftScheduleFilter({
                            ...shiftScheduleFilter,
                            baristaName: e.target.value,
                          })
                        }
                        className="pl-9 border-slate-200 bg-white hover:border-slate-300 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block text-slate-700">
                      Periode
                    </label>
                    <DatePickerWithRange
                      dateRange={dateRange}
                      setDateRange={(range: DateRange | undefined) => {
                        if (range?.from && range?.to) {
                          setDateRange(range);
                        }
                      }}
                    />
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
                  <CardDescription>
                    Detail jadwal shift semua barista
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={exportShiftScheduleToCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {error ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-red-500">{error}</p>
                  </div>
                ) : isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                  </div>
                ) : filteredShiftScheduleData.length === 0 ? (
                  <div className="flex justify-center items-center h-40 bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-500">
                      Tidak ada jadwal shift. Silakan tambahkan data shift
                      terlebih dahulu.
                    </p>
                  </div>
                ) : filteredShiftScheduleData.every(
                    (shift) => shift.date === "Tanggal tidak valid"
                  ) ? (
                  <div className="flex justify-center items-center h-40 bg-red-50 rounded-lg p-4">
                    <p className="text-red-500">
                      Tidak dapat menampilkan jadwal shift karena data tanggal
                      tidak valid. Silakan periksa data shift di sistem.
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredShiftScheduleData.map((shift, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-teal-50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-teal-500" />
                                <span
                                  className={`font-medium ${
                                    shift.date === "Tanggal tidak valid"
                                      ? "text-red-500"
                                      : "text-slate-800"
                                  }`}
                                >
                                  {shift.date}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-slate-700">
                              {shift.baristaName}
                            </TableCell>
                            <TableCell>
                              <div
                                className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                                  shift.shiftType === 1
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isModalOpen &&
          selectedBarista &&
          selectedBaristaName &&
          dateRange?.from &&
          dateRange?.to && (
            <ShiftHistoryModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedBarista(null);
                setSelectedBaristaName("");
              }}
              baristaId={selectedBarista}
              baristaName={selectedBaristaName}
              startDate={format(dateRange.from, "yyyy-MM-dd")}
              endDate={format(dateRange.to, "yyyy-MM-dd")}
            />
          )}
      </div>
    </div>
  );
}
