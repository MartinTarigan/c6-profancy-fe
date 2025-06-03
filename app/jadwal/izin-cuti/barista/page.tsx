"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  HelpCircle,
  Filter,
  ArrowUpDown,
  Loader2,
  CalendarDays,
  Eye,
  PencilIcon,
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
}

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

export default function BaristaLeaveRequestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
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
    canceled: 0,
    total: 0,
    izin: 0,
    cuti: 0,
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch leave requests for the current user
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        console.log("Checking auth...");
        const token = localStorage.getItem("token");

        if (!token) {
          console.log("No token, redirecting to login");
          router.push("/login");
          return;
        }

        // Parse JWT to get username
        const jwtPayload = parseJwt(token);
        let currentUsername = "";

        if (jwtPayload && jwtPayload.sub) {
          currentUsername = jwtPayload.sub;
        } else {
          console.log("No username in JWT, redirecting to login");
          router.push("/login");
          return;
        }

        setIsLoading(true);

        // Fetch user's leave requests using username
        const response = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/shift-management/leave-request/user/username/${currentUsername}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching leave requests: ${response.status}`);
        }

        const result = await response.json();
        const requests = result.data || [];

        setAllRequests(requests);

        // Calculate stats
        const pendingCount = requests.filter(
          (req: LeaveRequest) => req.status === "PENDING"
        ).length;
        const approvedCount = requests.filter(
          (req: LeaveRequest) => req.status === "APPROVED"
        ).length;
        const rejectedCount = requests.filter(
          (req: LeaveRequest) => req.status === "REJECTED"
        ).length;
        const canceledCount = requests.filter(
          (req: LeaveRequest) => req.status === "CANCELED"
        ).length;
        const izinCount = requests.filter(
          (req: LeaveRequest) => req.leaveType === "IZIN"
        ).length;
        const cutiCount = requests.filter(
          (req: LeaveRequest) => req.leaveType === "OFF_DAY"
        ).length;

        setStats({
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          canceled: canceledCount,
          total: requests.length,
          izin: izinCount,
          cuti: cutiCount,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching leave requests:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [router]);

  // Format date for display
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

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "CANCELED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 mr-1" />;
      case "PENDING":
        return <HelpCircle className="h-4 w-4 mr-1" />;
      case "CANCELED":
        return <XCircle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  // Get status display text
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Disetujui";
      case "REJECTED":
        return "Ditolak";
      case "PENDING":
        return "Menunggu Konfirmasi";
      case "CANCELED":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  // Get leave type display
  const getLeaveTypeDisplay = (type: string) => {
    return type === "IZIN" ? "Izin" : "Cuti";
  };

  // Get leave type badge class
  const getLeaveTypeBadgeClass = (type: string) => {
    return type === "IZIN"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter and Sort Logic
  let filteredRequests = allRequests.filter(
    (request) =>
      request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getLeaveTypeDisplay(request.leaveType)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedStatus !== "ALL") {
    filteredRequests = filteredRequests.filter(
      (request) => request.status === selectedStatus
    );
  }

  // Apply tab filter
  if (activeTab === "pending") {
    filteredRequests = filteredRequests.filter(
      (request) => request.status === "PENDING"
    );
  } else if (activeTab === "approved") {
    filteredRequests = filteredRequests.filter(
      (request) => request.status === "APPROVED"
    );
  } else if (activeTab === "rejected") {
    filteredRequests = filteredRequests.filter(
      (request) => request.status === "REJECTED"
    );
  } else if (activeTab === "canceled") {
    filteredRequests = filteredRequests.filter(
      (request) => request.status === "CANCELED"
    );
  }

  // Sort requests
  filteredRequests.sort((a, b) => {
    if (selectedSort === "tanggal-asc") {
      return (
        new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()
      );
    } else if (selectedSort === "tanggal-desc") {
      return (
        new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
      );
    } else if (selectedSort === "created-asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (selectedSort === "created-desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  // Render empty state
  const renderEmptyState = () => {
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
            : "Tidak ada permohonan izin/cuti ditemukan"}
        </p>
        <Link href="/jadwal/izin-cuti/create">
          <Button className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="mr-2 h-5 w-5" />
            Ajukan Permohonan Baru
          </Button>
        </Link>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex justify-center items-center">
        <div className="text-center">
          <div className="bg-red-50 rounded-full p-6 mb-4 inline-block">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800">
            Error Loading Data
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `https://rumahbaristensbe-production.up.railway.app/api/shift-management/leave-request/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error deleting leave request: ${response.status}`);
      }

      setAllRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== id)
      );

      // Recalculate stats after deletion
      const updatedRequests = allRequests.filter(
        (request) => request.id !== id
      );
      const pendingCount = updatedRequests.filter(
        (req: LeaveRequest) => req.status === "PENDING"
      ).length;
      const approvedCount = updatedRequests.filter(
        (req: LeaveRequest) => req.status === "APPROVED"
      ).length;
      const rejectedCount = updatedRequests.filter(
        (req: LeaveRequest) => req.status === "REJECTED"
      ).length;
      const canceledCount = updatedRequests.filter(
        (req: LeaveRequest) => req.status === "CANCELED"
      ).length;
      const izinCount = updatedRequests.filter(
        (req: LeaveRequest) => req.leaveType === "IZIN"
      ).length;
      const cutiCount = updatedRequests.filter(
        (req: LeaveRequest) => req.leaveType === "OFF_DAY"
      ).length;

      setStats({
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        canceled: canceledCount,
        total: updatedRequests.length,
        izin: izinCount,
        cuti: cutiCount,
      });

      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error deleting leave request:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Gagal menghapus permohonan. Silakan coba lagi."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Manajemen Izin & Cuti
            </h1>
            <p className="text-gray-500 mt-1">
              Kelola dan pantau permohonan izin dan cuti Anda
            </p>
          </div>

          <Link href="/jadwal/izin-cuti/create">
            <Button className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all">
              <Plus className="mr-2 h-5 w-5" />
              Ajukan Permohonan Baru
            </Button>
          </Link>
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
                  Total Permohonan
                </p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.total}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Semua permohonan</p>
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
                <p className="text-sm font-medium text-gray-500">Disetujui</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.approved}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Permohonan disetujui
                </p>
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
                <p className="text-xs text-gray-400 mt-1">Permohonan ditolak</p>
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
                  Disetujui ({stats.approved})
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
                    placeholder="Cari berdasarkan alasan, jenis, atau nama..."
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
                      <span>Tanggal Permohonan (Terbaru)</span>
                      {selectedSort === "tanggal-desc" && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedSort("tanggal-asc")}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Tanggal Permohonan (Terlama)</span>
                      {selectedSort === "tanggal-asc" && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedSort("created-desc")}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      <span>Dibuat (Terbaru)</span>
                      {selectedSort === "created-desc" && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedSort("created-asc")}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      <span>Dibuat (Terlama)</span>
                      {selectedSort === "created-asc" && (
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
                      <span>Disetujui</span>
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
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-500">Memuat data permohonan...</p>
        </div>
      );
    }

    if (filteredRequests.length === 0) {
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
              <th className="px-4 py-3 text-left">Tanggal Permohonan</th>
              <th className="px-4 py-3 text-left">Jenis</th>
              <th className="px-4 py-3 text-left">Alasan</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Dibuat</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request, index) => (
              <tr
                key={request.id}
                className={`border-b border-gray-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 transition-colors`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                    {formatShortDate(request.requestDate)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={getLeaveTypeBadgeClass(request.leaveType)}
                  >
                    {getLeaveTypeDisplay(request.leaveType)}
                  </Badge>
                </td>
                <td
                  className="px-4 py-3 max-w-[200px] truncate"
                  title={request.reason}
                >
                  {request.reason}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={`${getStatusBadgeClass(
                      request.status
                    )} flex items-center`}
                  >
                    {getStatusIcon(request.status)}
                    {getStatusDisplay(request.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatShortDate(request.createdAt)}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    {request.status === "PENDING" && (
                      <>
                        <Link href={`/jadwal/izin-cuti/edit/${request.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700 border-green-600"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </Link>
                      </>
                    )}
                    {request.status !== "PENDING" && (
                      <Link href={`/jadwal/izin-cuti/edit/${request.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                          title="Lihat"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={isDialogOpen && deleteId !== null}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setDeleteId(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus permohonan ini? Tindakan ini
                tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteId && handleDelete(deleteId)}
              >
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  function renderCardView() {
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.map((request) => (
          <Card
            key={request.id}
            className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all"
          >
            <div
              className={`h-1.5 ${
                request.status === "PENDING"
                  ? "bg-amber-500"
                  : request.status === "APPROVED"
                  ? "bg-green-500"
                  : request.status === "REJECTED"
                  ? "bg-red-500"
                  : "bg-gray-500"
              }`}
            ></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">
                    Permohonan {getLeaveTypeDisplay(request.leaveType)}
                  </CardTitle>
                  <CardDescription>
                    {formatDate(request.requestDate)}
                  </CardDescription>
                </div>
                <Badge className={`${getStatusBadgeClass(request.status)}`}>
                  {getStatusIcon(request.status)}
                  {getStatusDisplay(request.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Jenis:
                  </div>
                  <Badge
                    variant="outline"
                    className={getLeaveTypeBadgeClass(request.leaveType)}
                  >
                    {getLeaveTypeDisplay(request.leaveType)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    Dibuat:
                  </div>
                  <span className="font-medium">
                    {formatShortDate(request.createdAt)}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-1">Alasan:</p>
                  <p className="text-sm border-l-2 border-gray-200 pl-2 italic">
                    {request.reason}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link
                href={`/jadwal/izin-cuti/edit/${request.id}`}
                className="w-full"
              >
                <Button
                  className={`w-full ${
                    request.status === "PENDING"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {request.status === "PENDING" ? "Edit" : "Lihat"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
}
