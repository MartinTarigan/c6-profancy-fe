"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Toast from "@/components/Toast";

interface FormData {
  title: string;
  type: string;
  link: string;
  description: string;
  assignedRoles: string[];
}

export default function EditMateriPelatihan() {
  const router = useRouter();
  const { id } = useParams();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    type: "VIDEO",
    link: "",
    description: "",
    assignedRoles: [],
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    // Ambil data prefilled
    async function fetchData() {
      try {
        const res = await fetch(
          `https://sahabattensbe-production-0c07.up.railway.app/api/training-materials/${id}`,
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );
        const result = await res.json();
        if (res.ok) {
          const data = result.data;
          setFormData({
            title: data.title,
            type: data.type,
            link: data.link,
            description: data.description,
            assignedRoles: data.assignedRoles,
          });
          setSelectedRoles(data.assignedRoles);
        } else {
          setToast({
            type: "error",
            message: result.message || "Gagal mengambil data materi",
          });
        }
      } catch (err) {
        console.error(err);
        setToast({
          type: "error",
          message: "Terjadi kesalahan saat memuat data",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value
    );
    setSelectedRoles(options);
    setFormData((prev) => ({ ...prev, assignedRoles: options }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setToast({
        type: "error",
        message: "Token tidak ditemukan. Silakan login ulang.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `https://sahabattensbe-production-0c07.up.railway.app/api/training-materials/${id}/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );
      const result = await res.json();
      if (res.ok) {
        setToast({ type: "success", message: "Materi berhasil diperbarui" });
        setTimeout(() => router.push("/training/materi"), 1500);
      } else {
        setToast({
          type: "error",
          message: result.message || "Gagal memperbarui materi",
        });
      }
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        message: "Terjadi kesalahan saat mengirim data",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <p className="text-center py-20">Memuat data materi...</p>;
  }

  return (
    <div className="flex flex-col">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      <div className="mb-6">
        <Link
          href="/training/materi"
          className="inline-flex items-center text-primary hover:text-primary/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Link>
      </div>

      <div className="w-full max-w-4xl border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kiri: Judul, Tipe, Link */}
            <div className="space-y-6">
              {/* Judul */}
              <div className="space-y-2">
                <label htmlFor="title" className="block font-medium">
                  Judul Materi
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-primary"
                  placeholder="Masukkan judul materi"
                  required
                />
              </div>
              {/* Tipe */}
              <div className="space-y-2">
                <label htmlFor="type" className="block font-medium">
                  Tipe Materi
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Document</option>
                </select>
              </div>
              {/* Link */}
              <div className="space-y-2">
                <label htmlFor="link" className="block font-medium">
                  Link Materi
                </label>
                <input
                  type="text"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-primary"
                  placeholder="Link Material Video/Dokumen"
                  required
                />
              </div>
            </div>

            {/* Kanan: Deskripsi, Assign Roles */}
            <div className="space-y-6">
              {/* Deskripsi */}
              <div className="space-y-2">
                <label htmlFor="description" className="block font-medium">
                  Deskripsi Materi
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-primary min-h-[150px]"
                  placeholder="Deskripsi materi pelatihan"
                  required
                />
              </div>
              {/* Assign Roles */}
              <div className="space-y-2">
                <label htmlFor="assignedRoles" className="block font-medium">
                  Assign User
                </label>
                <select
                  id="assignedRoles"
                  name="assignedRoles"
                  multiple
                  value={selectedRoles}
                  onChange={handleRoleChange}
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-primary"
                  size={4}
                  required
                >
                  <option value="TRAINEE_BARISTA">Trainee Barista</option>
                  <option value="PROBATION_BARISTA">Probation Barista</option>
                  <option value="BARISTA">Barista</option>
                  <option value="HEAD_BARISTA">Head Barista</option>
                  <option value="MANAGER">Manager</option>
                </select>
                <p className="text-xs text-gray-500">
                  Hold Ctrl/Cmd untuk pilih beberapa
                </p>
              </div>
            </div>
          </div>

          {/* Tombol */}
          <div className="flex justify-center gap-4 mt-10">
            <Link href="/training/materi">
              <Button
                type="button"
                variant="outline"
                className="w-40 border-destructive text-destructive hover:bg-destructive/10"
              >
                Batal
              </Button>
            </Link>
            <Button type="submit" className="w-40" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Perbarui Materi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
