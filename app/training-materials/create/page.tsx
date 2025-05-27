"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  LinkIcon,
  FileText,
  Save,
  X,
  Loader2,
  Users,
  Info,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Toast from "@/components/Toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FormData {
  title: string;
  link: string;
  description: string;
  assignedRoles: string[];
}

export default function TambahMateriPelatihan() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    link: "",
    description: "",
    assignedRoles: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setSelectedRoles(options);
    setFormData((prev) => ({
      ...prev,
      assignedRoles: options,
    }));
  };

  const validateForm = () => {
    if (!formData.title || !formData.link || !formData.description) {
      setToast({
        type: "error",
        message: "Mohon lengkapi semua field yang diperlukan",
      });
      return false;
    }

    // Check if the link starts with "https://"
    if (!/^https:\/\//.test(formData.link)) {
      setToast({
        type: "error",
        message: "Link harus dimulai dengan 'https://'.",
      });
      return false;
    }

    // Check if roles are assigned and switch to advanced tab if not
    if (formData.assignedRoles.length === 0) {
      setToast({
        type: "warning",
        message: "Anda belum memilih peran yang dapat mengakses materi ini",
      });
      setActiveTab("advanced");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setToast({
        type: "error",
        message: "Token autentikasi tidak ditemukan. Silakan login kembali.",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        "https://rumahbaristensbe-production.up.railway.app/api/training-materials/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Raise success toast
        setToast({
          type: "success",
          message: "Materi pelatihan berhasil ditambahkan",
        });
        // After a short delay, navigate to the training materials page
        setTimeout(() => {
          router.push("/training-materials");
        }, 2000);
      } else {
        setToast({
          type: "error",
          message: result.message || "Gagal menambahkan materi pelatihan",
        });
      }
    } catch (err) {
      console.error("Error adding training material:", err);
      setToast({
        type: "error",
        message: "Terjadi kesalahan saat menambahkan materi pelatihan",
      });
    } finally {
      setIsSubmitting(false);
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

  // Get material icon based on link
  const getMaterialIcon = () => {
    const type = getMaterialType(formData.link);
    switch (type) {
      case "Video":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "Document":
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <LinkIcon className="h-5 w-5 text-purple-500" />;
    }
  };

  // Get color for material type
  const getMaterialTypeColor = () => {
    const type = getMaterialType(formData.link);
    switch (type) {
      case "Video":
        return "bg-red-100 text-red-700 border-red-200";
      case "Document":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-purple-100 text-purple-700 border-purple-200";
    }
  };

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
        {/* Header with animated gradient */}
        <div className="relative overflow-hidden rounded-xl bg-white shadow-md mb-8">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(79,70,229,0.15),transparent_50%)]"></div>

          <div className="relative px-6 py-6 md:px-8 flex items-center">
            <Link href="/training-materials/" className="mr-4">
              <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Tambah Materi Pelatihan
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Tambahkan materi pelatihan baru untuk barista
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-md">
              <form onSubmit={handleSubmit}>
                <Tabs
                  defaultValue="basic"
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "basic" | "advanced")
                  }
                >
                  <CardHeader className="pb-4 border-b">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
                      <TabsTrigger value="advanced" className="relative">
                        Pengaturan Lanjutan
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <TabsContent value="basic" className="mt-0 space-y-6">
                      <div className="space-y-2">
                        <label
                          htmlFor="title"
                          className="block text-sm font-medium text-slate-700"
                        >
                          Judul Materi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Masukkan judul materi"
                          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="link"
                          className="block text-sm font-medium text-slate-700"
                        >
                          Link Materi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="link"
                          name="link"
                          value={formData.link}
                          onChange={handleInputChange}
                          placeholder="https://"
                          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <p className="text-xs text-slate-500">
                          Masukkan link ke video, dokumen, atau sumber belajar
                          lainnya
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-slate-700"
                        >
                          Deskripsi Materi{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Deskripsi materi pelatihan"
                          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
                          required
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="mt-0 space-y-6">
                      <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-700 text-sm font-medium">
                          Pengaturan Lanjutan
                        </AlertTitle>
                        <AlertDescription className="text-blue-600 text-xs">
                          Tentukan peran yang dapat mengakses materi pelatihan
                          ini
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <label
                          htmlFor="assignedRoles"
                          className="block text-sm font-medium text-slate-700"
                        >
                          Assign User <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="assignedRoles"
                            name="assignedRoles"
                            multiple
                            value={selectedRoles}
                            onChange={handleRoleChange}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            size={5}
                          >
                            <option value="INTERN_BARISTA">
                              Intern Barista
                            </option>
                            <option value="PROBATION_BARISTA">
                              Probation Barista
                            </option>
                            <option value="BARISTA">Barista</option>
                            <option value="HEAD_BARISTA">Head Barista</option>
                            <option value="MANAGER">Manager</option>
                          </select>
                          <div className="text-xs text-slate-500 mt-1 flex items-center">
                            <HelpCircle className="h-3 w-3 mr-1 text-slate-400" />
                            Tahan Ctrl (atau Cmd) untuk memilih beberapa peran
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Peran Terpilih
                        </label>
                        <div className="min-h-[60px] p-3 border border-slate-200 rounded-lg bg-slate-50">
                          {selectedRoles.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedRoles.map((role) => (
                                <Badge
                                  key={role}
                                  className="bg-blue-100 text-blue-700 border border-blue-200"
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  {role.replace("_", " ")}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedRoles((prev) =>
                                        prev.filter((r) => r !== role)
                                      )
                                    }
                                    className="ml-1 hover:bg-blue-200 rounded-full h-4 w-4 inline-flex items-center justify-center"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 text-center">
                              Belum ada peran yang dipilih
                            </p>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </CardContent>
                  <div className="text-xs text-slate-500 mt-2 flex items-center">
                    <Info className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                    Pastikan untuk mengisi informasi di kedua tab sebelum
                    menyimpan
                  </div>
                  <CardFooter className="flex justify-between border-t pt-6">
                    <Link href="/training-materials">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Batal
                      </Button>
                    </Link>
                    <div className="flex items-center text-xs text-amber-600 mr-auto">
                      <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                      {activeTab === "basic"
                        ? "Jangan lupa untuk mengisi Pengaturan Lanjutan"
                        : "Semua field dengan tanda * wajib diisi"}
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Simpan Materi
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Tabs>
              </form>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <Card className="border-none shadow-md h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <BookOpen className="mr-2 h-4 w-4 text-blue-600" />
                  Preview Materi
                </CardTitle>
                <CardDescription className="text-xs">
                  Pratinjau materi pelatihan
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                  {formData.title ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-base">
                          {formData.title}
                        </h3>
                        {formData.link && (
                          <Badge
                            variant="outline"
                            className={getMaterialTypeColor()}
                          >
                            {getMaterialIcon()}
                            <span className="ml-1">
                              {getMaterialType(formData.link)}
                            </span>
                          </Badge>
                        )}
                      </div>

                      {formData.description && (
                        <p className="text-sm text-slate-600 line-clamp-4">
                          {formData.description}
                        </p>
                      )}

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Link:</span>
                          {formData.link ? (
                            <a
                              href={formData.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 truncate max-w-[150px]"
                            >
                              {formData.link}
                            </a>
                          ) : (
                            <span className="text-slate-400">Belum diisi</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Peran:</span>
                          <div className="flex flex-wrap justify-end gap-1 max-w-[150px]">
                            {selectedRoles.length > 0 ? (
                              selectedRoles.length > 2 ? (
                                <Badge variant="outline" className="text-xs">
                                  {selectedRoles.length} peran
                                </Badge>
                              ) : (
                                selectedRoles.map((role) => (
                                  <Badge
                                    key={role}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {role.replace("_", " ")}
                                  </Badge>
                                ))
                              )
                            ) : (
                              <span className="text-slate-400">
                                Belum dipilih
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {formData.link && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => window.open(formData.link, "_blank")}
                          >
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            Buka Link
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <BookOpen className="h-10 w-10 text-slate-300 mb-2" />
                      <h3 className="text-sm font-medium text-slate-700">
                        Preview Materi
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Isi formulir untuk melihat pratinjau materi pelatihan
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
