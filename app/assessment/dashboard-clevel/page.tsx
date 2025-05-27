"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Filter,
  Calendar,
  BarChart3,
  RefreshCw,
  FileText,
  Users,
  Coffee,
  GraduationCap,
  UserCheck,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";

interface AssignedUser {
  id: string;
  fullName: string;
}

interface Assessment {
  id: number;
  template: string;
  deadline: string;
  assignedUsers: AssignedUser[];
  questions?: {
    id: string;
    question: string;
    type: string;
    options: {
      id: string;
      text: string;
    }[];
  }[];
}

// Sort options
type SortOption = {
  label: string;
  value: string;
  direction: "asc" | "desc";
};

// Define StatusOption type
type StatusOption = "all" | "active" | "completed";

const SORT_OPTIONS: SortOption[] = [
  { label: "Tanggal (Terbaru)", value: "deadline", direction: "desc" },
  { label: "Tanggal (Terlama)", value: "deadline", direction: "asc" },
  { label: "Peserta (Terbanyak)", value: "assignees", direction: "desc" },
  { label: "Peserta (Tersedikit)", value: "assignees", direction: "asc" },
];

// Add a new STATUS_FILTER array
const STATUS_FILTERS = ["all", "active", "completed"];

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

// Template icons and colors
const TEMPLATE_CONFIG = {
  HEADBAR: {
    icon: <Coffee className="h-4 w-4" />,
    color: "bg-amber-100 text-amber-700",
    description: "Evaluasi untuk posisi Head Bar",
  },
  BARISTA: {
    icon: <Coffee className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-700",
    description: "Evaluasi untuk Barista",
  },
  TRAINEEBARISTA: {
    icon: <GraduationCap className="h-4 w-4" />,
    color: "bg-green-100 text-green-700",
    description: "Evaluasi untuk Trainee Barista",
  },
  PROBATIONBARISTA: {
    icon: <UserCheck className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-700",
    description: "Evaluasi untuk Probation Barista",
  },
};

