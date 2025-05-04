"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, ArrowUpDown, Filter } from "lucide-react";
import Link from "next/link";
import LoadingIndicator from "@/components/LoadingIndicator";

interface PeerReviewAssignment {
  peerReviewAssignmentId: number;
  reviewerUsername: string;
  revieweeUsername: string;
  endDateFill: string;
}

interface GroupedAssignment {
  revieweeUsername: string;
  endDateFill: string;
  count: number;
}

export default function ManajemenPeerReview() {
  const [assignments, setAssignments] = useState<PeerReviewAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const roles = typeof window !== "undefined" ? localStorage.getItem("roles") : null;
  const username = typeof window !== "undefined" ? localStorage.getItem("username") : null;
  const isAdmin = roles === "Admin";

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        const url = isAdmin
          ? "https://sahabattensbe-production-0c07.up.railway.app/api/trainee/peer-review-assignment/all"
          : `https://sahabattensbe-production-0c07.up.railway.app/api/trainee/peer-review-assignment/by-reviewer/${username}`;
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = await res.json();
        setAssignments(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [isAdmin, username]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${
      String(d.getMonth() + 1).padStart(2, "0")
    }/${d.getFullYear()}`;
  };

  const isCompleted = (iso: string) => new Date() > new Date(iso);

  // hanya untuk admin: hitung jumlah assignee per (reviewee + deadline)
  const grouped = useMemo<GroupedAssignment[]>(() => {
    const map: Record<string, GroupedAssignment> = {};
    assignments.forEach((a) => {
      const key = `${a.revieweeUsername}|${a.endDateFill}`;
      if (!map[key]) {
        map[key] = {
          revieweeUsername: a.revieweeUsername,
          endDateFill: a.endDateFill,
          count: 1,
        };
      } else {
        map[key].count++;
      }
    });
    return Object.values(map);
  }, [assignments]);

  // data yang akan di-render
  const displayData = isAdmin ? grouped : assignments;

  // filter by nama
  const filtered = displayData.filter((item) =>
    item.revieweeUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <LoadingIndicator />;
  if (error)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-destructive text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
          <p>{error}</p>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-primary text-3xl font-bold mb-6">
          Manajemen Peer Review
        </h1>
        {isAdmin && (
          <Link href="/peer-review/create">
            <Button className="rounded-full">
              <Plus className="mr-2 h-5 w-5" />
              Tambah Peer Review
            </Button>
          </Link>
        )}
      </div>

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

      <div className="overflow-x-auto rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary text-white">
              <th className="py-4 px-6 text-left">Barista yang dinilai</th>
              <th className="py-4 px-6 text-left">Deadline Pengisian</th>
              {isAdmin && (
                <th className="py-4 px-6 text-left">Jumlah Assignee</th>
              )}
              <th className="py-4 px-6 text-left">Status</th>
              <th className="py-4 px-6 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={
                  isAdmin
                    ? `${item.revieweeUsername}-${item.endDateFill}`
                    : ""
                }
                className="bg-blue-50 border-b border-white"
              >
                <td className="py-4 px-6">{item.revieweeUsername}</td>
                <td className="py-4 px-6">{formatDate(item.endDateFill)}</td>
                {isAdmin && (
                  <td className="py-4 px-6">
                    {(item as GroupedAssignment).count} orang
                  </td>
                )}
                <td className="py-4 px-6">
                  {isCompleted(item.endDateFill) ? (
                    <span className="px-4 py-1 rounded-full text-sm bg-red-100 text-red-500">
                      Selesai
                    </span>
                  ) : (
                    <span className="px-4 py-1 rounded-full text-sm bg-green-100 text-green-600">
                      Running
                    </span>
                  )}
                </td>
                <td className="py-4 px-6">
                  {isAdmin ? (
                    <Link
                      href={`/peer-review/update/${item.revieweeUsername}?endDate=${encodeURIComponent(
                        item.endDateFill
                      )}`}
                    >
                      <Button variant="outline" className="rounded-full">
                        Update
                      </Button>
                    </Link>
                  ) : (
                    <Link
                      href={`/peer-review/kerjakan/${(item as PeerReviewAssignment).peerReviewAssignmentId}`}
                    >
                      <Button className="rounded-full">Kerjakan</Button>
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
          <p className="text-gray-500">No peer review assignments found.</p>
        </div>
      )}
    </div>
  );
}
