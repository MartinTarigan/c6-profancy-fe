/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download } from "lucide-react";
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
  outlet?: string;
}

export default function HeadBarOvertimeReportsPage() {
  const router = useRouter();
  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOutletId, setCurrentOutletId] = useState<number | null>(null);
  const [outletName, setOutletName] = useState<string>("");
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [user, setUser] = useState<User | null>(null);

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
        const outlet = userRes.data.outlet;
        if (outlet) {
          fetchAllOutlets(token, outlet);
        } else {
          console.log("❌ Outlet not found for the user");
          setError("Outlet tidak ditemukan untuk user ini.");
          setIsLoading(false);
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
          }))
          .sort(
            (a: OvertimeLog, b: OvertimeLog) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setOvertimeLogs(filteredLogs);
      } catch (err) {
        console.error("Error fetching data:", err);
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

  const handleDownloadReport = () => {
    const csvContent = [
      [
        "ID",
        "Outlet",
        "Barista",
        "Tanggal",
        "Waktu",
        "Durasi",
        "Alasan",
        "Status",
        "Verifier",
        "Diajukan",
        "Diperbarui",
      ],
      ...overtimeLogs.map((log) => [
        log.id,
        log.outletName,
        log.baristaName,
        formatDate(log.dateOvertime),
        formatTime(log.startHour),
        formatTime(log.duration),
        log.reason,
        log.statusDisplay,
        log.verifier,
        formatDate(log.createdAt),
        formatDate(log.updatedAt),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `overtime-report-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/jadwal/lembur/headbar")}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Laporan Lembur HeadBar</h1>
          {outletName && (
            <p className="text-sm text-muted-foreground">
              Outlet: {outletName}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <Button
          onClick={handleDownloadReport}
          className="flex items-center gap-2"
        >
          <Download size={16} />
          Unduh Laporan (CSV)
        </Button>
      </div>

      {overtimeLogs.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          Tidak ada data lembur untuk outlet ini.
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-4">Outlet</th>
                    <th className="p-4">Barista</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Waktu</th>
                    <th className="p-4">Durasi</th>
                    <th className="p-4">Alasan</th>
                    <th className="p-4">Status</th>
                    {/* <th className="p-4">Verifier</th> */}
                    <th className="p-4">Diajukan</th>
                  </tr>
                </thead>
                <tbody>
                  {overtimeLogs.map((log) => (
                    <tr key={log.id} className="border-b">
                      <td className="p-4">{log.outletName}</td>
                      <td className="p-4">{log.baristaName}</td>
                      <td className="p-4">{formatDate(log.dateOvertime)}</td>
                      <td className="p-4">{formatTime(log.startHour)}</td>
                      <td className="p-4">{formatTime(log.duration)}</td>
                      <td className="p-4">{log.reason}</td>
                      <td className="p-4">{log.statusDisplay}</td>
                      {/* <td className="p-4">{log.verifier}</td> */}
                      <td className="p-4">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
