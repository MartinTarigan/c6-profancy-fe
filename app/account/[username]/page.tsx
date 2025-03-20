"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AccountData {
  fullName: string
  username: string
  gender: boolean
  role: string
  phoneNumber: string
  dateOfBirth: string | null
  status: string
  outlet: string
}

interface ApiResponse {
  status: number
  message: string
  timestamp: string
  data: AccountData | null
}

export default function EditAkun() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState("")
  const [status, setStatus] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const storedRole = localStorage.getItem("roles")
    setUserRole(storedRole)

    if (storedRole !== "Admin") {
      router.push(`/account/edit-profile/${username}`)
      return
    }

    const fetchAccountData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8080/api/account/${username}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        if (!response.ok) {
          throw new Error(`Error fetching account data: ${response.status}`)
        }

        const data: ApiResponse = await response.json()
        setAccountData(data.data)

        if (data.data) {
          setRole(data.data.role)
          setStatus(data.data.status)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        console.error("Error fetching account data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (username) {
      fetchAccountData()
    }
  }, [username, router])

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/account/update-role-status?username=${username}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        body: JSON.stringify({
          role,
          status,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        router.push(`/account/${username}`)
      } else {
      }
    } catch (err) {
      console.error("Error updating role and status:", err)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-destructive text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!accountData) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Account Not Found</h3>
          <p>The requested account could not be found.</p>
        </div>
      </div>
    )
  }

  if (userRole !== "Admin") {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
          <p>Only admins can access this page.</p>
          <Button onClick={() => router.push("/account")} className="mt-4">
            Back to Accounts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center">
        <h1 className="text-primary text-3xl font-bold mb-6">Edit Akun</h1>

        <div className="w-full max-w-4xl border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
          <form onSubmit={handleSaveChanges}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="role" className="block font-medium">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Barista">Barista</option>
                      <option value="Head Bar">Head Bar</option>
                      <option value="CEO">CEO</option>
                      <option value="CMO">CMO</option>
                      <option value="CIIO">CIIO</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="username" className="block font-medium">
                    Username
                  </label>
                  <p>{accountData.username}</p>
                </div>

                

                <div className="space-y-2">
                  <label htmlFor="nama" className="block font-medium">
                    Nama Lengkap
                  </label>
                  <p>{accountData.fullName}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="gender" className="block font-medium">
                    Jenis Kelamin
                  </label>
                  <p>{accountData.gender ? "Laki-Laki" : "Perempuan"}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="phone" className="block font-medium">
                    Nomor HP
                  </label>
                  <p>{accountData.phoneNumber}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="birthdate" className="block font-medium">
                    Tanggal Lahir
                  </label>
                  <p>{accountData.dateOfBirth}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="outlet" className="block font-medium">
                    Outlet
                  </label>
                  <p>{accountData.outlet}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="block font-medium">
                    Status Akun
                  </label>
                  <div className="relative">
                    <select
                      id="status"
                      className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="Active">Aktif</option>
                      <option value="Revoked">Revoked</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-4 mt-10">
              <Link href={`/account/${username}`}>
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
    </div>
  )
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
                <h3 className="font-medium mb-2">Alamat</h3>
                <p>{accountData.address}</p>
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
