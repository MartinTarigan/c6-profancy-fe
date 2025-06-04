"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileText,
  LinkIcon,
  Users,
  Calendar,
  Search,
  ExternalLink,
  Eye,
  Pencil,
  Trash2,
  BookOpen,
  Filter,
  ArrowUpDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import Toast from "@/components/Toast";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TrainingMaterial {
  id: number;
  title: string;
  type: string;
  link: string;
  description: string;
  assignedRoles: string[];
  createdAt: string;
}

export default function ManajemenMateriPelatihan() {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "az" | "za">(
    "newest"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    const storedRoles = localStorage.getItem("roles") ?? "";
    setUserRole(storedRoles);

    const fetchMaterials = async () => {
      if (
        !storedToken ||
        !["Admin", "ProbationBarista"].includes(storedRoles)
      ) {
        setMaterials([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        if (storedToken) {
          const response = await fetch(
            "http://localhost:8080/api/training-materials",
            {
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `Error fetching training materials: ${response.status}`
            );
          }

          const result = await response.json();
          setMaterials(result.data);
        } else {
          setMaterials([
            {
              id: 1,
              title: "Introduction to Espresso Making",
              type: "VIDEO",
              link: "https://youtu.be/j-Hu4hF5PTM?si=5iZ4D_TCW2mN-DQt",
              description:
                "Pelatihan dasar dalam pembuatan espresso untuk probation barista.",
              assignedRoles: ["PROBATION_BARISTA", "TRAINEE_BARISTA"],
              createdAt: "2025-03-20T05:20:39.999+00:00",
            },
            {
              id: 2,
              title: "Latte Art Basics",
              type: "VIDEO",
              link: "https://youtu.be/example",
              description: "Teknik dasar membuat latte art untuk barista.",
              assignedRoles: ["BARISTA", "HEAD_BARISTA"],
              createdAt: "2025-03-19T08:15:22.123+00:00",
            },
            {
              id: 3,
              title: "Coffee Bean Selection Guide",
              type: "DOCUMENT",
              link: "https://docs.example.com/coffee-beans",
              description: "Panduan pemilihan biji kopi berkualitas.",
              assignedRoles: ["HEAD_BARISTA", "MANAGER"],
              createdAt: "2025-03-18T14:30:10.456+00:00",
            },
            {
              id: 4,
              title: "Brewing Methods Comparison",
              type: "DOCUMENT",
              link: "https://docs.example.com/brewing-methods",
              description: "Perbandingan berbagai metode brewing kopi.",
              assignedRoles: [
                "TRAINEE_BARISTA",
                "PROBATION_BARISTA",
                "BARISTA",
                "HEAD_BARISTA",
              ],
              createdAt: "2025-03-17T11:45:33.789+00:00",
            },
          ]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching training materials:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("id-ID", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleDelete = async (id: number) => {
    if (!token) {
      setToast({
        type: "error",
        message: "Token tidak ditemukan. Silakan login ulang.",
      });
      return;
    }
    if (!confirm("Yakin ingin menghapus materi ini?")) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/training-materials/${id}/delete`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      if (res.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== id));
        setToast({ type: "success", message: "Materi berhasil dihapus" });
      } else {
        setToast({
          type: "error",
          message: result.message || "Gagal menghapus materi",
        });
      }
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        message: "Terjadi kesalahan saat menghapus materi",
      });
    }
  };

  // Get all unique roles for filtering
  const uniqueRoles = Array.from(
    new Set(materials.flatMap((m) => m.assignedRoles))
  ).sort();

  // Filter and sort materials
  const filteredAndSortedMaterials = materials
    .filter((material) => {
      const matchesSearch =
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole
        ? material.assignedRoles.includes(filterRole)
        : true;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "az":
          return a.title.localeCompare(b.title);
        case "za":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  // Format role name for display
  const formatRoleName = (role: string) => {
    return role
      .replace("_", " ")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Get material icon based on link
  const getMaterialIcon = (link: string) => {
    if (
      link.includes("youtube") ||
      link.includes("youtu.be") ||
      link.includes("vimeo")
    ) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (
      link.includes("docs") ||
      link.includes("pdf") ||
      link.includes(".doc")
    ) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    } else {
      return <LinkIcon className="h-5 w-5 text-purple-500" />;
    }
  };

  // Get material type based on link
  const getMaterialType = (link: string) => {
    if (
      link.includes("youtube") ||
      link.includes("youtu.be") ||
      link.includes("vimeo")
    ) {
      return "Video";
    } else if (
      link.includes("docs") ||
      link.includes("pdf") ||
      link.includes(".doc")
    ) {
      return "Document";
    } else {
      return "Link";
    }
  };

  // Get color for material type
  const getMaterialTypeColor = (link: string) => {
    const type = getMaterialType(link);
    switch (type) {
      case "Video":
        return "bg-red-100 text-red-700 border-red-200";
      case "Document":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-purple-100 text-purple-700 border-purple-200";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 flex justify-center items-center">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="bg-red-50 text-red-800 rounded-t-lg">
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Data
            </CardTitle>
            <CardDescription className="text-red-700">
              We could not load your training materials
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-700">{error}</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header with animated gradient */}
        <div className="relative overflow-hidden rounded-xl bg-white shadow-md mb-8">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(79,70,229,0.15),transparent_50%)]"></div>

          <div className="relative px-6 py-8 md:px-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Manajemen Materi Pelatihan
              </h1>
              <p className="text-slate-500 mt-2 max-w-2xl">
                Kelola dan akses materi pelatihan untuk meningkatkan
                keterampilan barista
              </p>
            </div>

            {userRole === "Admin" && (
              <Link href="/training-materials/create">
                <Button
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Tambah Materi Pelatihan
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-none shadow-md bg-white overflow-hidden">
            <div className="h-1 bg-blue-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Materi
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">
                    {materials.length}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Semua materi pelatihan
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white overflow-hidden">
            <div className="h-1 bg-purple-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Video & Dokumen
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">
                    {
                      materials.filter(
                        (m) => m.type === "VIDEO" || m.type === "DOCUMENT"
                      ).length
                    }
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Materi multimedia
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white overflow-hidden">
            <div className="h-1 bg-green-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Peran Terkait
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">
                    {uniqueRoles.length}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Peran dengan akses
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="border-b border-slate-100">
            <Tabs defaultValue="all" className="w-full">
              <div className="px-6 pt-4 flex flex-wrap items-center justify-between gap-4">
                <TabsList className="bg-slate-100">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <BookOpen className="h-4 w-4 mr-1.5" />
                    Semua Materi
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-9 px-3"
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-9 px-3"
                  >
                    <BookOpen className="h-4 w-4 mr-1.5" />
                    List
                  </Button>
                </div>
              </div>

              {/* Search and Filter Controls */}
              <div className="p-4 bg-slate-50 border-y border-slate-100">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Cari materi pelatihan..."
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Sort Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 bg-white border-slate-200 h-10"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                        <span className="hidden sm:inline">
                          {sortOrder === "newest"
                            ? "Terbaru"
                            : sortOrder === "oldest"
                            ? "Terlama"
                            : sortOrder === "az"
                            ? "A-Z"
                            : "Z-A"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Terbaru</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Terlama</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOrder("az")}>
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        <span>Judul (A-Z)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOrder("za")}>
                        <ArrowUpDown className="mr-2 h-4 w-4 rotate-180" />
                        <span>Judul (Z-A)</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 bg-white border-slate-200 h-10"
                      >
                        <Filter className="h-3.5 w-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Filter</span>
                        {filterRole && (
                          <Badge className="ml-1 rounded-full bg-blue-600 text-white w-5 h-5 p-0 flex items-center justify-center">
                            1
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => setFilterRole("")}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Semua Peran</span>
                      </DropdownMenuItem>
                      {uniqueRoles.map((role) => (
                        <DropdownMenuItem
                          key={role}
                          onClick={() => setFilterRole(role)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <span>{formatRoleName(role)}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Active Filters */}
                {filterRole && (
                  <div className="mt-2 flex items-center">
                    <span className="text-xs text-slate-500 mr-2">
                      Filter aktif:
                    </span>
                    <Badge className="bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatRoleName(filterRole)}
                      <button
                        onClick={() => setFilterRole("")}
                        className="ml-1 hover:bg-blue-200 rounded-full h-4 w-4 inline-flex items-center justify-center"
                      >
                        ×
                      </button>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content Area */}
              <TabsContent value="all" className="p-0 m-0">
                {renderContent()}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );

  function renderContent() {
    if (isLoading) {
      return viewMode === "grid" ? renderGridSkeleton() : renderListSkeleton();
    }

    if (filteredAndSortedMaterials.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white">
          <div className="bg-slate-50 rounded-full p-6 mb-4">
            <BookOpen className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-medium text-slate-700 mb-2">
            Tidak ada materi ditemukan
          </h3>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {searchTerm || filterRole
              ? "Coba sesuaikan pencarian atau filter Anda untuk menemukan apa yang Anda cari."
              : "Belum ada materi pelatihan yang tersedia saat ini."}
          </p>
          {userRole === "Admin" && (
            <Link href="/training-materials/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Materi Pelatihan
              </Button>
            </Link>
          )}
        </div>
      );
    }

    return viewMode === "grid" ? renderGridView() : renderListView();
  }

  function renderGridSkeleton() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border shadow-sm overflow-hidden">
            <div className="h-1 bg-slate-200"></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  function renderListSkeleton() {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full max-w-xl mt-2" />
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderGridView() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {filteredAndSortedMaterials.map((material) => (
          <Card
            key={material.id}
            className="border shadow-sm overflow-hidden hover:shadow-md transition-all"
          >
            <div
              className={`h-1 ${
                getMaterialTypeColor(material.link).split(" ")[0]
              }`}
            ></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge
                  variant="outline"
                  className={getMaterialTypeColor(material.link)}
                >
                  {getMaterialIcon(material.link)}
                  <span className="ml-1">{getMaterialType(material.link)}</span>
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-slate-100 text-slate-700"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(material.createdAt)}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2 line-clamp-2">
                {material.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-sm text-slate-600 line-clamp-3 mb-3">
                {material.description}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center">
                  <Users className="h-3.5 w-3.5 mr-1" />
                  <span>{material.assignedRoles.length} peran</span>
                </div>
                <a
                  href={material.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <LinkIcon className="h-3.5 w-3.5 mr-1" />
                  <span>Buka Link</span>
                </a>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/training-materials/detail/${material.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Detail
                </Button>
              </Link>
              {userRole === "Admin" && (
                <div className="flex gap-2">
                  <Link href={`/training-materials/edit/${material.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(material.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Hapus
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  function renderListView() {
    return (
      <div className="p-6 space-y-4">
        {filteredAndSortedMaterials.map((material) => (
          <div
            key={material.id}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar
                    className={`h-10 w-10 ${getMaterialTypeColor(
                      material.link
                    )}`}
                  >
                    <AvatarFallback>
                      {getMaterialIcon(material.link)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{material.title}</h3>
                    <div className="flex items-center text-xs text-slate-500 mt-1">
                      <Badge
                        variant="outline"
                        className={getMaterialTypeColor(material.link)}
                      >
                        {getMaterialType(material.link)}
                      </Badge>
                      <span className="mx-2">•</span>
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(material.createdAt)}
                      <span className="mx-2">•</span>
                      <Users className="h-3 w-3 mr-1" />
                      {material.assignedRoles.length} peran
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 max-w-xl">
                  {material.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <a
                  href={material.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Buka Link
                </a>
                <Link href={`/training-materials/detail/${material.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Detail
                  </Button>
                </Link>
                {userRole === "Admin" && (
                  <>
                    <Link href={`/training-materials/edit/${material.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(material.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Hapus
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
