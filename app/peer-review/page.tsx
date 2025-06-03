"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ArrowUpDown,
  Users,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

// Sort options
type SortOption = {
  label: string;
  value: string;
  direction: "asc" | "desc";
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Deadline (Newest)", value: "deadline", direction: "desc" },
  { label: "Deadline (Oldest)", value: "deadline", direction: "asc" },
  { label: "Barista Name (A-Z)", value: "name", direction: "asc" },
  { label: "Barista Name (Z-A)", value: "name", direction: "desc" },
];

export default function ManajemenPeerReview() {
  const [assignments, setAssignments] = useState<PeerReviewAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sort and filter states
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0]);

  const roles =
    typeof window !== "undefined" ? localStorage.getItem("roles") : null;
  const username =
    typeof window !== "undefined" ? localStorage.getItem("username") : null;
  const isAdmin = roles === "Admin";

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        const url = isAdmin
          ? "https://rumahbaristensbe-production.up.railway.app/api/trainee/peer-review-assignment/all"
          : `https://rumahbaristensbe-production.up.railway.app/api/trainee/peer-review-assignment/by-reviewer/${username}`;
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
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
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

  // Get running count
  const runningCount = displayData.filter(
    (item) => !isCompleted(item.endDateFill)
  ).length;

  // Apply search, filter, and sort
  const filteredAndSortedData = useMemo(() => {
    const filtered = displayData
      // Only show running peer reviews
      .filter((item) => !isCompleted(item.endDateFill))
      // Apply search
      .filter((item) =>
        item.revieweeUsername.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Apply sorting
    return filtered.sort((a, b) => {
      const { value, direction } = sortOption;
      const multiplier = direction === "asc" ? 1 : -1;

      if (value === "deadline") {
        return (
          (new Date(a.endDateFill).getTime() -
            new Date(b.endDateFill).getTime()) *
          multiplier
        );
      }

      if (value === "name") {
        return (
          a.revieweeUsername.localeCompare(b.revieweeUsername) * multiplier
        );
      }

      return 0;
    });
  }, [displayData, searchQuery, sortOption]);

  // Calculate days remaining or overdue
  const getDaysStatus = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)} days overdue`,
        color: "text-red-600",
      };
    } else if (diffDays === 0) {
      return { text: "Due today", color: "text-amber-600" };
    } else {
      return { text: `${diffDays} days remaining`, color: "text-green-600" };
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-700">
            Loading Peer Reviews
          </h3>
          <p className="text-slate-500 mt-2">
            Please wait while we fetch your data
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="bg-red-50 text-red-800 rounded-t-lg">
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Data
            </CardTitle>
            <CardDescription className="text-red-700">
              We could not load your peer review data
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-700">{error}</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
            Manajemen Peer Review
          </h1>
          <p className="text-slate-500 mb-4 text-center text-sm max-w-2xl">
            {isAdmin
              ? "Kelola dan pantau semua peer review untuk evaluasi kinerja barista"
              : "Lihat dan kerjakan tugas peer review Anda"}
          </p>

          {isAdmin && (
            <Link href="/peer-review/create">
              <Button
                size="sm"
                className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                <Plus className="mr-1 h-4 w-4" />
                Tambah Peer Review
              </Button>
            </Link>
          )}
        </div>

        {/* Compact Stats Cards */}
        <div className="mb-4">
          <div className="bg-white rounded-lg border border-green-100 p-3 flex items-center">
            <div className="bg-green-50 p-1.5 rounded-md mr-3">
              <RefreshCw className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">
                {runningCount}
              </div>
              <p className="text-xs text-slate-500">Active peer reviews</p>
            </div>
          </div>
        </div>

        {/* Running Peer Reviews Heading */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium text-slate-800 flex items-center">
            <RefreshCw className="h-4 w-4 mr-2 text-green-600" />
            Running Peer Reviews ({runningCount})
          </h2>
        </div>

        {/* Compact Search & Filter */}
        <div className="bg-white rounded-lg border border-blue-100 p-3 mb-4 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by barista name..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-blue-100 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 bg-white border-blue-200 text-slate-700 h-8"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-blue-600" />
                {sortOption.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuRadioGroup
                value={`${sortOption.value}-${sortOption.direction}`}
                onValueChange={(value) => {
                  const [sortValue, direction] = value.split("-");
                  const newOption = SORT_OPTIONS.find(
                    (opt) =>
                      opt.value === sortValue && opt.direction === direction
                  );
                  if (newOption) setSortOption(newOption);
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem
                    key={`${option.value}-${option.direction}`}
                    value={`${option.value}-${option.direction}`}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table - Main focus */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-blue-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white bg-gradient-to-r from-blue-600 to-blue-600">
                  <th className="py-2.5 px-4 text-left font-medium text-sm">
                    Barista
                  </th>
                  <th className="py-2.5 px-4 text-left font-medium text-sm">
                    Deadline
                  </th>
                  {isAdmin && (
                    <th className="py-2.5 px-4 text-left font-medium text-sm">
                      Assignees
                    </th>
                  )}
                  <th className="py-2.5 px-4 text-left font-medium text-sm">
                    Status
                  </th>
                  <th className="py-2.5 px-4 text-left font-medium text-sm">
                    Time
                  </th>
                  <th className="py-2.5 px-4 text-center font-medium text-sm">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.length > 0 ? (
                  filteredAndSortedData.map((item, index) => {
                    const daysStatus = getDaysStatus(item.endDateFill);
                    const bgColor =
                      index % 2 === 0 ? "bg-white" : "bg-green-50";
                    const hoverColor = "hover:bg-green-100";

                    return (
                      <tr
                        key={
                          isAdmin
                            ? `${item.revieweeUsername}-${item.endDateFill}`
                            : (item as PeerReviewAssignment)
                                .peerReviewAssignmentId
                        }
                        className={`${bgColor} ${hoverColor} transition-colors`}
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center">
                            <Avatar className="h-7 w-7 mr-2.5 bg-blue-100 text-blue-700">
                              <AvatarFallback>
                                {getInitials(item.revieweeUsername)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {item.revieweeUsername}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                            <span className="text-sm">
                              {formatDate(item.endDateFill)}
                            </span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="py-2.5 px-4">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-xs"
                            >
                              <Users className="h-3 w-3 mr-1" />
                              {(item as GroupedAssignment).count} orang
                            </Badge>
                          </td>
                        )}
                        <td className="py-2.5 px-4">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 text-xs">
                            Running
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4">
                          <div
                            className={`text-xs ${daysStatus.color} flex items-center`}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {daysStatus.text}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isAdmin ? (
                            <Link
                              href={`/peer-review/update/${
                                item.revieweeUsername
                              }?endDate=${encodeURIComponent(
                                item.endDateFill
                              )}`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full border-blue-200 hover:border-blue-300 hover:bg-blue-50 h-7 text-xs"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Update
                              </Button>
                            </Link>
                          ) : (
                            <Link
                              href={`/peer-review/kerjakan/${
                                (item as PeerReviewAssignment)
                                  .peerReviewAssignmentId
                              }`}
                            >
                              <Button
                                size="sm"
                                className="rounded-full h-7 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                              >
                                Kerjakan
                                <ChevronRight className="ml-1 h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={isAdmin ? 6 : 5}
                      className="py-10 text-center text-slate-500 bg-white/80 backdrop-blur-sm"
                    >
                      <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                      <h3 className="text-base font-medium text-slate-700">
                        No peer reviews found
                      </h3>
                      <p className="text-slate-500 mt-1 text-sm">
                        {searchQuery
                          ? "Try adjusting your search"
                          : "There are no active peer reviews matching your criteria"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
