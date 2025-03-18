"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface AccountData {
  fullName: string;
  username: string;
  gender: boolean;
  role: string;
  phoneNumber: string;
  dateOfBirth: string | null;
  status: string;
  outlet: string;
  createdAt: string;
  updatedAt: string;
}

export default function DetailAkun() {
  const params = useParams();
  const username = params.username as string;
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const token = localStorage.getItem("token");
        setIsLoading(true);
        const response = await fetch(`http://localhost:8080/api/account/${username}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Error fetching account data: ${response.status}`);
        }
        const result = await response.json();
        setAccountData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        console.error("Error fetching account data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (username) {
      fetchAccountData();
    }
  }, [username]);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
        <h1 className="text-primary text-3xl font-bold mb-6">Detail Akun</h1>
        <div className="w-full max-w-4xl border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Role</h3>
                <p>{accountData.role}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Username</h3>
                <p>{accountData.username}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Nama Lengkap</h3>
                <p>{accountData.fullName}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Jenis Kelamin</h3>
                <p>{accountData.gender ? "Laki-Laki" : "Perempuan"}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Nomor HP</h3>
                <p>{accountData.phoneNumber}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Tanggal Lahir</h3>
                <p>{accountData.dateOfBirth}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Outlet</h3>
                <p>{accountData.outlet}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Status Akun</h3>
                <div className="inline-block">
                  <span className={`px-4 py-1 rounded-full text-sm ${accountData.status === "Active" ? "bg-green-100 text-success" : "bg-red-100 text-destructive"}`}>
                    {accountData.status === "Active" ? "Active" : "Revoked"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
