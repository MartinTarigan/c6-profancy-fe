"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AccountData {
  fullName: string;
  username: string;
  gender: boolean;
  role: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string | null;
  status: string;
  outlet: string;
}

interface ApiResponse {
  status: number;
  message: string;
  timestamp: string;
  data: AccountData | null;
}

export default function EditProfile() {
  const params = useParams();
  const router = useRouter();
  const originalUsername = params.username as string;

  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<boolean>(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [outlet, setOutlet] = useState("");

  
  const [newPassword, setNewPassword] = useState("");
  const [showCombinationModal, setShowCombinationModal] = useState(false);
  const [combinationInput, setCombinationInput] = useState("");
  const [combinationError, setCombinationError] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8080/api/account/${originalUsername}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          throw new Error(`Error fetching account data: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        if (data.data) {
          setAccountData(data.data);
          
          setFullName(data.data.fullName);
          setGender(data.data.gender);
          setPhoneNumber(data.data.phoneNumber);
          setAddress(data.data.address);
          setDateOfBirth(data.data.dateOfBirth || "");
          setRole(data.data.role);
          setStatus(data.data.status);
          setOutlet(data.data.outlet);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching account data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (originalUsername) {
      fetchAccountData();
    }
  }, [originalUsername]);

  const submitUpdate = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const payload: any = {
        username: originalUsername, 
        fullName: fullName,
        gender: gender,
        phoneNumber: phoneNumber,
        address: address,
        dateOfBirth: dateOfBirth,
      };
      if (newPassword.trim() !== "") {
        payload.password = newPassword;
      }
      const response = await fetch(
        `http://localhost:8080/api/account/update-personal?username=${originalUsername}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (response.ok) {
        
        router.push(`/account/${originalUsername}`);
      } else {
        setError(result.message || "Error updating data");
      }
    } catch (err) {
      console.error("Error updating personal data:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim() !== "") {
      setShowCombinationModal(true);
    } else {
      await submitUpdate();
    }
  };

  const handleConfirmCombination = async () => {
    const normalizedPhone = phoneNumber.startsWith("+62")
      ? phoneNumber.replace(/^\+62/, "")
      : phoneNumber;
    const expectedCombination = `${originalUsername}@${normalizedPhone}`;
    if (combinationInput === expectedCombination) {
      setShowCombinationModal(false);
      setCombinationInput("");
      setCombinationError("");
      await submitUpdate();
    } else {
      setCombinationError("Kombinasi tidak sesuai. Pastikan format: username@noHP");
    }
  };
  

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-destructive text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  if (!accountData) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Account Not Found</h3>
          <p>The requested account could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-primary text-3xl font-bold mb-6">Edit Profile</h1>
        <div className="w-full max-w-4xl border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
          <form onSubmit={handleSaveChanges}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kolom Kiri */}
              <div className="space-y-6">
                {/* Role (non-editable) */}
                <div>
                  <h3 className="font-medium mb-2">Role</h3>
                  <p className="text-gray-700">{role}</p>
                </div>
                {/* Username (non-editable) */}
                <div>
                  <h3 className="font-medium mb-2">Username</h3>
                  <p className="text-gray-700">{originalUsername}</p>
                </div>
                {/* Nama Lengkap (editable) */}
                <div>
                  <h3 className="font-medium mb-2">Nama Lengkap</h3>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
                {/* Jenis Kelamin (editable) */}
                <div>
                  <h3 className="font-medium mb-2">Jenis Kelamin</h3>
                  <select
                    id="gender"
                    value={gender ? "male" : "female"}
                    onChange={(e) => setGender(e.target.value === "male")}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
                  >
                    <option value="male">Laki-Laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
              </div>
              {/* Kolom Kanan */}
              <div className="space-y-6">
                {/* Nomor HP (editable) */}
                <div>
                  <h3 className="font-medium mb-2">Nomor HP</h3>
                  <input
                    type="text"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
                {/* Alamat (editable) */}
                <div>
                  <h3 className="font-medium mb-2">Alamat</h3>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
                {/* Tanggal Lahir (editable) */}
                <div>
                  <h3 className="font-medium mb-2">Tanggal Lahir</h3>
                  <input
                    type="date"
                    id="dateOfBirth"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
                {/* Outlet (non-editable) */}
                <div>
                  <h3 className="font-medium mb-2">Outlet</h3>
                  <p className="text-gray-700">{outlet}</p>
                </div>
                {/* Status Akun (non-editable dengan style pill) */}
                <div>
                  <h3 className="font-medium mb-2">Status Akun</h3>
                  <div className="inline-block">
                    <span
                      className={`px-4 py-1 rounded-full text-sm ${
                        status === "Active"
                          ? "bg-green-100 text-success"
                          : "bg-red-100 text-destructive"
                      }`}
                    >
                      {status === "Active" ? "Active" : "Revoked"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Field New Password */}
            <div className="mt-6">
              <h3 className="font-medium mb-2">New Password</h3>
              <input
                type="password"
                id="newPassword"
                placeholder="Masukkan password baru jika ingin diubah"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
              />
            </div>
            {/* Tombol Submit */}
            <div className="flex justify-center gap-4 mt-10">
              <Link href={`/account/${originalUsername}`}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-40 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Batal
                </Button>
              </Link>
              <Button type="submit" className="w-40" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal untuk verifikasi kombinasi jika new password diisi */}
      {showCombinationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-xl font-bold mb-4">Verifikasi Kombinasi</h2>
            <p className="mb-2">
              Masukkan Kombinasi (username@noHP). Contoh: jesse.pinkman@81375349081
            </p>
            <input
              type="text"
              value={combinationInput}
              onChange={(e) => setCombinationInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none mb-2"
            />
            {combinationError && (
              <p className="text-destructive text-sm mb-2">{combinationError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCombinationModal(false);
                  setCombinationInput("");
                  setCombinationError("");
                }}
              >
                Batal
              </Button>
              <Button onClick={handleConfirmCombination}>Konfirmasi</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
