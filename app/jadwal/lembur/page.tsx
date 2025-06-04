"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  AlertCircle,
  Calendar,
  Clock,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  HelpCircle,
  Filter,
  ArrowUpDown,
  Loader2,
  CalendarDays,
  User,
  TimerIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  baristaName: string;
}

interface Outlet {
  outletId: number;
  name: string;
  headBarName: string;
  headBarId: string;
}

// Map to store user sub values by userId
interface UserSubMap {
  [userId: string]: string;
}

export default function OvertimeLogList() {
  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeLog[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [userSub, setUserSub] = useState<string>("");
  const [userSubMap, setUserSubMap] = useState<UserSubMap>({});
  const [token, setToken] = useState<string>("");
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isRestrictedUser, setIsRestrictedUser] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedSort, setSelectedSort] = useState<string>("tanggal-desc");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode] = useState<"table" | "cards">("table");

  // Stats for dashboard
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);

      try {
        // Decode the JWT token to get the user information
        const tokenPayload = parseJwt(storedToken);

        // Set user roles
        const roles = tokenPayload?.roles || [];
        setUserRoles(roles);

        // Check if user is admin
        const adminCheck = roles.includes("ROLE_Admin");
        setIsAdmin(adminCheck);

        // Check if user has restricted role
        const restricted = roles.some(
          (role: string) =>
            role === "ROLE_Admin" ||
            role === "ROLE_HeadBar" ||
            role === "ROLE_CLevel"
        );
        setIsRestrictedUser(restricted);

        // Extract user information from token
        if (tokenPayload) {
          // Get user ID
          if (tokenPayload.id) {
            setUserId(tokenPayload.id);
          } else if (tokenPayload.userId) {
            setUserId(tokenPayload.userId);
          } else if (tokenPayload.sub) {
            setUserId(tokenPayload.sub);
          } else if (tokenPayload.user_id) {
            setUserId(tokenPayload.user_id);
          }

          // Get user sub (username or identifier)
          if (tokenPayload.sub) {
            setUserSub(tokenPayload.sub);

            // If we have both userId and sub, add to the map
            if (userId) {
              setUserSubMap((prev) => ({
                ...prev,
                [userId]: tokenPayload.sub,
              }));
            }
          }
        }
      } catch (err) {
        console.error("Error parsing JWT token:", err);
      }
    }
  }, [userId]);

  // Function to parse JWT token
  const parseJwt = (token: string) => {
    try {
      // Split the token and get the payload part (second part)
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
      console.error("Failed to parse JWT token:", e);
      return null;
    }
  };

  useEffect(() => {
    if (token) {
      fetchOvertimeLogs();
      fetchOutlets();
    }
  }, [token, userId]);

  const fetchOvertimeLogs = async () => {
    setLoading(true);
    try {
      if (!token) {
        console.error("Token not found");
        setLoading(false);
        return;
      }

      // Determine if we need to add query parameters for sorting or filtering
      let url =
        "http://localhost:8080/api/overtime-logs";
      const queryParams = [];

      if (selectedStatus !== "ALL") {
        queryParams.push(`status=${selectedStatus}`);
      }

      if (selectedSort) {
        queryParams.push(`sort=${selectedSort}`);
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch overtime logs");

      const data = await response.json();

      // If admin, show all logs, otherwise filter by user ID
      let logsToShow = [];
      if (isAdmin) {
        logsToShow = data;
      } else if (userId) {
        logsToShow = data.filter((log: OvertimeLog) => log.userId === userId);
      } else {
        logsToShow = data;
      }

      setOvertimeLogs(logsToShow);

      // Calculate stats
      const pendingCount = logsToShow.filter(
        (log: OvertimeLog) => log.status === "PENDING"
      ).length;
      const approvedCount = logsToShow.filter(
        (log: OvertimeLog) => log.status === "APPROVED"
      ).length;
      const rejectedCount = logsToShow.filter(
        (log: OvertimeLog) => log.status === "REJECTED"
      ).length;

      setStats({
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: logsToShow.length,
      });
    } catch (error) {
      console.error("Error fetching overtime logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutlets = async () => {
    try {
      if (!token) {
        console.error("Token not found");
        return;
      }

      const response = await fetch(
        "http://localhost:8080/api/outlets",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch outlets");

      const data = await response.json();
      setOutlets(data);
    } catch (error) {
      console.error("Error fetching outlets:", error);
    }
  };

  const getVerifierName = (log: OvertimeLog) => {
    if (log.verifier && log.verifier.trim() !== "") {
      return log.verifier;
    }

    const outlet = outlets.find((o) => o.outletId === log.outletId);
    return outlet?.headBarName || "-";
  };

  // Get user sub from user ID
  const getUserSub = (logUserId: string) => {
    // If this is the current user, return their sub
    if (logUserId === userId && userSub) {
      return userSub;
    }

    // Otherwise check if we have this user in our map
    if (userSubMap[logUserId]) {
      return userSubMap[logUserId];
    }

    // If we don't have a sub for this user, return the userId
    return logUserId;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Check if user can add overtime logs (not admin, headbar, or clevel)
  const canAddOvertimeLog = () => {
    return !userRoles.some(
      (role) =>
        role === "ROLE_Admin" ||
        role === "ROLE_HeadBar" ||
        role === "ROLE_CLevel"
    );
  };

  // Filter and Sort Logic
  let filteredLogs = overtimeLogs.filter(
    (log) =>
      log.outletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserSub(log.userId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedStatus !== "ALL") {
    filteredLogs = filteredLogs.filter((log) => log.status === selectedStatus);
  }

  // Apply tab filter
  if (activeTab === "pending") {
    filteredLogs = filteredLogs.filter((log) => log.status === "PENDING");
  } else if (activeTab === "approved") {
    filteredLogs = filteredLogs.filter((log) => log.status === "APPROVED");
  } else if (activeTab === "rejected") {
    filteredLogs = filteredLogs.filter((log) => log.status === "REJECTED");
  }

  filteredLogs.sort((a, b) => {
    if (selectedSort === "tanggal-asc") {
      return (
        new Date(a.dateOvertime).getTime() - new Date(b.dateOvertime).getTime()
      );
    } else if (selectedSort === "tanggal-desc") {
      return (
        new Date(b.dateOvertime).getTime() - new Date(a.dateOvertime).getTime()
      );
    } else if (selectedSort === "durasi-asc") {
      return (
        Number.parseInt(a.duration.split(":")[0]) -
        Number.parseInt(b.duration.split(":")[0])
      );
    } else if (selectedSort === "durasi-desc") {
      return (
        Number.parseInt(b.duration.split(":")[0]) -
        Number.parseInt(a.duration.split(":")[0])
      );
    }
    return 0;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 mr-1" />;
      case "PENDING":
        return <HelpCircle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Diterima";
      case "REJECTED":
        return "Ditolak";
      case "PENDING":
        return "Menunggu Konfirmasi";
      default:
        return status;
    }
  };

  // Format date to locale string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Format short date
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  // Get random color for avatar based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-green-100 text-green-700",
      "bg-purple-100 text-purple-700",
      "bg-amber-100 text-amber-700",
      "bg-rose-100 text-rose-700",
      "bg-cyan-100 text-cyan-700",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Render the appropriate message for empty state
  const renderEmptyState = () => {
    if (isRestrictedUser && !isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-amber-50 rounded-full p-6 mb-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            Akses Terbatas
          </h3>
          <p className="text-gray-500 text-center max-w-md mb-6">
            Anda tidak memiliki akses untuk membuat log lembur. Silakan hubungi
            administrator untuk informasi lebih lanjut.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-gray-50 rounded-full p-6 mb-4">
          <FileText className="h-12 w-12 text-gray-300" />
        </div>
        <h3 className="text-xl font-medium text-gray-800 mb-2">
          Tidak ada data
        </h3>
        <p className="text-gray-500 text-center max-w-md mb-6">
          {searchTerm
            ? "Tidak ada hasil yang cocok dengan pencarian Anda"
            : "Tidak ada data lembur ditemukan"}
        </p>
        {canAddOvertimeLog() && (
          <Link href="/jadwal/lembur/create">
            <Button className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="mr-2 h-5 w-5" />
              Tambah Log Lembur
            </Button>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {isAdmin ? "Manajemen Lembur" : "Log Lembur Saya"}
            </h1>
            <p className="text-gray-500 mt-1">
              {isAdmin
                ? "Kelola dan pantau semua log lembur karyawan"
                : "Lihat dan kelola riwayat lembur Anda"}
            </p>
          </div>

          {canAddOvertimeLog() && (
            <Link href="/jadwal/lembur/create">
              <Button className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all">
                <Plus className="mr-2 h-5 w-5" />
                Tambah Log Lembur
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-none shadow-md overflow-hidden">
          <div className="h-1 bg-blue-500"></div>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Lembur
                </p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.total}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Semua log lembur</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md overflow-hidden">
          <div className="h-1 bg-amber-500"></div>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Menunggu Konfirmasi
                </p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.pending}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Perlu persetujuan</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md overflow-hidden">
          <div className="h-1 bg-green-500"></div>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Diterima</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.approved}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Lembur disetujui</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md overflow-hidden">
          <div className="h-1 bg-red-500"></div>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ditolak</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.rejected}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Lembur tidak disetujui
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-md overflow-hidden">
        <div className="border-b border-gray-100">
          <Tabs
            defaultValue="all"
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="px-6 pt-4 flex flex-wrap items-center justify-between gap-4">
              <TabsList className="bg-gray-100">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  Semua ({stats.total})
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
                >
                  <Clock className="h-4 w-4 mr-1.5" />
                  Menunggu ({stats.pending})
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Diterima ({stats.approved})
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Ditolak ({stats.rejected})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Search and Filter Controls */}
            <div className="p-4 bg-gray-50 border-y border-gray-100">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={
                      isAdmin
                        ? "Cari berdasarkan outlet, alasan, atau pengguna..."
                        : "Cari berdasarkan outlet atau alasan..."
                    }
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 bg-white border-gray-200 h-10"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5 text-gray-500" />
                      <span className="hidden sm:inline">Urutkan</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => setSelectedSort("tanggal-desc")}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Tanggal (Terbaru)</span>
                      {selectedSort === "tanggal-desc" && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedSort("tanggal-asc")}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Tanggal (Terlama)</span>
                      {selectedSort === "tanggal-asc" && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedSort("durasi-desc")}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      <span>Durasi (Terlama)</span>
                      {selectedSort === "durasi-desc" && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedSort("durasi-asc")}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      <span>Durasi (Terpendek)</span>
                      {selectedSort === "durasi-asc" && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 bg-white border-gray-200 h-10"
                    >
                      <Filter className="h-3.5 w-3.5 text-gray-500" />
                      <span className="hidden sm:inline">Filter</span>
                      {selectedStatus !== "ALL" && (
                        <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-blue-600 text-white">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setSelectedStatus("ALL")}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Semua Status</span>
                      {selectedStatus === "ALL" && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("PENDING")}
                    >
                      <Clock className="mr-2 h-4 w-4 text-amber-500" />
                      <span>Menunggu Konfirmasi</span>
                      {selectedStatus === "PENDING" && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("APPROVED")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span>Diterima</span>
                      {selectedStatus === "APPROVED" && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("REJECTED")}
                    >
                      <XCircle className="mr-2 h-4 w-4 text-red-500" />
                      <span>Ditolak</span>
                      {selectedStatus === "REJECTED" && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Content Area */}
            <TabsContent value="all" className="p-0 m-0">
              {renderContent()}
            </TabsContent>
            <TabsContent value="pending" className="p-0 m-0">
              {renderContent()}
            </TabsContent>
            <TabsContent value="approved" className="p-0 m-0">
              {renderContent()}
            </TabsContent>
            <TabsContent value="rejected" className="p-0 m-0">
              {renderContent()}
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );

  function renderContent() {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-500">Memuat data lembur...</p>
        </div>
      );
    }

    if (filteredLogs.length === 0) {
      return renderEmptyState();
    }

    return viewMode === "table" ? renderTableView() : renderCardView();
  }

  function renderTableView() {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr
              className={`text-white ${
                activeTab === "pending"
                  ? "bg-gradient-to-r from-amber-600 to-amber-500"
                  : activeTab === "approved"
                  ? "bg-gradient-to-r from-green-600 to-green-500"
                  : activeTab === "rejected"
                  ? "bg-gradient-to-r from-red-600 to-red-500"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600"
              }`}
            >
              {isAdmin && <th className="px-4 py-3 text-left">User</th>}
              <th className="px-4 py-3 text-left">Tanggal Lembur</th>
              <th className="px-4 py-3 text-left">Jam Mulai</th>
              <th className="px-4 py-3 text-left">Outlet</th>
              <th className="px-4 py-3 text-left">Durasi</th>
              <th className="px-4 py-3 text-left">Alasan Lembur</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Verifikator</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <tr
                key={log.id}
                className={`border-b border-gray-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 transition-colors`}
              >
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <Avatar
                        className={`h-8 w-8 mr-2 ${getAvatarColor(
                          getUserSub(log.userId)
                        )}`}
                      >
                        <AvatarFallback>
                          {getInitials(getUserSub(log.userId))}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {getUserSub(log.userId)}
                      </span>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                    {formatShortDate(log.dateOvertime)}
                  </div>
                </td>
                <td className="px-4 py-3">{log.startHour.substring(0, 5)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                    {log.outletName}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 border-blue-100"
                  >
                    <TimerIcon className="h-3 w-3 mr-1" />
                    {log.duration.split(":")[0]} jam
                  </Badge>
                </td>
                <td
                  className="px-4 py-3 max-w-[200px] truncate"
                  title={log.reason}
                >
                  {log.reason}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={`${getStatusBadgeClass(
                      log.status
                    )} flex items-center`}
                  >
                    {getStatusIcon(log.status)}
                    {getStatusDisplay(log.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3">{getVerifierName(log)}</td>
                <td className="px-4 py-3 text-center">
                  <Link href={`/jadwal/lembur/${log.id}`}>
                    <Button
                      className={`${
                        activeTab === "pending"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : activeTab === "approved"
                          ? "bg-green-600 hover:bg-green-700"
                          : activeTab === "rejected"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      size="sm"
                    >
                      Detail
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderCardView() {
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLogs.map((log) => (
          <Card
            key={log.id}
            className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all"
          >
            <div
              className={`h-1.5 ${
                log.status === "PENDING"
                  ? "bg-amber-500"
                  : log.status === "APPROVED"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            ></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {isAdmin && (
                    <Avatar
                      className={`h-10 w-10 mr-3 ${getAvatarColor(
                        getUserSub(log.userId)
                      )}`}
                    >
                      <AvatarFallback>
                        {getInitials(getUserSub(log.userId))}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <CardTitle className="text-base">
                      {isAdmin ? getUserSub(log.userId) : "Log Lembur"}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(log.dateOvertime)}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={`${getStatusBadgeClass(log.status)}`}>
                  {getStatusIcon(log.status)}
                  {getStatusDisplay(log.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                    Outlet:
                  </div>
                  <span className="font-medium">{log.outletName}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Jam Mulai:
                  </div>
                  <span className="font-medium">
                    {log.startHour.substring(0, 5)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <TimerIcon className="h-3.5 w-3.5 mr-1.5" />
                    Durasi:
                  </div>
                  <span className="font-medium">
                    {log.duration.split(":")[0]} jam
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    Verifikator:
                  </div>
                  <span className="font-medium">{getVerifierName(log)}</span>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-1">Alasan:</p>
                  <p className="text-sm border-l-2 border-gray-200 pl-2 italic">
                    {log.reason}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link href={`/jadwal/lembur/${log.id}`} className="w-full">
                <Button
                  className={`w-full ${
                    log.status === "PENDING"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : log.status === "APPROVED"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Lihat Detail
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
}
