"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowDownAZ,
  Filter,
  Search,
  Grid,
  List,
  Building,
  User,
  Phone,
  Users,
  MapPin,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoadingIndicator from "@/components/LoadingIndicator";

interface UserData {
  username: string;
  name: string;
  role: string;
  phone: string;
  outlet: string;
  status: "Active" | "Revoked";
}

interface UserApiResponse {
  username?: string;
  fullName?: string;
  role?: string;
  phoneNumber?: string;
  outlet?: string;
  status?: string;
}

interface OutletStats {
  totalBaristas: number;
  activeBaristas: number;
  activePercentage: number;
}

export default function DaftarAkun() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  // State untuk filter, sort, dll.
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterRole, setFilterRole] = useState("");
  const [filterOutlet, setFilterOutlet] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [outletStats, setOutletStats] = useState<OutletStats>({
    totalBaristas: 0,
    activeBaristas: 0,
    activePercentage: 0,
  });

  useEffect(() => {
    const storedRole = localStorage.getItem("roles");
    const storedUsername = localStorage.getItem("username") || "";
    setUserRole(storedRole);
    setCurrentUsername(storedUsername);

    async function fetchUserData() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Token tidak ditemukan. Silakan login ulang.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:8080/api/account/viewall",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          alert("Gagal mengambil data user. Silakan coba lagi.");
          setIsLoading(false);
          return;
        }

        const result = await response.json();
        if (result?.data) {
          const mappedUsers: UserData[] = (
            result.data as UserApiResponse[]
          ).map((item) => ({
            username: item.username ?? "-",
            name: item.fullName ?? "-",
            role: item.role ?? "-",
            phone: item.phoneNumber ?? "-",
            outlet: item.outlet ?? "-",
            status: item.status === "Revoked" ? "Revoked" : "Active",
          }));

          setUsers(mappedUsers);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        alert("Terjadi kesalahan saat mengambil data user.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // Ambil outlet user yang login (jika ada)
  const currentUserOutlet =
    users.find((u) => u.username === currentUsername)?.outlet || "";

  // Calculate outlet statistics
  useEffect(() => {
    if (users.length > 0 && currentUserOutlet) {
      const outletUsers = users.filter(
        (user) =>
          user.outlet === currentUserOutlet &&
          (user.role.includes("Barista") || user.role.includes("Head Bar"))
      );

      const activeBaristas = outletUsers.filter(
        (user) => user.status === "Active"
      ).length;
      const totalBaristas = outletUsers.length;
      const activePercentage =
        totalBaristas > 0
          ? Math.round((activeBaristas / totalBaristas) * 100)
          : 0;

      setOutletStats({
        totalBaristas,
        activeBaristas,
        activePercentage,
      });
    }
  }, [users, currentUserOutlet]);

  // Check if user is C-level
  const isCLevel = userRole === "CLEVEL" || userRole === "HR";

  // Filter data
  const filteredUsers = users.filter((user) => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(lowerSearch) ||
      user.outlet.toLowerCase().includes(lowerSearch) ||
      user.role.toLowerCase().includes(lowerSearch) ||
      user.username.toLowerCase().includes(lowerSearch);
    const matchesRole = filterRole ? user.role === filterRole : true;
    const matchesOutlet = filterOutlet ? user.outlet === filterOutlet : true;

    // Allow Admin and C-level roles to see all accounts
    const matchesCurrentOutlet =
      userRole !== "Admin" && !isCLevel
        ? user.outlet === currentUserOutlet
        : true;

    return (
      matchesSearch && matchesRole && matchesOutlet && matchesCurrentOutlet
    );
  });

  // Sort data; prioritas diberikan pada current user agar tampil di atas
  const displayedUsers = filteredUsers.sort((a, b) => {
    if (a.username === currentUsername && b.username !== currentUsername)
      return -1;
    if (b.username === currentUsername && a.username !== currentUsername)
      return 1;
    return sortOrder === "asc"
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name);
  });

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // Check if user is HeadBar (handling both "Head Bar" and "ROLE_HeadBar" formats)
  const isHeadBar =
    userRole === "Head Bar" ||
    userRole === "HeadBar" ||
    userRole === "ROLE_HeadBar";

  // Function to get role color
  const getRoleColor = (role: string) => {
    const roleMap: Record<string, string> = {
      Admin: "bg-purple-100 text-purple-800",
      CLEVEL: "bg-blue-100 text-blue-800",
      HR: "bg-indigo-100 text-indigo-800",
      "Head Bar": "bg-amber-100 text-amber-800",
      HeadBar: "bg-amber-100 text-amber-800",
      ROLE_HeadBar: "bg-amber-100 text-amber-800",
      Barista: "bg-emerald-100 text-emerald-800",
      "Intern Barista": "bg-pink-100 text-teal-800",
      "Probation Barista": "bg-lime-100 text-lime-800",
    };

    return roleMap[role] || "bg-gray-100 text-gray-800";
  };

  // Function to get initials from name
  const getInitials = (name: string) => {
    const words = name.split(" ").filter((word) => word.length > 0);
    if (words.length === 1) {
      // If only one word, take first 2 characters
      return words[0].substring(0, 2).toUpperCase();
    } else {
      // If multiple words, take first character of first two words
      return words
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
    }
  };

  // Function to get random background color for avatar
  const getAvatarColor = (username: string) => {
    const colors = [
      "bg-primary",
      "bg-blue-500",
      "bg-green-500",
      "bg-amber-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-rose-500",
    ];

    // Simple hash function to get consistent color for same username
    const hash = username.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    return colors[hash % colors.length];
  };

  // Extract outlet address (simplified for demo)
  const getOutletAddress = (outletName: string) => {
    const addressMap: Record<string, string> = {
      "Tens Coffee Margonda": "Jl. Margonda Raya No. 123, Depok",
      "Tens Coffee Kantin Vokasi UI": "Kampus UI Depok, Jawa Barat",
      "Tens Coffee UIN Ciputat": "Jl. Ir. H. Juanda No. 95, Ciputat",
      "Tens Coffee Pamulang": "Jl. Pamulang Raya No. 45, Tangerang Selatan",
      "Tens Coffee UPN Veteran Jakarta":
        "Jl. RS Fatmawati No. 1, Jakarta Selatan",
    };

    return addressMap[outletName] || "";
  };

  // Export to CSV function
  const exportToCSV = () => {
    const headers =
      userRole === "Admin"
        ? ["Username", "Nama Lengkap", "No HP", "Role", "Outlet", "Status"]
        : ["Username", "Nama Lengkap", "Role", "Outlet", "Status"];

    const csvContent = [
      headers.join(","),
      ...displayedUsers.map((user) => {
        const row =
          userRole === "Admin"
            ? [
                user.username,
                user.name,
                user.phone,
                user.role,
                user.outlet,
                user.status,
              ]
            : [user.username, user.name, user.role, user.outlet, user.status];

        // Escape commas and quotes in data
        return row
          .map((field) => {
            if (field.includes(",") || field.includes('"')) {
              return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
          })
          .join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `daftar-akun-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF function
  const exportToPDF = () => {
    // Create a simple HTML table for PDF generation
    const headers =
      userRole === "Admin"
        ? ["Username", "Nama Lengkap", "No HP", "Role", "Outlet", "Status"]
        : ["Username", "Nama Lengkap", "Role", "Outlet", "Status"];

    const htmlContent = `
      <html>
        <head>
          <title>Daftar Akun</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .export-info { text-align: center; margin-bottom: 20px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Daftar Akun</h1>
          <div class="export-info">
            <p>Exported on: ${new Date().toLocaleDateString(
              "id-ID"
            )} | Total Records: ${displayedUsers.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map((header) => `<th>${header}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${displayedUsers
                .map((user) => {
                  const row =
                    userRole === "Admin"
                      ? [
                          user.username,
                          user.name,
                          user.phone,
                          user.role,
                          user.outlet,
                          user.status,
                        ]
                      : [
                          user.username,
                          user.name,
                          user.role,
                          user.outlet,
                          user.status,
                        ];

                  return `<tr>${row
                    .map((field) => `<td>${field}</td>`)
                    .join("")}</tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <div className="flex flex-col max-w-full px-4 md:px-6">
      <div className="flex flex-col items-center mb-6 pt-8">
        <h1 className="text-primary text-3xl font-bold mb-6">Daftar Akun</h1>
        {/* Tampilkan tombol tambah akun hanya untuk Admin */}
        {userRole === "Admin" && (
          <Link href="/account/create">
            <Button className="rounded-full shadow-md hover:shadow-lg transition-all">
              <Plus className="mr-2 h-5 w-5" />
              Tambah Akun Baru
            </Button>
          </Link>
        )}
      </div>

      {/* Barista Stats Card - Side by side layout */}
      {isHeadBar && currentUserOutlet && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Total Barista Card */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">
                    Total Barista
                  </p>
                  <h2 className="text-4xl font-bold">
                    {outletStats.totalBaristas}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {outletStats.activeBaristas} barista aktif (
                    {outletStats.activePercentage}%)
                  </p>
                </div>
                <div className="ml-auto bg-blue-100 rounded-full p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outlet Address Card */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">
                    Outlet Address
                  </p>
                  <h2 className="text-lg font-bold">{currentUserOutlet}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getOutletAddress(currentUserOutlet)}
                  </p>
                </div>
                <div className="ml-auto bg-green-100 rounded-full p-3">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name, username, role, or outlet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 shadow-sm"
            onClick={toggleSortOrder}
          >
            <ArrowDownAZ className="h-5 w-5" />
            <span className="hidden sm:inline">Sort</span>{" "}
            {sortOrder === "asc" ? "A-Z" : "Z-A"}
          </Button>

          {/* Filter Button - Different behavior for HeadBar vs Admin/C-level */}
          {isHeadBar ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 shadow-sm">
                  <Filter className="h-5 w-5" />
                  <span className="hidden sm:inline">Filter by Role</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterRole("")}>
                  All Roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("Barista")}>
                  Barista
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterRole("Trainee Barista")}
                >
                  Trainee Barista
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterRole("Probation Barista")}
                >
                  Probation Barista
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              className="gap-2 shadow-sm"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <Filter className="h-5 w-5" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          )}

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shadow-sm">
                <Download className="h-5 w-5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs defaultValue={viewMode} className="hidden md:block">
            <TabsList className="grid grid-cols-2 h-9 shadow-sm">
              <TabsTrigger
                value="table"
                onClick={() => setViewMode("table")}
                className="px-3"
              >
                <List className="h-4 w-4 mr-2" />
                Table
              </TabsTrigger>
              <TabsTrigger
                value="grid"
                onClick={() => setViewMode("grid")}
                className="px-3"
              >
                <Grid className="h-4 w-4 mr-2" />
                Grid
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon" className="shadow-sm">
                {viewMode === "table" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Grid className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewMode("table")}>
                <List className="h-4 w-4 mr-2" />
                Table View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("grid")}>
                <Grid className="h-4 w-4 mr-2" />
                Grid View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          >
            <option value="">Filter by Role</option>
            <option value="Admin">Admin</option>
            <option value="CLEVEL">CLEVEL</option>
            <option value="HR">HR</option>
            <option value="Head Bar">Head Bar</option>
            <option value="Barista">Barista</option>
            <option value="Trainee Barista">Trainee Barista</option>
            <option value="Probation Barista">Probation Barista</option>
          </select>

          {userRole !== "HeadBar" && (
            <select
              value={filterOutlet}
              onChange={(e) => setFilterOutlet(e.target.value)}
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="">Filter by Outlet</option>
              <option value="Tens Coffee Margonda">Tens Coffee Margonda</option>
              <option value="Tens Coffee Kantin Vokasi UI">
                Tens Coffee Kantin Vokasi UI
              </option>
              <option value="Tens Coffee UIN Ciputat">
                Tens Coffee UIN Ciputat
              </option>
              <option value="Tens Coffee Pamulang">Tens Coffee Pamulang</option>
              <option value="Tens Coffee UPN Veteran Jakarta">
                Tens Coffee UPN Veteran Jakarta
              </option>
            </select>
          )}
        </div>
      )}

      {isLoading ? (
        viewMode === "table" ? (
          <LoadingIndicator />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden shadow-sm">
                <div className="p-4 flex items-center gap-3 border-b">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-end">
                  <Skeleton className="h-8 w-16 rounded-md" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )
      ) : displayedUsers.length === 0 ? (
        <div className="text-center p-8 bg-muted/20 rounded-lg border border-muted shadow-inner">
          <h3 className="text-xl font-semibold mb-2">Tidak ada data</h3>
          <p className="text-muted-foreground">
            Tidak ada akun yang sesuai dengan kriteria pencarian.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead>
              <tr className="bg-gradient-to-r from-primary to-primary/90 text-white">
                <th className="py-2 px-3 text-left font-medium text-sm tracking-wider">
                  Username
                </th>
                <th className="py-2 px-3 text-left font-medium text-sm tracking-wider">
                  Nama Lengkap
                </th>
                {userRole === "Admin" && (
                  <th className="py-2 px-3 text-left font-medium text-sm tracking-wider">
                    No HP
                  </th>
                )}
                <th className="py-2 px-3 text-left font-medium text-sm tracking-wider">
                  Role
                </th>
                <th className="py-2 px-3 text-left font-medium text-sm tracking-wider">
                  Outlet
                </th>
                <th className="py-2 px-3 text-left font-medium text-sm tracking-wider">
                  Status
                </th>
                <th className="py-2 px-3 text-left font-medium text-sm tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedUsers.map((user, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 transition-colors ${
                    user.username === currentUsername ? "bg-primary-bg/30" : ""
                  }`}
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`${getAvatarColor(
                          user.username
                        )} text-white rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold flex-shrink-0`}
                        style={{ minWidth: "1.75rem", minHeight: "1.75rem" }}
                      >
                        {getInitials(user.name)}
                      </div>
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-medium">{user.name}</td>
                  {userRole === "Admin" && (
                    <td className="py-2 px-3">{user.phone}</td>
                  )}
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-2 px-3">{user.outlet}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === "Active"
                          ? "text-green-600 bg-green-100"
                          : "text-red-600 bg-red-100"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex space-x-1">
                      {/* Modified condition to include HeadBar role */}
                      {(userRole === "Admin" ||
                        user.username === currentUsername) && (
                        <>
                          <Link
                            href={
                              userRole === "Admin"
                                ? `/account/edit/${user.username}`
                                : `/account/edit-profile/${user.username}`
                            }
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-md bg-primary-lightest text-primary border-none hover:bg-primary-lightest/80"
                            >
                              Edit
                            </Button>
                          </Link>
                          <Link href={`/account/${user.username}`}>
                            <Button size="sm" className="rounded-md">
                              Detail
                            </Button>
                          </Link>
                        </>
                      )}

                      {/* Add Detail button for HeadBar users */}
                      {isHeadBar &&
                        user.username !== currentUsername &&
                        user.outlet === currentUserOutlet && (
                          <Link href={`/account/${user.username}`}>
                            <Button size="sm" className="rounded-md">
                              Detail
                            </Button>
                          </Link>
                        )}

                      {/* Add Detail button for C-level users */}
                      {isCLevel && user.username !== currentUsername && (
                        <Link href={`/account/${user.username}`}>
                          <Button size="sm" className="rounded-md">
                            Detail
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedUsers.map((user, index) => (
            <Card
              key={index}
              className="overflow-hidden hover:shadow-md transition-shadow bg-white"
            >
              <div className="p-4 flex items-center gap-3 border-b">
                <div
                  className={`${getAvatarColor(
                    user.username
                  )} text-white rounded-full h-10 w-10 flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0`}
                  style={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
                >
                  {getInitials(user.name)}
                </div>
                <div>
                  <h3 className="font-medium line-clamp-1">{user.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
                <span
                  className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.status === "Active"
                      ? "text-green-600 bg-green-100"
                      : "text-red-600 bg-red-100"
                  }`}
                >
                  {user.status}
                </span>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  <p className="text-sm line-clamp-1">{user.outlet}</p>
                </div>
                {userRole === "Admin" && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <p className="text-sm">{user.phone}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                {(userRole === "Admin" ||
                  user.username === currentUsername) && (
                  <>
                    <Link
                      href={
                        userRole === "Admin"
                          ? `/account/edit/${user.username}`
                          : `/account/edit-profile/${user.username}`
                      }
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg bg-primary-lightest text-primary border-none hover:bg-primary-lightest/80 shadow-sm"
                      >
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/account/${user.username}`}>
                      <Button size="sm" className="rounded-lg shadow-sm">
                        Detail
                      </Button>
                    </Link>
                  </>
                )}

                {/* Add Detail button for HeadBar users */}
                {isHeadBar &&
                  user.username !== currentUsername &&
                  user.outlet === currentUserOutlet && (
                    <Link href={`/account/${user.username}`}>
                      <Button size="sm" className="rounded-lg shadow-sm">
                        Detail
                      </Button>
                    </Link>
                  )}

                {/* Add Detail button for C-level users */}
                {isCLevel && user.username !== currentUsername && (
                  <Link href={`/account/${user.username}`}>
                    <Button size="sm" className="rounded-lg shadow-sm">
                      Detail
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
