"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ArrowUpDown,
  Filter,
  X,
  Check,
  Users,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  Loader2,
  ClipboardList,
  RefreshCw,
  Eye,
  FileText,
  ClipboardCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
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

// Sort options
type SortOption = {
  label: string;
  value: string;
  direction: "asc" | "desc";
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Deadline (Newest)", value: "deadline", direction: "desc" },
  { label: "Deadline (Oldest)", value: "deadline", direction: "asc" },
  { label: "Title (A-Z)", value: "title", direction: "asc" },
  { label: "Title (Z-A)", value: "title", direction: "desc" },
  { label: "Assignees (Most)", value: "assignees", direction: "desc" },
  { label: "Assignees (Least)", value: "assignees", direction: "asc" },
];

// Filter options
const TEMPLATE_TYPES = [
  "HEADBAR",
  "BARISTA",
  "TRAINEEBARISTA",
  "PROBATIONBARISTA",
];

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

  // Sort and filter states
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0]);
  const [filterTemplates, setFilterTemplates] = useState<string[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("roles");
    setUserRole(role);

    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");

        // Ubah kondisi untuk mengizinkan akses bagi CEO, CIOO, dan CMO
        const isManagement = ["Admin", "CEO", "CIOO", "CMO"].includes(
          role || ""
        );
        const url = isManagement
          ? "http://localhost:8080/api/assessments"
          : `http://localhost:8080/api/assessments/access/${username}`;

        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${String(day).padStart(2, "0")}/${String(month).padStart(
      2,
      "0"
    )}/${year}`;
  };

  // Toggle template filter
  const toggleTemplateFilter = (template: string) => {
    setFilterTemplates((prev) =>
      prev.includes(template)
        ? prev.filter((t) => t !== template)
        : [...prev, template]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterTemplates([]);
  };

  // Check if assessment is completed (past deadline)
  const isCompleted = (deadline: string) => new Date() > new Date(deadline);

  // Calculate days remaining or overdue
  const getDaysStatus = (deadline: string) => {
    const end = new Date(deadline);
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

  // Apply search, filter, and sort
  const filteredAndSortedAssessments = assessments
    // Only show running assessments
    .filter((a) => !isCompleted(a.deadline))
    // Apply search
    .filter((a) => {
      const title = `Tes ${capitalize(a.template)} ${getMonthName(
        a.deadline
      )}`.toLowerCase();
      return (
        title.includes(searchQuery.toLowerCase()) ||
        a.template.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    // Apply template filter
    .filter((a) => {
      if (filterTemplates.length === 0) return true;
      return filterTemplates.includes(a.template);
    })
    // Apply sorting
    .sort((a, b) => {
      const { value, direction } = sortOption;
      const multiplier = direction === "asc" ? 1 : -1;

      if (value === "deadline") {
        return (
          (new Date(a.deadline).getTime() - new Date(b.deadline).getTime()) *
          multiplier
        );
      }

      if (value === "title") {
        const titleA = `Tes ${capitalize(a.template)} ${getMonthName(
          a.deadline
        )}`;
        const titleB = `Tes ${capitalize(b.template)} ${getMonthName(
          b.deadline
        )}`;
        return titleA.localeCompare(titleB) * multiplier;
      }

      if (value === "assignees") {
        return (
          ((a.assignedUsers?.length || 0) - (b.assignedUsers?.length || 0)) *
          multiplier
        );
      }

      return 0;
    });

  // Get template icon
  const getTemplateIcon = (template: string) => {
    switch (template) {
      case "HEADBAR":
        return <ClipboardCheck className="h-4 w-4" />;
      case "BARISTA":
        return <ClipboardList className="h-4 w-4" />;
      case "TRAINEEBARISTA":
        return <FileText className="h-4 w-4" />;
      case "PROBATIONBARISTA":
        return <Users className="h-4 w-4" />;
      default:
        return <ClipboardList className="h-4 w-4" />;
    }
  };

  // Get template color
  const getTemplateColor = (template: string) => {
    switch (template) {
      case "HEADBAR":
        return "bg-amber-100 text-amber-700";
      case "BARISTA":
        return "bg-blue-100 text-blue-700";
      case "TRAINEEBARISTA":
        return "bg-green-100 text-green-700";
      case "PROBATIONBARISTA":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Get initials for avatar
  const getInitials = (template: string) => {
    return template.substring(0, 2).toUpperCase();
  };

  // Count running and completed assessments
  const runningCount = assessments.filter(
    (a) => !isCompleted(a.deadline)
  ).length;

  // Cek apakah user adalah management (Admin, CEO, CIOO, CMO)
  const isAdmin = userRole === "Admin";
  const isExecutive = ["CEO", "CIOO", "CMO"].includes(userRole || "");
  const isManagement = isAdmin || isExecutive;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-700">
            Loading Assessments
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
              We could not load your assessment data
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
            Manajemen Assessment
          </h1>
          <p className="text-slate-500 mb-4 text-center text-sm max-w-2xl">
            {isManagement
              ? "Kelola dan pantau semua assessment untuk evaluasi kinerja"
              : "Lihat dan kerjakan tugas assessment Anda"}
          </p>

          {isAdmin && (
            <Link href="/assessment/create">
              <Button
                size="sm"
                className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                <Plus className="mr-1 h-4 w-4" />
                Tambah Assessment
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
              <p className="text-xs text-slate-500">Active assessments</p>
            </div>
          </div>
        </div>

        {/* Running Assessments Heading */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium text-slate-800 flex items-center">
            <RefreshCw className="h-4 w-4 mr-2 text-green-600" />
            Running Assessments ({runningCount})
          </h2>
        </div>

        {/* Compact Search & Filter */}
        <div className="bg-white rounded-lg border border-blue-100 p-3 mb-4 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name..."
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

          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 bg-white border-blue-200 text-slate-700 h-8"
                data-state={filterTemplates.length > 0 ? "active" : "inactive"}
              >
                <Filter className="h-3.5 w-3.5 text-blue-600" />
                Filter
                {filterTemplates.length > 0 && (
                  <span className="ml-1 rounded-full bg-blue-600 text-white w-4 h-4 flex items-center justify-center text-xs">
                    {filterTemplates.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1.5">Template Type</h4>
                  <div className="space-y-1.5">
                    {TEMPLATE_TYPES.map((template) => (
                      <div
                        key={template}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`template-${template}`}
                          checked={filterTemplates.includes(template)}
                          onCheckedChange={() => toggleTemplateFilter(template)}
                        />
                        <label
                          htmlFor={`template-${template}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {capitalize(template)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    disabled={filterTemplates.length === 0}
                    className="h-7 text-xs"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active Filters Display */}
          {filterTemplates.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {filterTemplates.map((template) => (
                <div
                  key={template}
                  className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs flex items-center"
                >
                  {capitalize(template)}
                  <button
                    onClick={() => toggleTemplateFilter(template)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 text-xs underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Table - Main focus */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-blue-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white bg-gradient-to-r from-blue-600 to-blue-600">
                  <th className="py-2.5 px-4 text-left font-medium text-sm">
                    Assessment
                  </th>
                  <th className="py-2.5 px-4 text-left font-medium text-sm">
                    Template
                  </th>
                  <th className="py-2.5 px-4 text-left font-medium text-sm">
                    Assignees
                  </th>
                  <th className="py-2.5 px-4 text-left font-medium text-sm">
                    Deadline
                  </th>
                  <th className="py-2.5 px-4 text-left font-medium text-sm">
                    Status
                  </th>
                  <th className="py-2.5 px-4 text-center font-medium text-sm">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedAssessments.length > 0 ? (
                  filteredAndSortedAssessments.map((assessment, index) => {
                    const isDone = isCompleted(assessment.deadline);
                    const daysStatus = getDaysStatus(assessment.deadline);
                    const bgColor =
                      index % 2 === 0 ? "bg-white" : "bg-green-50";
                    const hoverColor = "hover:bg-green-100";

                    return (
                      <tr
                        key={assessment.id}
                        className={`${bgColor} ${hoverColor} transition-colors`}
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center">
                            <Avatar
                              className={`h-7 w-7 mr-2.5 ${getTemplateColor(
                                assessment.template
                              )}`}
                            >
                              <AvatarFallback>
                                {getInitials(assessment.template)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {`Tes ${capitalize(
                                assessment.template
                              )} ${getMonthName(assessment.deadline)}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge
                            className={`${getTemplateColor(
                              assessment.template
                            )} text-xs`}
                          >
                            <span className="flex items-center">
                              {getTemplateIcon(assessment.template)}
                              <span className="ml-1">
                                {capitalize(assessment.template)}
                              </span>
                            </span>
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-xs"
                          >
                            <Users className="h-3 w-3 mr-1" />
                            {assessment.assignedUsers?.length || 0} peserta
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                            <span className="text-sm">
                              {formatDate(assessment.deadline)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${
                                isDone
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  : "bg-green-100 text-green-700 hover:bg-green-200"
                              } text-xs`}
                            >
                              {isDone ? "Done" : "Running"}
                            </Badge>
                            <div
                              className={`text-xs ${daysStatus.color} flex items-center`}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {daysStatus.text}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isAdmin ? (
                            <div className="flex items-center justify-center gap-1">
                              <Link
                                href={`/assessment/lihat-detail/${assessment.id}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-blue-200 hover:border-blue-300 hover:bg-blue-50 h-7 text-xs"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Detail
                                </Button>
                              </Link>
                              <Link
                                href={`/assessment/update/${assessment.id}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-blue-200 hover:border-blue-300 hover:bg-blue-50 h-7 text-xs"
                                >
                                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                  Update
                                </Button>
                              </Link>
                            </div>
                          ) : isExecutive ? (
                            <Link href={`/assessment/detail/${assessment.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full border-blue-200 hover:border-blue-300 hover:bg-blue-50 h-7 text-xs"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Detail
                              </Button>
                            </Link>
                          ) : (
                            <Link
                              href={`/assessment/kerjakan/${assessment.id}`}
                            >
                              <Button
                                size="sm"
                                className={`rounded-full h-7 text-xs ${
                                  isDone
                                    ? "bg-blue-500 hover:bg-blue-600"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                }`}
                              >
                                {isDone ? "Hasil" : "Kerjakan"}
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
                      colSpan={6}
                      className="py-10 text-center text-slate-500 bg-white/80 backdrop-blur-sm"
                    >
                      <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                      <h3 className="text-base font-medium text-slate-700">
                        No assessments found
                      </h3>
                      <p className="text-slate-500 mt-1 text-sm">
                        {searchQuery || filterTemplates.length > 0
                          ? "Try adjusting your search or filters"
                          : "There are no assessments matching your criteria"}
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
