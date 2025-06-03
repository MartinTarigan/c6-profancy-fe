"use client";

import { Metadata } from "next";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FileText,
  LinkIcon,
  Users,
  Calendar,
  ArrowLeft,
  ExternalLink,
  Pencil,
  Trash2,
  BookOpen,
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
import { Separator } from "@/components/ui/separator";

interface TrainingMaterial {
  id: number;
  title: string;
  type: string;
  link: string;
  description: string;
  assignedRoles: string[];
  createdAt: string;
}

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Export metadata generation function if needed
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // You can fetch data here to generate dynamic metadata
  return {
    title: `Training Material ${params.id}`,
  };
}

// Use the correct Props type for your page component
export default function MaterialDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [material, setMaterial] = useState<TrainingMaterial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    const storedRoles = localStorage.getItem("roles") ?? "";
    setUserRole(storedRoles);

    const fetchMaterial = async () => {
      if (
        !storedToken ||
        !["Admin", "ProbationBarista"].includes(storedRoles)
      ) {
        setError("Anda tidak memiliki akses untuk melihat materi ini");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/training-materials/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Materi pelatihan tidak ditemukan");
          } else {
            throw new Error(
              `Error fetching training material: ${response.status}`
            );
          }
          return;
        }

        const result = await response.json();
        setMaterial(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat data"
        );
        console.error("Error fetching training material:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterial();
  }, [params.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("id-ID", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleDelete = async () => {
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
        `https://rumahbaristensbe-production.up.railway.app/api/training-materials/${material?.id}/delete`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      if (res.ok) {
        setToast({ type: "success", message: "Materi berhasil dihapus" });
        setTimeout(() => {
          router.push("/training-materials");
        }, 1500);
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

  // Extract YouTube video ID from URL
  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;

    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return match && match[2].length === 11 ? match[2] : null;
  };

  // Render YouTube embed if the link is a YouTube video
  const renderMediaPreview = (link: string) => {
    const videoId = getYoutubeVideoId(link);

    if (videoId) {
      return (
        <div className="aspect-video w-full rounded-lg overflow-hidden shadow-md mb-6">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      );
    }

    if (getMaterialType(link) === "Document") {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 flex flex-col items-center justify-center">
          <FileText className="h-16 w-16 text-blue-500 mb-4" />
          <p className="text-blue-700 font-medium mb-4">Dokumen Pelatihan</p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Buka Dokumen
          </a>
        </div>
      );
    }

    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6 flex flex-col items-center justify-center">
        <LinkIcon className="h-16 w-16 text-purple-500 mb-4" />
        <p className="text-purple-700 font-medium mb-4">Tautan Eksternal</p>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Buka Tautan
        </a>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 flex justify-center items-center">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="bg-red-50 text-red-800 rounded-t-lg">
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription className="text-red-700">
              Tidak dapat memuat materi pelatihan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-700">{error}</p>
          </CardContent>
          <CardFooter>
            <Link href="/training-materials" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar Materi
              </Button>
            </Link>
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

      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>

        {isLoading ? (
          <Card className="border shadow-md">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full mb-6 rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
              </div>
            </CardFooter>
          </Card>
        ) : material ? (
          <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-none shadow-md bg-white overflow-hidden">
              <div
                className={`h-1.5 ${
                  getMaterialTypeColor(material.link).split(" ")[0]
                }`}
              ></div>
              <CardHeader className="pb-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={getMaterialTypeColor(material.link)}
                  >
                    {getMaterialIcon(material.link)}
                    <span className="ml-1">
                      {getMaterialType(material.link)}
                    </span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-slate-100 text-slate-700"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(material.createdAt)}
                  </Badge>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold">
                  {material.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Media Preview */}
                {renderMediaPreview(material.link)}

                {/* Description */}
                <div className="bg-white rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Deskripsi</h3>
                  <p className="text-slate-700 whitespace-pre-line">
                    {material.description}
                  </p>
                </div>

                <Separator />

                {/* Assigned Roles */}
                <div>
                  <h3 className="text-lg font-medium mb-3">
                    Peran yang Ditugaskan
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {material.assignedRoles.map((role) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 py-1.5"
                      >
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        {formatRoleName(role)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* External Link */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Tautan Sumber</h3>
                  <a
                    href={material.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Buka di Tab Baru
                  </a>
                </div>
              </CardContent>

              {userRole === "Admin" && (
                <CardFooter className="border-t border-slate-100 pt-6">
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/training-materials/edit/${material.id}`}>
                      <Button
                        variant="outline"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Materi
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Materi
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>

            {/* Related Materials Card - Placeholder for future enhancement */}
            <Card className="border-none shadow-md bg-white overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl">Materi Terkait</CardTitle>
                <CardDescription>
                  Materi pelatihan lain yang mungkin relevan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-6 flex flex-col items-center justify-center">
                  <BookOpen className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 text-center">
                    Belum ada materi terkait yang tersedia
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border shadow-md">
            <CardHeader className="bg-amber-50 text-amber-800 rounded-t-lg">
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Materi Tidak Ditemukan
              </CardTitle>
              <CardDescription className="text-amber-700">
                Materi pelatihan yang Anda cari tidak tersedia
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-slate-700">
                Materi dengan ID {params.id} tidak dapat ditemukan. Materi
                mungkin telah dihapus atau Anda tidak memiliki akses.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/training-materials">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Daftar Materi
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
