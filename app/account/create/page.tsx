"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TambahAkunBaru() {
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [gender, setGender] = useState("Laki-Laki");
  const [phone, setPhone] = useState("+62");
  const [birthdate, setBirthdate] = useState("");
  const [address, setAddress] = useState("");
  const [outlet, setOutlet] = useState("");
  const [status, setStatus] = useState("Aktif");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isValid, setIsValid] = useState(false);

  const router = useRouter();

  // Validasi form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!username.trim()) {
      newErrors.username = "Username wajib diisi.";
    }
    if (!password.trim()) {
      newErrors.password = "Password wajib diisi.";
    }
    if (!nama.trim()) {
      newErrors.nama = "Nama lengkap wajib diisi.";
    }
    if (!birthdate.trim()) {
      newErrors.birthdate = "Tanggal lahir wajib diisi.";
    }
    if (!address.trim()) {
      newErrors.address = "Alamat wajib diisi.";
    }

    if (!/^\+62\d{9,}$/.test(phone)) {
      newErrors.phone = "Nomor HP minimal 9 digit setelah +62.";
    }

    // Role & Outlet
    if (!role) {
      newErrors.role = "Role wajib dipilih.";
    } else if (
      ["Head Bar", "Barista", "Trainee Barista", "Probation"].includes(role) &&
      !outlet
    ) {
      newErrors.outlet = "Outlet wajib diisi untuk peran ini.";
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  useEffect(() => {
    validateForm();
  }, [role, username, password, nama, gender, phone, birthdate, address,outlet, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    validateForm();
    if (!isValid) return;

    const token = localStorage.getItem("token");

    const mappedGender = gender === "Laki-Laki" ? true : false;

    const noOutletNeeded = ["Admin", "CEO", "CIO", "CMO"];
    const outletName = noOutletNeeded.includes(role) ? "" : outlet;

    const requestBody = {
      role: role,
      username: username,
      password: password,
      fullName: nama,
      gender: mappedGender,
      phoneNumber: phone,
      address: address,
      dateOfBirth: birthdate,
      outletName: outletName,
      status: status,
    };

    try {
      const response = await fetch("http://localhost:8080/api/account/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        alert("Pembuatan akun gagal. Silakan coba lagi.");
        return;
      }

      const data = await response.json();
      if (data.status === 201) {
        alert("Akun berhasil dibuat!");
        router.push("/account/");
      } else {
        alert(data.message || "Terjadi kesalahan. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Error saat menyimpan akun:", err);
      alert("Pembuatan akun gagal. Silakan coba lagi.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <main className="flex-1 p-6">
          <div className="flex flex-col items-center">
            <h1 className="text-primary text-3xl font-bold mb-6">
              Tambah Akun Baru
            </h1>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-4xl border border-gray-200 rounded-lg p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kiri */}
                <div className="space-y-6">
                  {/* ROLE */}
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
                        <option value="">Pilih Role</option>
                        <option value="Admin">Admin</option>
                        <option value="CEO">CEO</option>
                        <option value="CIO">CIO</option>
                        <option value="CMO">CMO</option>
                        <option value="Head Bar">Head Bar</option>
                        <option value="Barista">Barista</option>
                        <option value="Trainee Barista">Trainee Barista</option>
                        <option value="Probation">Probation Barista</option>
                      </select>
                      {errors.role && (
                        <p className="text-red-500 text-sm">{errors.role}</p>
                      )}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* USERNAME */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="block font-medium">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      className="w-full border border-gray-300 rounded-lg p-2.5"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    {errors.username && (
                      <p className="text-red-500 text-sm">{errors.username}</p>
                    )}
                  </div>

                  {/* PASSWORD */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block font-medium">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      className="w-full border border-gray-300 rounded-lg p-2.5"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm">{errors.password}</p>
                    )}
                  </div>

                  {/* NAMA LENGKAP */}
                  <div className="space-y-2">
                    <label htmlFor="nama" className="block font-medium">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      id="nama"
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                    />
                    {errors.nama && (
                      <p className="text-red-500 text-sm">{errors.nama}</p>
                    )}
                  </div>

                  {/* JENIS KELAMIN */}
                  <div className="space-y-2">
                    <label htmlFor="gender" className="block font-medium">
                      Jenis Kelamin
                    </label>
                    <div className="relative">
                      <select
                        id="gender"
                        className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="Laki-Laki">Laki-Laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kanan */}
                <div className="space-y-6">
                  {/* NOMOR HP */}
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block font-medium">
                      Nomor HP
                    </label>
                    <input
                      type="text"
                      id="phone"
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm">{errors.phone}</p>
                    )}
                  </div>

                  {/* TANGGAL LAHIR */}
                  <div className="space-y-2">
                    <label htmlFor="birthdate" className="block font-medium">
                      Tanggal Lahir
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="birthdate"
                        placeholder="01/01/2001"
                        className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    {errors.birthdate && (
                      <p className="text-red-500 text-sm">{errors.birthdate}</p>
                    )}
                  </div>


                  <div className="space-y-2">
                    <label htmlFor="address" className="block font-medium">
                      Alamat
                    </label>
                      <input
                        type="text"
                        id="address"
                        placeholder="Jl. "
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    {errors.address && (
                      <p className="text-red-500 text-sm">{errors.address}</p>
                    )}
                  </div>

                  {/* OUTLET */}
                  <div className="space-y-2">
                    <label htmlFor="outlet" className="block font-medium">
                      Outlet
                    </label>
                    <div className="relative">
                      <select
                        id="outlet"
                        className="w-full border border-gray-300 rounded-lg p-2.5"
                        value={outlet}
                        onChange={(e) => setOutlet(e.target.value)}
                        disabled={["Admin", "CEO", "CIO", "CMO"].includes(role)}
                      >
                        <option value="">Pilih Outlet</option>
                        <option value="Tens Coffee Margonda">Tens Coffee Margonda</option>
                        <option value="Tens Coffee Kantin Vokasi UI">Tens Coffee Kantin Vokasi UI</option>
                        <option value="Tens Coffee UIN Ciputat">Tens Coffee UIN Ciputat</option>
                        <option value="Tens Coffee Pamulang">Tens Coffee Pamulang</option>
                        <option value="Tens Coffee UPN Veteran Jakarta">Tens Coffee UPN Veteran Jakarta</option>
                      </select>
                      {errors.outlet && (
                        <p className="text-red-500 text-sm">{errors.outlet}</p>
                      )}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* STATUS AKUN */}
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
                        <option value="Active">Active</option>
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-10">
                <Link href="/account/">
                  <Button
                    variant="outline"
                    className="w-40 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Batal
                  </Button>
                </Link>
                <Button
                  className="w-40"
                  onClick={handleSubmit}
                  disabled={!isValid}
                >
                  Simpan Akun
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
