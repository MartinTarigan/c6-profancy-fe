"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import LoadingIndicator from "@/components/LoadingIndicator";

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
        "https://sahabattensbe-production-0c07.up.railway.app/api/outlets",
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
        `https://sahabattensbe-production-0c07.up.railway.app/api/overtime-logs/${params.id}`,
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
        `https://sahabattensbe-production-0c07.up.railway.app/api/overtime-logs/${params.id}/status`,
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600";
      case "REJECTED":
        return "text-red-600";
      case "PENDING":
        return "text-yellow-600";
      case "ONGOING":
        return "text-blue-600";
      case "CANCELLED":
        return "text-red-600";
      default:
        return "text-gray-600";
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
      case "ONGOING":
        return "Ongoing";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
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
    return <LoadingIndicator />;
  }

  return (
    <div className="py-10 px-4">
      <h1 className="text-3xl font-bold text-center text-[#4169E1] mb-10">
        Detail Log Lembur{" "}
        <span className={getStatusClass(formData.status)}>
          ({getStatusDisplay(formData.status)})
        </span>
      </h1>

      <div className="max-w-3xl mx-auto bg-white border rounded-lg p-8 shadow space-y-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="dateOvertime" className="block mb-2 font-medium">
              Tanggal Lembur
            </label>
            <input
              id="dateOvertime"
              name="dateOvertime"
              type="text"
              value={formatDate(formData.dateOvertime)}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="startHour" className="block mb-2 font-medium">
              Jam Mulai
            </label>
            <input
              id="startHour"
              name="startHour"
              type="text"
              value={formData.startHour}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="outletName" className="block mb-2 font-medium">
              Outlet
            </label>
            <input
              id="outletName"
              name="outletName"
              type="text"
              value={formData.outletName}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="duration" className="block mb-2 font-medium">
              Durasi (Jam)
            </label>
            <input
              id="duration"
              name="duration"
              type="text"
              value={formData.duration}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="reason" className="block mb-2 font-medium">
              Alasan Lembur
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              readOnly
              rows={4}
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="verifier" className="block mb-2 font-medium">
              Verifikator
            </label>
            <input
              id="verifier"
              name="verifier"
              value={getVerifierName()}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="status" className="block mb-2 font-medium">
              Status
            </label>
            <input
              type="text"
              value={getStatusDisplay(formData.status)}
              readOnly
              className={`w-full border border-gray-300 rounded p-2 bg-gray-100 ${getStatusClass(
                formData.status
              )}`}
            />
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="w-40 border border-[#4169E1] text-[#4169E1] hover:bg-blue-50 rounded py-2"
          >
            Kembali
          </button>
          {canCancelRequest() && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRevoke}
              disabled={updating}
              className="w-40"
            >
              {updating ? "Memproses..." : "Batalkan Permohonan"}
            </Button>
          )}
        </div>
      </div>

      {toast && (
        <div
          className={`mt-4 p-4 rounded ${
            toast.type === "Berhasil" ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          {toast.message}
          <button
            onClick={() => setToast(null)}
            className="float-right font-bold"
          >
            X
          </button>
        </div>
      )}
    </div>
  );
}
