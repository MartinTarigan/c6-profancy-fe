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
import {
  FileText,
  Clock,
  Users,
  CheckSquare,
  FileBarChart,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import LoadingIndicator from "@/components/LoadingIndicator";

interface LeaveRequest {
  id: string;
  userName: string;
  requestDate: string;
  leaveType: "OFF_DAY" | "IZIN";
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  createdAt: string;
  updatedAt: string;
  idOutlet: number;
}

// JWT parser function
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

export default function HeadBarLeaveRequestPage() {
  const router = useRouter();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentOutletId, setCurrentOutletId] = useState<number | null>(null);

  // Stats
  const [totalIzin, setTotalIzin] = useState(0);
  const [totalCuti, setTotalCuti] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [totalBaristas, setTotalBaristas] = useState(0);
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);

  // First, get the current user info from JWT
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token, redirecting to login");
      router.push("/login");
      return;
    }

    // Parse JWT to get username and other info
    const jwtPayload = parseJwt(token);
    if (!jwtPayload || !jwtPayload.sub) {
      console.log("Invalid JWT, redirecting to login");
      router.push("/login");
      return;
    }

    setCurrentUsername(jwtPayload.sub);

    // Get outlet ID from JWT if available
    if (jwtPayload.outletId) {
      setCurrentOutletId(Number.parseInt(jwtPayload.outletId));
      console.log("Found outlet ID from JWT:", jwtPayload.outletId);
    } else {
      // If not in JWT, try to get from localStorage
      const storedOutletId = localStorage.getItem("outletId");
      if (storedOutletId) {
        setCurrentOutletId(Number.parseInt(storedOutletId));
        console.log("Found outlet ID from localStorage:", storedOutletId);
      }
    }
  }, [router]);

  // Fetch ALL leave requests and filter by outlet
  useEffect(() => {
    const username = localStorage.getItem("username");
    const fetchAllLeaveRequests = async () => {
      if (!currentUsername) return; // Don't proceed if username is not available

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        setIsLoading(true);

        // Fetch ALL leave requests
        const response = await fetch(
          `http://localhost:8080/api/shift-management/leave-request/all?username=${username}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.clear();
            router.push("/login");
            return;
          }
          throw new Error(`Error fetching leave requests: ${response.status}`);
        }

        const data = await response.json();
        console.log("Raw API response:", data);

        const requests = data.data || [];

        // First, find the headbar's outlet ID if we don't have it yet
        if (!currentOutletId && requests.length > 0) {
          // Try to find a request from the current user to get their outlet ID
          const userRequest = requests.find(
            (req: LeaveRequest) => req.userName === currentUsername
          );
          if (userRequest && userRequest.idOutlet) {
            setCurrentOutletId(userRequest.idOutlet);
            console.log("Found outlet ID:", userRequest.idOutlet);
          }
        }

        // Filter requests by outlet ID
        let filteredRequests = requests;
        if (currentOutletId) {
          filteredRequests = requests.filter(
            (req: LeaveRequest) => req.idOutlet === currentOutletId
          );
          console.log(
            `Filtered to ${filteredRequests.length} requests for outlet ID ${currentOutletId}`
          );
        }

        setLeaveRequests(filteredRequests);

        // Calculate stats
        let izinCount = 0;
        let cutiCount = 0;
        let pendingCount = 0;

        filteredRequests.forEach((request: LeaveRequest) => {
          if (request.leaveType === "IZIN") {
            izinCount++;
          } else if (request.leaveType === "OFF_DAY") {
            cutiCount++;
          }

          if (request.status === "PENDING") {
            pendingCount++;
          }
        });

        setTotalIzin(izinCount);
        setTotalCuti(cutiCount);
        setPendingRequests(pendingCount);

        // Get recent pending requests (last 5)
        const pendingReqs = filteredRequests
          .filter((req: LeaveRequest) => req.status === "PENDING")
          .sort(
            (a: LeaveRequest, b: LeaveRequest) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        setRecentRequests(pendingReqs);

        // Count unique baristas in this outlet
        const uniqueBaristas = new Set(
          filteredRequests.map((req: LeaveRequest) => req.userName)
        );
        setTotalBaristas(uniqueBaristas.size);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllLeaveRequests();
  }, [currentUsername, currentOutletId, router]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
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
      case "CANCELED":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Canceled
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
                console.log("Current outlet ID:", currentOutletId);
                console.log("Filtered leave requests:", leaveRequests);
                alert("Check console for debug data");
              }}
            >
              Debug: Show Raw Data
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
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard Izin & Cuti
          </h1>
          <p className="text-gray-500">
            Kelola permohonan izin dan cuti barista
          </p>
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
        <Card className="overflow-hidden border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Izin
                </p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {totalIzin}
                </h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                  Permohonan izin
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-sky-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Cuti
                </p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {totalCuti}
                </h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-sky-500" />
                  Permohonan cuti
                </p>
              </div>
              <div className="bg-sky-100 p-3 rounded-full">
                <Calendar className="h-5 w-5 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Menunggu Approval
                </p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {pendingRequests}
                </h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-amber-500" />
                  Perlu ditinjau
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock className="h-5 w-5 text-amber-600" />
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
                href="/jadwal/izin-cuti/headbar/approval"
                className="w-full block"
              >
                <Button className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 flex items-center justify-center gap-2 shadow-sm">
                  <CheckSquare size={18} />
                  <span>Approval Permohonan</span>
                </Button>
              </Link>

              <Link
                href="/jadwal/izin-cuti/headbar/reports"
                className="w-full block"
              >
                <Button className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 flex items-center justify-center gap-2 shadow-sm">
                  <FileBarChart size={18} />
                  <span>Lihat Laporan Izin/Cuti</span>
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
                      Tinjau alasan izin/cuti dengan teliti dan pastikan
                      ketersediaan barista pengganti sebelum menyetujui.
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
            <CardDescription>Permohonan yang baru diajukan</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {recentRequests.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
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
                            {request.userName}
                          </p>
                          <Badge
                            variant="outline"
                            className={`
                            ${
                              request.leaveType === "IZIN"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-sky-50 text-sky-700 border-sky-200"
                            }
                          `}
                          >
                            {request.leaveType === "IZIN" ? "Izin" : "Cuti"}
                          </Badge>
                        </div>
                        <p className="text-sm flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(request.requestDate)}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-[250px] mt-1">
                          {request.reason}
                        </p>
                      </div>
                      <Link
                        href={`/jadwal/izin-cuti/headbar/approval?id=${request.id}`}
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
