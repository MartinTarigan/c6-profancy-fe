"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Calendar, MapPin, FileText, UserCheck, ArrowLeft, CheckCircle, AlertCircle, Building2, Eye, XCircle, Clock } from 'lucide-react';

interface OvertimeLog {
  id: string;
  dateOvertime: string;
  startHour: string;
  outletId: number | null;
  outletName: string;
  duration: string;
  reason: string;
  verifier: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function OvertimeLogDetail() {
  const router = useRouter();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(
    null
  );
  const [token, setToken] = useState<string | null>(null);
  const [, setUserRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [, setOvertimeLog] = useState<OvertimeLog | null>(null);
  const [outlets, setOutlets] = useState<
    { outletId: number; name: string; headBarName: string; headBarId: string }[]
  >([]);

  const [formData, setFormData] = useState({
    dateOvertime: "",
    startHour: "",
    outletId: "",
    outletName: "",
    duration: "",
    reason: "",
    verifier: "",
    status: "",
  });

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
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setToast({
        type: "Gagal",
        message: "Token tidak ditemukan. Silakan login ulang!",
      });
      setLoading(false);
      return;
    }

    setToken(storedToken);

    // Parse token to get user roles
    try {
      const tokenPayload = parseJwt(storedToken);
      if (tokenPayload && tokenPayload.roles) {
        const roles = tokenPayload.roles || [];
        setUserRoles(roles);

        // Check if user is admin
        const adminCheck = roles.includes("ROLE_Admin");
        setIsAdmin(adminCheck);
        console.log("Is admin user:", adminCheck);
      }
    } catch (err) {
      console.error("Error parsing JWT token:", err);
    }

    fetchOvertimeLogDetail(storedToken);
    fetchOutlets(storedToken);
  }, [params?.id]);

  const fetchOutlets = async (storedToken: string) => {
    try {
      const res = await fetch(
        "http://localhost:8080/api/outlets",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("Gagal mengambil data outlet");

      const data = await res.json();
      setOutlets(data);
    } catch (error) {
      console.error("❌ Gagal fetch outlets:", error);
      setToast({ type: "Gagal", message: "Gagal mengambil daftar outlet" });
    }
  };

  const fetchOvertimeLogDetail = async (storedToken: string) => {
    if (!params?.id) {
      setToast({ type: "Gagal", message: "ID lembur tidak valid" });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8080/api/overtime-logs/${params.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("Gagal mengambil detail log lembur");

      const data = await res.json();
      setOvertimeLog(data);

      setFormData({
        dateOvertime: data.dateOvertime || "",
        startHour: data.startHour ? data.startHour.substring(0, 5) : "",
        outletId: data.outletId ? data.outletId.toString() : "",
        outletName: data.outletName || "",
        duration: data.duration ? data.duration.substring(0, 2) : "",
        reason: data.reason || "",
        verifier: data.verifier || "",
        status: data.status || "",
      });
    } catch (error) {
      console.error("❌ Gagal fetch overtime log detail:", error);
      setToast({ type: "Gagal", message: "Gagal mengambil detail log lembur" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/jadwal/lembur");
  };

  const handleRevoke = async () => {
    if (!token) {
      setToast({
        type: "Gagal",
        message: "Token tidak valid. Silakan login ulang!",
      });
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/overtime-logs/${params.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "CANCELLED" }),
        }
      );

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(
            data.message || "Gagal membatalkan permohonan lembur"
          );
        } else {
          const text = await res.text();
          throw new Error(text || "Gagal membatalkan permohonan lembur");
        }
      }
      setToast({
        type: "Berhasil",
        message: "Permohonan lembur berhasil dibatalkan!",
      });
      fetchOvertimeLogDetail(token);
    } catch (error) {
      console.error("❌ Error revoking overtime log:", error);
      setToast({
        type: "Gagal",
        message: "Gagal membatalkan permohonan lembur",
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getVerifierName = () => {
    if (formData.verifier && formData.verifier.trim() !== "") {
      return formData.verifier;
    }

    const outlet = outlets.find(
      (o) => o.outletId === Number.parseInt(formData.outletId)
    );
    return outlet?.headBarName || "-";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Diterima
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Ditolak
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Menunggu Konfirmasi
          </Badge>
        );
      case "ONGOING":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Ongoing
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  const calculateEndTime = (startTime: string, duration: string): string => {
    if (!startTime || !duration) return "-"; // jika tidak ada waktu mulai atau durasi, kembalikan "-"
    
    try {
      const [startHour, startMinute] = startTime.split(":").map(Number); // memisahkan jam dan menit dari string, kemudian mengonversinya menjadi angka
      const durationHours = parseInt(duration.replace(":00", "")); // menghilangkan ":00" dan mengonversi durasi ke angka (dalam jam), misal 8:00 jam jadi 8

      const totalMinutes = startHour * 60 + startMinute + (durationHours * 60); // Menghitung total menit, misal 480 menit (jam mulai, 8*60) + 120 menit (durasi, 2*60) = 600 menit.
      const endHour = Math.floor(totalMinutes / 60) % 24; // menghitung jam selesai (modulo 24 agar tetap dalam rentang 0-23), jadi 600 dibagi 60 = 10
      const endMinute = totalMinutes % 60; // menghitung menit selesai

      return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`; // mengembalikan waktu selesai dalam format HH:mm, jadi jam selesai  adalah pukul 10:00.
    } catch (error) {
      console.error("Error calculating end time:", error); 
      return "-"; // Jika ada error, kembalikan "-"
    }
};


  // Check if user can cancel the overtime request
  const canCancelRequest = () => {
    // Admin users cannot cancel requests
    if (isAdmin) {
      return false;
    }

    // Only show cancel button if status is not already cancelled
    return formData.status !== "CANCELLED";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Memuat detail log lembur...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-600">
                  Detail Log Lembur
                </h1>
                <p className="text-sm text-gray-500">
                  Informasi lengkap log lembur
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Info Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Detail Log Lembur
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Informasi lengkap tentang log lembur yang telah diajukan
                  </p>
                </div>
              </div>
            </Card>

            {/* Status Card */}
            <Card className="p-6 border-blue-200 bg-blue-50">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-3 w-full">
                  <h4 className="font-semibold text-blue-900">
                    Status Permohonan
                  </h4>
                  <div className="flex justify-center w-full">
                    {getStatusBadge(formData.status)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Outlet Info */}
            {formData.outletName && (
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">
                      Informasi Outlet
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">Nama:</span>{" "}
                        {formData.outletName}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Verifikator:</span>{" "}
                        {getVerifierName()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Action Guidelines */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Informasi</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Semua informasi dalam halaman ini bersifat read-only</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Status akan diperbarui oleh admin atau sistem</p>
                </div>
                {canCancelRequest() && (
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Anda dapat membatalkan permohonan jika diperlukan</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="space-y-8">
                {/* Section 1: Waktu & Tanggal */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Waktu & Tanggal
                    </h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Tanggal Lembur
                      </Label>
                      <Input
                        value={formatDate(formData.dateOvertime)}
                        readOnly
                        className="h-11 bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Durasi Lembur
                      </Label>
                      <div className="relative">
                        <Input
                          value={formData.duration}
                          readOnly
                          className="h-11 bg-gray-50 pr-12"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-sm text-gray-500">jam</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* New Section: Jam Kerja Lembur */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Jam Kerja Lembur
                    </h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Jam Mulai
                      </Label>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <p className="font-medium text-green-900">{formData.startHour}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Jam Selesai
                      </Label>
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-600" />
                          <p className="font-medium text-red-900">
                            {calculateEndTime(formData.startHour, formData.duration)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Section 2: Lokasi & Durasi */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Lokasi & Durasi
                    </h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Outlet
                      </Label>
                      <Input
                        value={formData.outletName}
                        readOnly
                        className="h-11 bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Durasi Lembur
                      </Label>
                      <div className="relative">
                        <Input
                          value={formData.duration}
                          readOnly
                          className="h-11 bg-gray-50 pr-12"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-sm text-gray-500">jam</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Section 3: Detail & Verifikasi */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Detail & Verifikasi
                    </h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Alasan Lembur
                      </Label>
                      <Textarea
                        value={formData.reason}
                        readOnly
                        rows={4}
                        className="resize-none bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Verifikator
                      </Label>
                      <div className="relative">
                        <Input
                          value={getVerifierName()}
                          readOnly
                          className="h-11 bg-gray-50 pl-10"
                        />
                        <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          value={(() => {
                            switch (formData.status) {
                              case "APPROVED":
                                return "Diterima";
                              case "REJECTED":
                                return "Ditolak";
                              case "PENDING":
                                return "Menunggu Konfirmasi";
                              case "ONGOING":
                                return "Ongoing";
                              case "CANCELLED":
                                return "Cancelled";
                              default:
                                return formData.status;
                            }
                          })()}
                          readOnly
                          className="h-11 bg-gray-50 flex-1"
                        />
                        {getStatusBadge(formData.status)}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Action Section */}
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="px-8"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                  </Button>
                  {canCancelRequest() && (
                    <Button
                      variant="destructive"
                      onClick={handleRevoke}
                      disabled={updating}
                      className="px-8"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Batalkan Permohonan
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <Alert
            className={`min-w-[300px] shadow-lg border-2 ${
              toast.type === "Berhasil"
                ? "border-green-500 bg-green-50 text-green-800"
                : "border-red-500 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "Berhasil" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <AlertDescription className="flex-1 font-medium">
                {toast.message}
              </AlertDescription>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setToast(null)}
                className="h-auto p-1 hover:bg-transparent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
}