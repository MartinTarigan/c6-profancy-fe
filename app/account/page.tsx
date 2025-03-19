"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDownAZ, Filter, Search } from "lucide-react";
import Link from "next/link";

interface UserData {
  username: string;
  name: string;
  role: string;
  phone: string;
  outlet: string;
  status: "Active" | "Revoked";
}

export default function DaftarAkun() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null)
  useEffect(() => {
    const storedRole = localStorage.getItem("roles")
    setUserRole(storedRole)
    async function fetchUserData() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Token tidak ditemukan. Silakan login ulang.");
          return;
        }
        const response = await fetch("http://localhost:8080/api/account/viewall", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          alert("Gagal mengambil data user. Silakan coba lagi.");
          return;
        }
        const result = await response.json();
        if (result?.data) {
          const mappedUsers: UserData[] = result.data.map((item: any) => {
            return {
              username: item.username ?? "-",
              name: item.fullName ?? "-",
              role: item.role ?? "-",
              phone: item.phoneNumber ?? "-",
              outlet: item.outlet ?? "-",
              status: item.status === "Revoked" ? "Revoked" : "Active",
            };
          });
          setUsers(mappedUsers);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        alert("Terjadi kesalahan saat mengambil data user.");
      }
    }
    fetchUserData();
  }, []);
  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-primary text-3xl font-bold mb-6">Daftar Akun</h1>
        {userRole === "Admin" && (
          <Link href="/account/create">
            <Button className="rounded-full">
              <Plus className="mr-2 h-5 w-5" />
              Tambah Akun Baru
            </Button>
          </Link>
        )}
      </div>
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name or outlet..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <ArrowDownAZ className="h-5 w-5" />
          Sort By
        </Button>
        <Button variant="outline" className="gap-2">
          <Filter className="h-5 w-5" />
          Filter
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse shadow-md rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-primary text-white">
              <th className="py-4 px-6 text-left font-bold">Username</th>
              <th className="py-4 px-6 text-left font-bold">Nama Lengkap</th>
              <th className="py-4 px-6 text-left font-bold">Role</th>
              <th className="py-4 px-6 text-left font-bold">No HP</th>
              <th className="py-4 px-6 text-left font-bold">Outlet</th>
              <th className="py-4 px-6 text-left font-bold">Status</th>
              <th className="py-4 px-6 text-left font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={index} className="border-b even:bg-primary-bg">
                <td className="py-4 px-6">{user.username}</td>
                <td className="py-4 px-6">{user.name}</td>
                <td className="py-4 px-6">{user.role}</td>
                <td className="py-4 px-6">{user.phone}</td>
                <td className="py-4 px-6">{user.outlet}</td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.status === "Active" ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex gap-2">
                  <Link
                    href={
                      userRole === "Admin" ? `/account/edit/${user.username}` : `/account/edit-profile/${user.username}`
                    }
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg bg-primary-lightest text-primary border-none hover:bg-primary-lightest/80"
                    >
                      Edit
                    </Button>
                  </Link>
                    <Link href={`/account/${user.username}`}>
                      <Button size="sm" className="rounded-lg">
                        Detail
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
