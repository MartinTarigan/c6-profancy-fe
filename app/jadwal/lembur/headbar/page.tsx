"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  Users,
  CheckSquare,
  FileBarChart,
} from "lucide-react";
import Link from "next/link";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";
import LoadingIndicator from "@/components/LoadingIndicator";

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
  outlet?: string; // Sesuai dengan struktur dari API
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT:", e);
    return null;
  }
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
          `https://rumahbaristensbe-production.up.railway.app/api/account/${userId}`,
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
          `https://rumahbaristensbe-production.up.railway.app/api/outlets`,
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
          "https://rumahbaristensbe-production.up.railway.app/api/overtime-logs",
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

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-destructive text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
          <p>{error}</p>
          <Button
            className="mt-4"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              router.refresh();
            }}
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard Lembur HeadBar</h1>
        {outletName && (
          <p className="text-sm text-muted-foreground">Outlet: {outletName}</p>
        )}
      </div>

      {overtimeLogs.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          Tidak ada data lembur untuk outlet ini. Pastikan outlet ID Anda benar
          atau hubungi administrator.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Menunggu Persetujuan</h3>
                <p className="text-4xl font-bold mt-2">{totalPending}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Permohonan lembur
                </p>
              </div>
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Disetujui</h3>
                <p className="text-4xl font-bold mt-2">{totalApproved}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Permohonan lembur
                </p>
              </div>
              <CheckSquare className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Ditolak</h3>
                <p className="text-4xl font-bold mt-2">{totalRejected}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Permohonan lembur
                </p>
              </div>
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Total Barista</h3>
                <p className="text-4xl font-bold mt-2">{totalBaristas}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Aktif bulan ini
                </p>
              </div>
              <Users className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-1">Menu Cepat</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Akses cepat ke fitur utama
            </p>
            <div className="space-y-4">
              <Link
                href="/jadwal/lembur/headbar/approval"
                className="w-full block"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                  <CheckSquare size={18} />
                  <span>Approval Permohonan Lembur</span>
                </Button>
              </Link>
              <Link
                href="/jadwal/lembur/headbar/reports"
                className="w-full block"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                  <FileBarChart size={18} />
                  <span>Lihat Laporan Lembur</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-1">Permohonan Terbaru</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Permohonan lembur yang baru diajukan
            </p>
            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada permohonan terbaru untuk outlet ini.
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{request.outletName}</p>
                        <p className="text-sm">
                          Tanggal: {formatDate(request.dateOvertime)}
                        </p>
                        <p className="text-sm">
                          Waktu: {formatTime(request.startHour)} - Durasi:{" "}
                          {formatTime(request.duration)}
                        </p>
                        <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                          {request.reason}
                        </p>
                      </div>
                      <Link
                        href={`/jadwal/lembur/headbar/approval?id=${request.id}`}
                      >
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
  );
}
