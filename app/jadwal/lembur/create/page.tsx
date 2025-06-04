"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  X,
  Clock,
  Calendar,
  MapPin,
  FileText,
  UserCheck,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Building2,
} from "lucide-react";

interface Outlet {
  outletId: number;
  name: string;
  headBarName: string;
  headBarId: string;
}

export default function TambahLogLembur() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(
    null
  );
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>(
    "00000000-0000-0000-0000-000000000000"
  );

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [currentOutlet, setCurrentOutlet] = useState<Outlet | null>(null);

  const [formData, setFormData] = useState({
    dateOvertime: "",
    startHour: "",
    outletId: "",
    duration: "",
    reason: "",
    verifier: "",
    status: "ONGOING",
  });

  // ✅ FETCH TOKEN & OUTLETS
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    console.log("🟢 Token ditemukan:", storedToken);

    if (!storedToken) {
      setToast({
        type: "Gagal",
        message: "Token tidak ditemukan. Silakan login ulang!",
      });
      return;
    }

    setToken(storedToken);

    // Extract userId from token
    try {
      const tokenPayload = parseJwt(storedToken);
      console.log("Token payload:", tokenPayload);

      // Look for common ID fields in the token payload
      if (tokenPayload && tokenPayload.id) {
        console.log("Setting userId from token id:", tokenPayload.id);
        setUserId(tokenPayload.id);
      } else if (tokenPayload && tokenPayload.userId) {
        console.log("Setting userId from token userId:", tokenPayload.userId);
        setUserId(tokenPayload.userId);
      } else if (tokenPayload && tokenPayload.sub) {
        console.log("Setting userId from token sub:", tokenPayload.sub);
        setUserId(tokenPayload.sub);
      } else if (tokenPayload && tokenPayload.user_id) {
        console.log("Setting userId from token user_id:", tokenPayload.user_id);
        setUserId(tokenPayload.user_id);
      } else {
        console.error("User ID not found in token payload");
        setToast({
          type: "Gagal",
          message: "User ID tidak ditemukan dalam token. Silakan login ulang!",
        });
      }
    } catch (err) {
      console.error("Error parsing JWT token:", err);
    }

    fetchOutlets(storedToken);
  }, []);

  // FETCH OUTLETS
  const fetchOutlets = async (storedToken: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/outlets", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (!res.ok) throw new Error("Gagal mengambil data outlet");

      const data = await res.json();

      console.log("🟢 Outlets data:", data);

      setOutlets(data);
    } catch (error) {
      console.error("❌ Gagal fetch outlets:", error);
      setToast({ type: "Gagal", message: "Gagal mengambil daftar outlet" });
    }
  };

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

  // ✅ HANDLE FORM CHANGE
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? value.replace(/\D/g, "") : value,
    }));
  };

  const handleOutletChange = (value: string) => {
    const selectedOutlet = outlets.find(
      (outlet) => outlet.outletId === Number.parseInt(value)
    );

    if (selectedOutlet) {
      setCurrentOutlet(selectedOutlet);

      // Using headBarName directly from the outlet object
      const headbarName = selectedOutlet.headBarName || "Tidak Ada Headbar";

      console.log("✅ Outlet dipilih:", selectedOutlet);
      console.log("✅ Verifier:", headbarName);

      setFormData((prev) => ({
        ...prev,
        outletId: value,
        verifier: headbarName,
      }));
    } else {
      console.warn("❌ Outlet tidak ditemukan untuk id:", value);
      setCurrentOutlet(null);
      setFormData((prev) => ({
        ...prev,
        outletId: value,
        verifier: "",
      }));
    }
  };

  // ✅ HANDLE SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setToast({
        type: "Gagal",
        message: "Token tidak valid. Silakan login ulang!",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        baristaId: 1, // Ubah sesuai kebutuhan
        userId: userId, // Use the userId from state instead of hardcoded value
        outletId: Number.parseInt(formData.outletId),
        dateOvertime: formData.dateOvertime,
        startHour: formData.startHour,
        duration: formData.duration.padStart(2, "0") + ":00",
        reason: formData.reason,
        verifier: formData.verifier,
      };

      console.log("🟢 Payload dikirim:", payload);
      console.log("🟢 Current Outlet:", currentOutlet);

      const res = await fetch(`http://localhost:8080/api/overtime-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.message || "Gagal menyimpan data");
        } else {
          const text = await res.text();
          throw new Error(text || "Gagal menyimpan data");
        }
      }

      setToast({
        type: "Berhasil",
        message: "Log lembur berhasil ditambahkan!",
      });

      setTimeout(() => {
        window.location.href = "/jadwal/lembur";
      }, 1500);
    } catch (error: unknown) {
      console.error("Error submit:", error);

      // Check if the error is an instance of Error
      if (error instanceof Error) {
        setToast({ type: "Gagal", message: error.message });
      } else {
        // In case the error is not an instance of Error, handle it gracefully
        setToast({ type: "Gagal", message: "An unknown error occurred" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.href = "/jadwal/lembur";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-600">
                  Tambah Log Lembur
                </h1>
                <p className="text-sm text-gray-500">Sistem Manajemen Lembur</p>
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
                    Form Log Lembur
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Lengkapi semua informasi yang diperlukan untuk mencatat
                    waktu lembur Anda
                  </p>
                </div>
              </div>
            </Card>

            {/* Current Outlet Info */}
            {currentOutlet && (
              <Card className="p-6 border-blue-200 bg-blue-50">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900">
                      Outlet Terpilih
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-blue-800">
                        <span className="font-medium">Nama:</span>{" "}
                        {currentOutlet.name}
                      </p>
                      <p className="text-blue-800">
                        <span className="font-medium">Headbar:</span>{" "}
                        {currentOutlet.headBarName || "Tidak Ada"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Guidelines */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Panduan Pengisian
              </h4>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Pastikan tanggal dan jam mulai lembur sudah benar</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Pilih outlet sesuai tempat Anda bekerja lembur</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Durasi lembur dihitung dalam satuan jam</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Berikan alasan yang jelas dan spesifik</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
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
                      <Label
                        htmlFor="dateOvertime"
                        className="text-sm font-medium text-gray-700"
                      >
                        Tanggal Lembur
                      </Label>
                      <Input
                        id="dateOvertime"
                        name="dateOvertime"
                        type="date"
                        value={formData.dateOvertime}
                        onChange={handleChange}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="startHour"
                        className="text-sm font-medium text-gray-700"
                      >
                        Jam Mulai
                      </Label>
                      <Input
                        id="startHour"
                        name="startHour"
                        type="time"
                        value={formData.startHour}
                        onChange={handleChange}
                        required
                        className="h-11"
                      />
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
                      <Label
                        htmlFor="outletId"
                        className="text-sm font-medium text-gray-700"
                      >
                        Outlet
                      </Label>
                      <Select
                        value={formData.outletId}
                        onValueChange={handleOutletChange}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Pilih outlet..." />
                        </SelectTrigger>
                        <SelectContent>
                          {outlets.map((outlet) => (
                            <SelectItem
                              key={outlet.outletId}
                              value={outlet.outletId.toString()}
                            >
                              {outlet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="duration"
                        className="text-sm font-medium text-gray-700"
                      >
                        Durasi Lembur
                      </Label>
                      <div className="relative">
                        <Input
                          id="duration"
                          name="duration"
                          type="number"
                          value={formData.duration}
                          onChange={handleChange}
                          min={1}
                          required
                          placeholder="0"
                          className="h-11 pr-12"
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
                      <Label
                        htmlFor="reason"
                        className="text-sm font-medium text-gray-700"
                      >
                        Alasan Lembur
                      </Label>
                      <Textarea
                        id="reason"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        rows={4}
                        maxLength={50}
                        required
                        placeholder="Jelaskan alasan lembur Anda secara singkat dan jelas..."
                        className="resize-none"
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">
                          Maksimal 50 karakter
                        </span>
                        <span
                          className={`font-medium ${
                            formData.reason.length > 40
                              ? "text-orange-600"
                              : "text-gray-600"
                          }`}
                        >
                          {formData.reason.length}/50
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="verifier"
                        className="text-sm font-medium text-gray-700"
                      >
                        Verifikator
                      </Label>
                      <div className="relative">
                        <Input
                          id="verifier"
                          name="verifier"
                          value={formData.verifier}
                          readOnly
                          className="h-11 bg-gray-50 pl-10"
                          placeholder="Akan terisi otomatis..."
                        />
                        <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Submit Section */}
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="px-8"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-8 bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Simpan Log
                      </>
                    )}
                  </Button>
                </div>
              </form>
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