export default function AssessmentDashboard() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalAssessments: 0,
    averageScore: 0,
    passRate: 0,
    completionRate: 0,
  });

  // Sort and filter states
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0]);
  const [filterTemplates, setFilterTemplates] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Add a new state for status filter
  const [statusFilter, setStatusFilter] = useState<StatusOption>("all");

  // Helper function to check if assessment is active
  const isAssessmentActive = (deadline: string) => {
    return new Date(deadline) > new Date();
  };

  useEffect(() => {
    const role = localStorage.getItem("roles");
    setUserRole(role);

    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        // Only allow access for C-level executives
        const isExecutive = ["CLEVEL"].includes(role || "");
        if (!isExecutive) {
          throw new Error(
            "Unauthorized: Hanya C-level executives yang dapat mengakses dashboard ini"
          );
        }

        const res = await fetch(
          "https://rumahbaristensbe-production.up.railway.app/api/assessments",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!res.ok) {
          throw new Error(`Error fetching assessments: ${res.status}`);
        }

        const data: Assessment[] = await res.json();
        setAssessments(data);

        // Calculate dashboard stats
        calculateDashboardStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  // Calculate dashboard stats from assessment data
  const calculateDashboardStats = async (assessmentsData: Assessment[]) => {
    try {
      const token = localStorage.getItem("token");
      let totalScore = 0;
      let totalParticipants = 0;
      let passedParticipants = 0;
      let completedSubmissions = 0;

      // For each assessment, fetch submission summaries to get scores
      for (const assessment of assessmentsData) {
        try {
          const summariesRes = await fetch(
            `https://rumahbaristensbe-production.up.railway.app/api/trainee/assessment/${assessment.id}/summaries`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );

          if (summariesRes.ok) {
            const summariesData = await summariesRes.json();
            const submissions = summariesData.data || [];

            if (submissions.length > 0) {
              // Count submissions
              totalParticipants += submissions.length;

              // Calculate scores
              submissions.forEach((sub: any) => {
                totalScore += sub.totalScore;
                if (sub.totalScore >= 70) {
                  // Assuming 70 is passing grade
                  passedParticipants++;
                }
                completedSubmissions++;
              });
            }
          }
        } catch (error) {
          console.error(
            `Error fetching summaries for assessment ${assessment.id}:`,
            error
          );
        }
      }

      // Calculate final stats
      const stats = {
        totalAssessments: assessmentsData.length,
        averageScore:
          totalParticipants > 0
            ? Math.round((totalScore / totalParticipants) * 10) / 10
            : 0,
        passRate:
          totalParticipants > 0
            ? Math.round((passedParticipants / totalParticipants) * 100)
            : 0,
        completionRate:
          assessmentsData.length > 0
            ? Math.round(
                (completedSubmissions /
                  assessmentsData.reduce(
                    (sum, a) => sum + a.assignedUsers.length,
                    0
                  )) *
                  100
              )
            : 0,
      };

      setDashboardStats(stats);
    } catch (error) {
      console.error("Error calculating dashboard stats:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
    setStatusFilter("all");
    setDateRange(undefined);
  };

  // Get template config
  const getTemplateConfig = (template: string) => {
    return (
      TEMPLATE_CONFIG[template as keyof typeof TEMPLATE_CONFIG] || {
        icon: <FileText className="h-4 w-4" />,
        color: "bg-slate-100 text-slate-700",
        description: "Assessment",
      }
    );
  };

  // Get initials for avatar
  const getInitials = (template: string) => {
    return template.substring(0, 2).toUpperCase();
  };

  // Apply search, filter, and sort
  const filteredAndSortedAssessments = assessments
    // Apply template filter
    .filter((a) => {
      if (filterTemplates.length === 0) return true;
      return filterTemplates.includes(a.template);
    })
    // Apply status filter
    .filter((a) => {
      if (statusFilter === "all") return true;
      const isActive = new Date(a.deadline) > new Date();
      return (
        (statusFilter === "active" && isActive) ||
        (statusFilter === "completed" && !isActive)
      );
    })
    // Apply date filter
    .filter((a) => {
      if (!dateRange?.from) return true;
      const assessmentDate = new Date(a.deadline);
      const from = dateRange.from;
      const to = dateRange.to || dateRange.from;

      // Set time to beginning/end of day for accurate comparison
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      return assessmentDate >= fromDate && assessmentDate <= toDate;
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

      if (value === "assignees") {
        return (
          ((a.assignedUsers?.length || 0) - (b.assignedUsers?.length || 0)) *
          multiplier
        );
      }

      return 0;
    });

  // Calculate assessment counts by template
  const assessmentCounts = TEMPLATE_TYPES.reduce((acc, template) => {
    acc[template] = assessments.filter((a) => a.template === template).length;
    return acc;
  }, {} as Record<string, number>);

  // Group assessments by template
  const assessmentsByTemplate = TEMPLATE_TYPES.reduce((acc, template) => {
    acc[template] = filteredAndSortedAssessments.filter(
      (a) => a.template === template
    );
    return acc;
  }, {} as Record<string, Assessment[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-700">
            Memuat Dashboard Assessment
          </h3>
          <p className="text-slate-500 mt-2">
            Mohon tunggu sementara kami mengambil data
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
              Error Memuat Dashboard
            </CardTitle>
            <CardDescription className="text-red-700">
              Kami tidak dapat memuat data assessment
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
              Coba Lagi
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
            Dashboard Hasil Assessment
          </h1>
          <p className="text-slate-500 mb-4 text-center text-sm max-w-2xl">
            Lihat hasil assessment secara komprehensif untuk evaluasi kinerja
            dan pengembangan karir barista
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border-blue-100">
            <CardContent className="p-4 flex items-center">
              <div className="bg-blue-50 p-2 rounded-md mr-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">
                  {dashboardStats.totalAssessments}
                </div>
                <p className="text-xs text-slate-500">Total Assessment</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-green-100">
            <CardContent className="p-4 flex items-center">
              <div className="bg-green-50 p-2 rounded-md mr-3">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">
                  {assessments.reduce(
                    (sum, a) => sum + (a.assignedUsers?.length || 0),
                    0
                  )}
                </div>
                <p className="text-xs text-slate-500">Total Peserta</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-amber-100">
            <CardContent className="p-4 flex items-center">
              <div className="bg-amber-50 p-2 rounded-md mr-3">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">
                  {
                    assessments.filter((a) => new Date(a.deadline) > new Date())
                      .length
                  }
                </div>
                <p className="text-xs text-slate-500">Assessment Aktif</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-100">
            <CardContent className="p-4 flex items-center">
              <div className="bg-purple-50 p-2 rounded-md mr-3">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">
                  {
                    assessments.filter(
                      (a) => new Date(a.deadline) <= new Date()
                    ).length
                  }
                </div>
                <p className="text-xs text-slate-500">Assessment Selesai</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Overview */}
        <Card className="bg-white border-blue-100 mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan Assessment</CardTitle>
            <CardDescription>
              Distribusi assessment berdasarkan jenis dan status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-3">
                  Distribusi Jenis Assessment
                </h4>
                <div className="space-y-3">
                  {TEMPLATE_TYPES.map((template) => {
                    const count = assessments.filter(
                      (a) => a.template === template
                    ).length;
                    const percentage =
                      Math.round((count / assessments.length) * 100) || 0;
                    const config = getTemplateConfig(template);

                    return (
                      <div key={template}>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <span
                              className={`w-2 h-2 rounded-full ${config.color.replace(
                                "bg-",
                                "bg-"
                              )} mr-2`}
                            ></span>
                            <span className="text-sm">
                              {capitalize(template)}
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-2 bg-slate-100"
                          indicatorClassName={config.color.replace(
                            "text-",
                            "bg-"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Status Assessment</h4>
                <div className="space-y-3">
                  {(() => {
                    const active = assessments.filter(
                      (a) => new Date(a.deadline) > new Date()
                    ).length;
                    const completed = assessments.filter(
                      (a) => new Date(a.deadline) <= new Date()
                    ).length;
                    const activePercentage =
                      Math.round((active / assessments.length) * 100) || 0;
                    const completedPercentage =
                      Math.round((completed / assessments.length) * 100) || 0;

                    return (
                      <>
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
                              <span className="text-sm">Aktif</span>
                            </div>
                            <span className="text-sm font-medium">
                              {active} ({activePercentage}%)
                            </span>
                          </div>
                          <Progress
                            value={activePercentage}
                            className="h-2 bg-slate-100"
                            indicatorClassName="bg-blue-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                              <span className="text-sm">Selesai</span>
                            </div>
                            <span className="text-sm font-medium">
                              {completed} ({completedPercentage}%)
                            </span>
                          </div>
                          <Progress
                            value={completedPercentage}
                            className="h-2 bg-slate-100"
                            indicatorClassName="bg-green-600"
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-blue-100 p-3 mb-4 flex flex-wrap gap-2 items-center">
          {/* Date Range Picker */}
          <div className="flex-1 min-w-[240px]">
            <DatePickerWithRange
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 bg-white border-blue-200 text-slate-700 h-8"
              >
                {statusFilter === "all" ? (
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                ) : statusFilter === "active" ? (
                  <Clock className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
                )}
                {statusFilter === "all"
                  ? "Semua Status"
                  : statusFilter === "active"
                  ? "Sedang Berjalan"
                  : "Telah Selesai"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as StatusOption)
                }
              >
                <DropdownMenuRadioItem value="all">
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Semua Status</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="active">
                  <Clock className="h-4 w-4 mr-2 text-green-600" />
                  <span>Sedang Berjalan</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-amber-600" />
                  <span>Telah Selesai</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 bg-white border-blue-200 text-slate-700 h-8"
              >
                <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
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
                  <h4 className="font-medium text-sm mb-1.5">
                    Jenis Assessment
                  </h4>
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
                    disabled={
                      filterTemplates.length === 0 &&
                      statusFilter === "all" &&
                      !dateRange
                    }
                    className="h-7 text-xs"
                  >
                    Hapus Filter
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Assessment Cards by Template */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="bg-white border border-blue-100 mb-4">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Semua Assessment
            </TabsTrigger>
            {TEMPLATE_TYPES.map((template) => {
              const config = getTemplateConfig(template);
              return (
                <TabsTrigger
                  key={template}
                  value={template}
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  {config.icon}
                  <span className="ml-2">{capitalize(template)}</span>
                  <span className="ml-1 text-xs">
                    ({assessmentCounts[template]})
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedAssessments.length > 0 ? (
                filteredAndSortedAssessments.map((assessment) => {
                  const templateConfig = getTemplateConfig(assessment.template);
                  const isActive = isAssessmentActive(assessment.deadline);

                  return (
                    <Card
                      key={assessment.id}
                      className="bg-white border-blue-100 hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge className={`${templateConfig.color} text-xs`}>
                            <span className="flex items-center">
                              {templateConfig.icon}
                              <span className="ml-1">
                                {capitalize(assessment.template)}
                              </span>
                            </span>
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }
                          >
                            {isActive ? "Berjalan" : "Selesai"}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mt-2">
                          {`Tes ${capitalize(
                            assessment.template
                          )} ${getMonthName(assessment.deadline)}`}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1.5 text-slate-400" />
                            <span>{formatDate(assessment.deadline)}</span>
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 pb-2">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Peserta:</span>
                            <span className="font-medium">
                              {assessment.assignedUsers?.length || 0} orang
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Outlet:</span>
                            <span className="font-medium">-</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">
                              Passing Grade:
                            </span>
                            <span className="font-medium text-green-600">
                              70%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Link
                          href={`/assessment/dashboard-clevel/${assessment.id}`}
                          className="w-full"
                        >
                          <Button
                            variant="outline"
                            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Lihat Detail
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full bg-white rounded-lg border border-blue-100 p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-700">
                    Tidak ada assessment ditemukan
                  </h3>
                  <p className="text-slate-500 mt-1 max-w-md mx-auto">
                    {filterTemplates.length > 0 ||
                    statusFilter !== "all" ||
                    dateRange
                      ? "Coba sesuaikan filter Anda"
                      : "Tidak ada assessment yang tersedia untuk dilihat"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {TEMPLATE_TYPES.map((template) => (
            <TabsContent key={template} value={template}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessmentsByTemplate[template]?.length > 0 ? (
                  assessmentsByTemplate[template].map((assessment) => {
                    const templateConfig = getTemplateConfig(
                      assessment.template
                    );
                    const isActive = isAssessmentActive(assessment.deadline);

                    return (
                      <Card
                        key={assessment.id}
                        className="bg-white border-blue-100 hover:shadow-md transition-shadow"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge
                              className={`${templateConfig.color} text-xs`}
                            >
                              <span className="flex items-center">
                                {templateConfig.icon}
                                <span className="ml-1">
                                  {capitalize(assessment.template)}
                                </span>
                              </span>
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                isActive
                                  ? "bg-green-50 text-green-700"
                                  : "bg-amber-50 text-amber-700"
                              }
                            >
                              {isActive ? "Berjalan" : "Selesai"}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg mt-2">
                            {`Tes ${capitalize(
                              assessment.template
                            )} ${getMonthName(assessment.deadline)}`}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1.5 text-slate-400" />
                              <span>{formatDate(assessment.deadline)}</span>
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-2">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">Peserta:</span>
                              <span className="font-medium">
                                {assessment.assignedUsers?.length || 0} orang
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">Outlet:</span>
                              <span className="font-medium">-</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">
                                Passing Grade:
                              </span>
                              <span className="font-medium text-green-600">
                                70%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Link
                            href={`/assessment/dashboard-clevel/${assessment.id}`}
                            className="w-full"
                          >
                            <Button
                              variant="outline"
                              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Lihat Detail
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-full bg-white rounded-lg border border-blue-100 p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <h3 className="text-lg font-medium text-slate-700">
                      Tidak ada assessment {capitalize(template)} ditemukan
                    </h3>
                    <p className="text-slate-500 mt-1 max-w-md mx-auto">
                      {statusFilter !== "all" || dateRange
                        ? "Coba sesuaikan filter Anda"
                        : "Tidak ada assessment yang tersedia untuk dilihat"}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
