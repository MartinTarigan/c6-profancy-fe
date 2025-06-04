"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle, Search, Filter } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// Fungsi untuk parse JWT
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

export default function HeadBarOvertimeApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id");

  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeLog[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<OvertimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<OvertimeLog | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOutletId, setCurrentOutletId] = useState<number | null>(null);
  const [outletName, setOutletName] = useState<string>("");
  const [, setOutlets] = useState<Outlet[]>([]);
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
        const res = await fetch(`http://localhost:8080/api/account/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch user data: ${res.status}`);
        }

        const userRes = await res.json();
        console.log("User data response:", userRes);
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
        const res = await fetch(`http://localhost:8080/api/outlets`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch outlets: ${res.status}`);
        }

        const data = await res.json();
        console.log("Outlets data response:", data);
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
          "http://localhost:8080/api/overtime-logs?status=PENDING",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching overtime logs: ${response.status}`);
        }

        const logs = await response.json();
        console.log("Fetched overtime logs:", logs);

        const statusDisplayMap: Record<OvertimeLog["status"], string> = {
          PENDING: "Menunggu Konfirmasi",
          APPROVED: "Diterima",
          REJECTED: "Ditolak",
          ONGOING: "Sedang Berlangsung",
          CANCELLED: "Dibatalkan",
        };

        const filteredLogs = logs
          .filter(
            (log: OvertimeLog) =>
              log.outletId === outletId && log.status === "PENDING"
          )
          .map((log: OvertimeLog) => ({
            ...log,
            statusDisplay: statusDisplayMap[log.status] || log.status,
          }));

        setOvertimeLogs(filteredLogs);
        setFilteredRequests(filteredLogs);

        if (requestId) {
          const selectedReq =
            filteredLogs.find(
              (log: OvertimeLog) => log.id === Number(requestId)
            ) || null;
          if (selectedReq) {
            setSelectedRequest(selectedReq);
            setIsDialogOpen(true);
            setActionType("approve");
          }
        }
      } catch (err) {
        console.error("Error fetching overtime logs:", err);
        setError("Terjadi kesalahan saat memuat data lembur.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router, requestId]);

  useEffect(() => {
    let results = overtimeLogs;

    if (searchTerm) {
      results = results.filter(
        (req) =>
          req.baristaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      results = results.filter((req) => req.status === filterStatus);
    }

    setFilteredRequests(results);
  }, [searchTerm, filterStatus, overtimeLogs]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const formatTime = (timeString: string) => {
    const parsedTime = new Date(`1970-01-01T${timeString}`);
    return parsedTime.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleApprove = async (request: OvertimeLog) => {
    setSelectedRequest(request);
    setActionType("approve");
    setIsDialogOpen(true);
  };

  const handleReject = async (request: OvertimeLog) => {
    setSelectedRequest(request);
    setActionType("reject");
    setIsDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("User tidak ditemukan atau belum login");
      }

      const jwtPayload = parseJwt(token);
      const verifier = jwtPayload?.sub || "HeadBar";

      const response = await fetch(
        `http://localhost:8080/api/overtime-logs/${selectedRequest.id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: actionType === "approve" ? "APPROVED" : "REJECTED",
            verifier: verifier,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gagal ${
            actionType === "approve" ? "menyetujui" : "menolak"
          } permohonan: ${response.status} - ${errorText}`
        );
      }

      setOvertimeLogs((prev) =>
        prev.filter((req) => req.id !== selectedRequest.id)
      );
      setFilteredRequests((prev) =>
        prev.filter((req) => req.id !== selectedRequest.id)
      );
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setActionType(null);

      alert(
        `Permohonan berhasil ${
          actionType === "approve" ? "disetujui" : "ditolak"
        }`
      );
    } catch (err) {
      console.error(`Error ${actionType}ing request:`, err);
      alert(
        err instanceof Error
          ? err.message
          : `Gagal ${
              actionType === "approve" ? "menyetujui" : "menolak"
            } permohonan. Silakan coba lagi.`
      );
    } finally {
      setIsProcessing(false);
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
              console.log("Current outlet ID:", currentOutletId);
              console.log("Pending requests:", overtimeLogs);
              alert("Check console for debug data");
            }}
          >
            Debug: Show Raw Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/jadwal/lembur/headbar">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Approval Permohonan Lembur</h1>
            {outletName && (
              <p className="text-sm text-muted-foreground">
                Outlet: {outletName}
              </p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Permohonan Lembur Menunggu Persetujuan</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama atau alasan..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada permohonan lembur yang menunggu persetujuan
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{formatDate(request.dateOvertime)}</TableCell>
                      <TableCell className="font-medium">
                        {request.baristaName}
                      </TableCell>
                      <TableCell>{formatTime(request.startHour)}</TableCell>
                      <TableCell>{formatTime(request.duration)}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-yellow-100 text-yellow-800 border-yellow-300"
                        >
                          {request.statusDisplay}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApprove(request)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Setujui
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleReject(request)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Tolak
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Setujui Permohonan"
                : "Tolak Permohonan"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Apakah Anda yakin ingin menyetujui permohonan lembur ini?"
                : "Apakah Anda yakin ingin menolak permohonan lembur ini?"}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-semibold">Nama:</div>
                <div>{selectedRequest.baristaName}</div>
                <div className="font-semibold">Tanggal:</div>
                <div>{formatDate(selectedRequest.dateOvertime)}</div>
                <div className="font-semibold">Waktu:</div>
                <div>
                  {formatTime(selectedRequest.startHour)} -{" "}
                  {formatTime(selectedRequest.duration)}
                </div>
                <div className="font-semibold">Alasan:</div>
                <div>{selectedRequest.reason}</div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={confirmAction}
              disabled={isProcessing}
            >
              {isProcessing
                ? "Memproses..."
                : actionType === "approve"
                ? "Setujui"
                : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
