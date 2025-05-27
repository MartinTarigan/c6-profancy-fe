"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Building,
  MapPin,
  Phone,
  User,
  UserCheck,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  createdAt: string;
  updatedAt: string;
}

export default function DetailAkun() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        const response = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/account/${username}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching account data: ${response.status}`);
        }

        const result = await response.json();
        setAccountData(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching account data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchAccountData();
    }
  }, [username]);

  // const formatDate = (dateString: string | null) => {
  //   if (!dateString) return "-";
  //   try {
  //     const date = new Date(dateString);
  //     return new Intl.DateTimeFormat("id-ID", {
  //       day: "numeric",
  //       month: "long",
  //       year: "numeric",
  //     }).format(date);
  //   } catch (e) {
  //     return e;
  //   }
  // };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-primary text-3xl font-bold mb-8">Detail Akun</h1>

      {isLoading ? (
        <Card className="w-full border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <div className="bg-primary/5 p-6 flex items-center">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="ml-6 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="w-full border border-red-200 rounded-xl shadow-md overflow-hidden">
          <div className="bg-red-50 p-8 text-destructive text-center">
            <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-4 border-red-300 text-destructive hover:bg-red-50"
              onClick={() => router.back()}
            >
              Kembali
            </Button>
          </div>
        </Card>
      ) : !accountData ? (
        <Card className="w-full border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <div className="bg-muted/50 p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Account Not Found</h3>
            <p>The requested account could not be found.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.back()}
            >
              Kembali
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="w-full border border-gray-200 rounded-xl shadow-md overflow-hidden">
          {/* Header with user basic info */}
          <div className="bg-primary/5 p-6 flex flex-col md:flex-row md:items-center">
            <div className="flex items-center">
              <div className="bg-primary text-white rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold">
                {accountData.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold">{accountData.fullName}</h2>
                <p className="text-muted-foreground">@{accountData.username}</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 md:ml-auto">
              <Badge
                className={`px-4 py-1.5 text-sm font-medium ${
                  accountData.status === "Active"
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                }`}
              >
                {accountData.status === "Active" ? "Active" : "Revoked"}
              </Badge>
            </div>
          </div>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <UserCheck className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-muted-foreground mb-1">
                      Role
                    </h3>
                    <p className="text-lg">{accountData.role}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <User className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-muted-foreground mb-1">
                      Jenis Kelamin
                    </h3>
                    <p className="text-lg">
                      {accountData.gender ? "Laki-Laki" : "Perempuan"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-muted-foreground mb-1">
                      Nomor HP
                    </h3>
                    <p className="text-lg">{accountData.phoneNumber}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-muted-foreground mb-1">
                      Tanggal Lahir
                    </h3>
                    <p className="text-lg">
                      {/* {formatDate(accountData.dateOfBirth)} */}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start">
                  <Building className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-muted-foreground mb-1">
                      Outlet
                    </h3>
                    <p className="text-lg">{accountData.outlet}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-muted-foreground mb-1">
                      Alamat
                    </h3>
                    <p className="text-lg">{accountData.address || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Home className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-muted-foreground mb-1">
                      Informasi Akun
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {/* Dibuat: {formatDate(accountData.createdAt)} */}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {/* Diperbarui: {formatDate(accountData.updatedAt)} */}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => router.back()}>
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
