/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingIndicator from "@/components/LoadingIndicator";

import {
  Clock,
  Users,
  CheckSquare,
  FileBarChart,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Timer,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";

interface OvertimeLog {
  id: number;
  baristaId: number;
  userId: string;
  outletId: number;
  dateOvertime: string;
  startHour: string;
  duration: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ONGOING" | "CANCELLED";
  statusDisplay: string;
  verifier: string;
  outletName: string;
  baristaName: string;
  createdAt: string;
  updatedAt: string;
}

interface Outlet {
  outletId: number;
  name: string;
}

interface User {
  id: string;
  username: string;
  role: string;
  outlet?: string;
}

export default function HeadBarOvertimePage() {
  const router = useRouter();
  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setCurrentUsername] = useState<string>("");
  const [, setCurrentOutletId] = useState<number | null>(null);
  const [outletName, setOutletName] = useState<string>("");
  const [, setOutlets] = useState<Outlet[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);
  const [totalRejected, setTotalRejected] = useState(0);
  const [totalBaristas, setTotalBaristas] = useState(0);
  const [recentRequests, setRecentRequests] = useState<OvertimeLog[]>([]);
  const [, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem("username");
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        alert("User tidak ditemukan atau belum login");
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:8080/api/account/${userId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const userRes = await res.json();
        setUser(userRes.data);
        setCurrentUsername(userId);
        const outlet = userRes.data.outlet;
        if (outlet) {
          fetchAllOutlets(token, outlet);
        } else {
          console.log("❌ Outlet not found for the user");
          setError("Outlet tidak ditemukan untuk user ini.");
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.log("❌ Gagal fetch user data:", err);
        setError("Gagal memuat data user.");
        setIsLoading(false);
      }
    };

    const fetchAllOutlets = async (token: string, userOutletName: string) => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/outlets`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setOutlets(data);

        const matchedOutlet = data.find(
          (o: Outlet) => o.name === userOutletName
        );
        if (matchedOutlet) {
          setOutletName(matchedOutlet.name);
          setCurrentOutletId(matchedOutlet.outletId);
          fetchOvertimeLogs(token, matchedOutlet.outletId);
        } else {
          console.log("❌ Outlet terkait dengan pengguna tidak ditemukan");
          setError("Outlet terkait dengan pengguna tidak ditemukan.");
          setIsLoading(false);
        }
      } catch (err) {
        console.log("❌ Gagal fetch all outlets:", err);
        setError("Gagal memuat data outlet.");
        setIsLoading(false);
      }
    };

    const fetchOvertimeLogs = async (token: string, outletId: number) => {
      try {
        const response = await fetch(
          "http://localhost:8080/api/overtime-logs",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          alert("Gagal mengambil data lembur. Silakan coba lagi.");
          setError(`Error fetching overtime logs: ${response.status}`);
          setIsLoading(false);
          return;
        }

        const logs = await response.json();
        console.log("Fetched logs:", logs);

        const statusDisplayMap: Record<OvertimeLog["status"], string> = {
          PENDING: "Menunggu Konfirmasi",
          APPROVED: "Diterima",
          REJECTED: "Ditolak",
          ONGOING: "Sedang Berlangsung",
          CANCELLED: "Dibatalkan",
        };

        const filteredLogs = logs
          .filter((log: OvertimeLog) => log.outletId === outletId)
          .map((log: OvertimeLog) => ({
            ...log,
            statusDisplay: statusDisplayMap[log.status] || log.status,
          }));

        setOvertimeLogs(filteredLogs);

        let pendingCount = 0;
        let approvedCount = 0;
        let rejectedCount = 0;

        filteredLogs.forEach((log: OvertimeLog) => {
          if (log.status === "PENDING") pendingCount++;
          else if (log.status === "APPROVED") approvedCount++;
          else if (log.status === "REJECTED") rejectedCount++;
        });

        setTotalPending(pendingCount);
        setTotalApproved(approvedCount);
        setTotalRejected(rejectedCount);

        const pendingLogs = filteredLogs
          .filter((log: OvertimeLog) => log.status === "PENDING")
          .sort(
            (a: OvertimeLog, b: OvertimeLog) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        setRecentRequests(pendingLogs);

        const uniqueBaristas = new Set(
          filteredLogs.map((log: OvertimeLog) => log.baristaId)
        );
        setTotalBaristas(uniqueBaristas.size);
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("Terjadi kesalahan saat mengambil data lembur.");
        setError("Terjadi kesalahan saat memuat data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: id });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const parsedTime = parse(timeString, "HH:mm:ss", new Date());
      return format(parsedTime, "HH:mm");
    } catch {
      return timeString;
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Rejected
          </Badge>
        );
      case "ONGOING":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Ongoing
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-red-700">
              Error Loading Data
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                router.refresh();
              }}
            >
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Lembur</h1>
          <p className="text-gray-500">Kelola permohonan lembur barista</p>
          {outletName && (
            <p className="text-sm text-gray-400 mt-1">Outlet: {outletName}</p>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-white border-gray-200 text-gray-700 flex items-center gap-1"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date().toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Menunggu Persetujuan
                </p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {totalPending}
                </h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-amber-500" />
                  Permohonan lembur
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Disetujui
                </p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {totalApproved}
                </h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                  Permohonan lembur
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Ditolak
                </p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {totalRejected}
                </h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <XCircle className="h-3 w-3 mr-1 text-red-500" />
                  Permohonan lembur
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-violet-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Barista
                </p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {totalBaristas}
                </h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Users className="h-3 w-3 mr-1 text-violet-500" />
                  Aktif bulan ini
                </p>
              </div>
              <div className="bg-violet-100 p-3 rounded-full">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Menu */}
        <Card className="border-t-4 border-t-sky-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">Menu Cepat</CardTitle>
            <CardDescription>Akses cepat ke fitur utama</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid gap-4">
              <Link
                href="/jadwal/lembur/headbar/approval"
                className="w-full block"
              >
                <Button className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 flex items-center justify-center gap-2 shadow-sm">
                  <CheckSquare size={18} />
                  <span>Approval Permohonan Lembur</span>
                </Button>
              </Link>

              <Link
                href="/jadwal/lembur/headbar/reports"
                className="w-full block"
              >
                <Button className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 flex items-center justify-center gap-2 shadow-sm">
                  <FileBarChart size={18} />
                  <span>Lihat Laporan Lembur</span>
                </Button>
              </Link>

              <div className="bg-sky-50 border border-sky-100 rounded-lg p-4 mt-2">
                <div className="flex items-start gap-3">
                  <div className="bg-sky-100 p-2 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sky-800">Tips Approval</h4>
                    <p className="text-sm text-sky-700">
                      Periksa jadwal kerja dan kebutuhan operasional sebelum
                      menyetujui permohonan lembur untuk memastikan efisiensi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">
              Permohonan Terbaru
            </CardTitle>
            <CardDescription>
              Permohonan lembur yang baru diajukan
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {recentRequests.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Timer className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">
                  Tidak ada permohonan terbaru
                </p>
                <p className="text-sm text-gray-400">
                  Semua permohonan sudah ditinjau
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-800">
                            {request.baristaName || request.outletName}
                          </p>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(request.dateOvertime)}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Timer className="h-3.5 w-3.5" />
                          Waktu: {formatTime(request.startHour)} - Durasi:{" "}
                          {formatTime(request.duration)}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-[250px] mt-1">
                          {request.reason}
                        </p>
                      </div>
                      <Link
                        href={`/jadwal/lembur/headbar/approval?id=${request.id}`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                        >
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
  );
}
