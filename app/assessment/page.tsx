"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, ArrowUpDown, Filter } from "lucide-react";
import Link from "next/link";
import LoadingIndicator from "@/components/LoadingIndicator";

interface AssignedUser {
  id: string;
  fullName: string;
}

interface Assessment {
  id: number;
  template: string;
  deadline: string;
  assignedUsers: AssignedUser[];
  questions?: Question[];
}

interface Question {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "ESSAY";
  options: string[];
}

const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const getMonthName = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("id-ID", { month: "long" });
};

export default function ManajemenAssessment() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("roles");
    setUserRole(role);
    
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");
        
        // Ubah kondisi untuk mengizinkan akses bagi CEO, CIOO, dan CMO
        const isManagement = ["Admin", "CEO", "CIOO", "CMO"].includes(role || "");
        const url = isManagement 
          ? "https://sahabattensbe-production-0c07.up.railway.app/api/assessments"
          : `https://sahabattensbe-production-0c07.up.railway.app/api/assessments/access/${username}`;
        
        const res = await fetch(url, {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        });

        if (!res.ok) {
          throw new Error(`Error fetching assessments: ${res.status}`);
        }

        const data: Assessment[] = await res.json();
        setAssessments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("id-ID", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const filtered = assessments.filter((a) =>
    a.template.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingIndicator />;
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

  // Cek apakah user adalah management (Admin, CEO, CIOO, CMO)
  // const isManagement = ["Admin", "CEO", "CIOO", "CMO"].includes(userRole || "");
  const isAdmin = userRole === "Admin";
  const isExecutive = ["CEO", "CIOO", "CMO"].includes(userRole || "");

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-primary text-3xl font-bold mb-6">
          Manajemen Assessment
        </h1>
        {isAdmin && (
          <Link href="/assessment/create">
            <Button className="rounded-full">
              <Plus className="mr-2 h-5 w-5" />
              Tambah Assessment
            </Button>
          </Link>
        )}
      </div>

      {/* Search / Sort / Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 bg-blue-50">
          <ArrowUpDown className="h-5 w-5" />
          Sort By
        </Button>
        <Button variant="outline" className="gap-2 bg-blue-50">
          <Filter className="h-5 w-5" />
          Filter
        </Button>
      </div>

      {/* Tabel Assessments */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary text-white">
              <th className="py-4 px-6 text-left">Judul Assessment</th>
              <th className="py-4 px-6 text-left">Jumlah Assignee</th>
              <th className="py-4 px-6 text-left">Deadline Pengisian</th>
              <th className="py-4 px-6 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                className="bg-blue-50 border-b border-white"
              >
                <td className="py-4 px-6">{`Tes ${capitalize(a.template)} ${getMonthName(a.deadline)}`}</td>
                <td className="py-4 px-6">
                  {a.assignedUsers?.length || 0} Peserta
                </td>
                <td className="py-4 px-6">
                  {formatDate(a.deadline)}
                </td>
                <td className="py-4 px-6">
                  {isAdmin ? (
                    <Link href={`/assessment/update/${a.id}`}>
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    </Link>
                  ) : isExecutive ? (
                    <Link href={`/assessment/detail/${a.id}`}>
                      <Button variant="outline" size="sm">
                        Detail
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/assessment/kerjakan/${a.id}`}>
                      <Button variant="outline" size="sm">
                        Kerjakan
                      </Button>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No assessments found.</p>
        </div>
      )}
    </div>
  );
}