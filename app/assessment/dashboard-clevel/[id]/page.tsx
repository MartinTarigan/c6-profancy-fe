"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Download,
  FileText,
  Loader2,
  PieChart,
  Search,
  Users,
  AlertCircle,
  Coffee,
  GraduationCap,
  UserCheck,
  CheckCircle,
  Clock,
  CheckSquare,
  Edit,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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

interface Submission {
  submissionId: number;
  username: string;
  submittedAt: string;
  mcScore: number;
  essayScore: number;
  totalScore: number;
  essayReviewed: boolean;
}

interface Participant extends Submission {
  // Removed outlet property
}

interface AssessmentDetail {
  id: number;
  template: string;
  deadline: string;
  averageScore: number;
  passingGrade: number;
  scoreDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  participants: Participant[];
}

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

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentDetail, setAssessmentDetail] =
    useState<AssessmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    const fetchAssessmentDetail = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        // Check if user is authorized (C-level)
        const role = localStorage.getItem("roles");
        const isExecutive = ["CLEVEL"].includes(role || "");
        if (!isExecutive) {
          throw new Error(
            "Unauthorized: Hanya C-level executives yang dapat mengakses dashboard ini"
          );
        }

        // Fetch assessment data
        const assessmentRes = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/assessments`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!assessmentRes.ok) {
          throw new Error(`Error fetching assessment: ${assessmentRes.status}`);
        }

        const assessmentsData: Assessment[] = await assessmentRes.json();
        const currentAssessment = assessmentsData.find(
          (a) => a.id === Number(assessmentId)
        );

        if (!currentAssessment) {
          throw new Error("Assessment tidak ditemukan");
        }

        setAssessment(currentAssessment);

        // Fetch submission summaries
        const summariesRes = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/trainee/assessment/${assessmentId}/summaries`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!summariesRes.ok) {
          throw new Error(
            `Error fetching submission summaries: ${summariesRes.status}`
          );
        }

        const summariesData = await summariesRes.json();
        const submissions = summariesData.data || [];

        // Process the data to create the assessment detail
        const passingGrade = 70; // Default passing grade

        const totalAssignedParticipants =
          currentAssessment.assignedUsers.length;
        const totalScore = submissions.reduce(
          (sum: number, sub: Submission) => sum + sub.totalScore,
          0
        );
        const averageScore =
          totalAssignedParticipants > 0
            ? totalScore / totalAssignedParticipants
            : 0;

        // Calculate score distribution
        const highScores = submissions.filter(
          (sub: Submission) => sub.totalScore >= 80
        ).length;
        const mediumScores = submissions.filter(
          (sub: Submission) => sub.totalScore >= 70 && sub.totalScore < 80
        ).length;
        const lowScores = submissions.filter(
          (sub: Submission) => sub.totalScore < 70
        ).length;

        const scoreDistribution = {
          high:
            submissions.length > 0
              ? Math.round((highScores / submissions.length) * 100)
              : 0,
          medium:
            submissions.length > 0
              ? Math.round((mediumScores / submissions.length) * 100)
              : 0,
          low:
            submissions.length > 0
              ? Math.round((lowScores / submissions.length) * 100)
              : 0,
        };

        // Create the assessment detail object
        const detail: AssessmentDetail = {
          id: currentAssessment.id,
          template: currentAssessment.template,
          deadline: currentAssessment.deadline,
          averageScore: Math.round(averageScore * 10) / 10,
          passingGrade,
          scoreDistribution,
          participants: submissions,
        };

        setAssessmentDetail(detail);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessmentDetail();
  }, [assessmentId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    return "text-red-600";
  };

  const getInitials = (username: string) => {
    return username
      .split(".")
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  // Create a list of all assigned users with their submission status
  const getAssignedUsersWithStatus = () => {
    if (!assessment || !assessmentDetail) return [];

    // Create a map of usernames to submissions
    const submissionMap = new Map();
    assessmentDetail.participants.forEach((participant) => {
      submissionMap.set(participant.username, participant);
    });

    // Create a list of all assigned users with their submission status
    return assessment.assignedUsers.map((user) => {
      const username = user.fullName.toLowerCase().replace(/\s+/g, ".");
      const submission = submissionMap.get(username);

      return {
        id: user.id,
        fullName: user.fullName,
        username: username,
        hasSubmitted: !!submission,
        isGraded: submission ? submission.essayReviewed : false,
        totalScore: submission ? submission.totalScore : null,
      };
    });
  };

  const assignedUsersWithStatus = getAssignedUsersWithStatus();

  // Create a comprehensive list that includes all assigned users
  const allParticipantsData =
    assessment?.assignedUsers.map((user) => {
      const username = user.fullName.toLowerCase().replace(/\s+/g, ".");
      const submission = assessmentDetail?.participants.find(
        (p) => p.username === username
      );

      if (submission) {
        // User has submitted
        return {
          ...submission,
          fullName: user.fullName,
          hasSubmitted: true,
        };
      } else {
        // User hasn't submitted - create placeholder data
        return {
          submissionId: Number.parseInt(user.id),
          username: username,
          fullName: user.fullName,
          submittedAt: "",
          mcScore: 0,
          essayScore: 0,
          totalScore: 0,
          essayReviewed: false,
          hasSubmitted: false,
        };
      }
    }) || [];

  const filteredParticipants = allParticipantsData.filter((participant) => {
    // Apply search filter - search by full name and username
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      participant.fullName.toLowerCase().includes(searchLower) ||
      participant.username.toLowerCase().includes(searchLower);

    // Apply combined status filter
    const matchesStatus = (() => {
      switch (selectedStatus) {
        case "completed-graded":
          return participant.hasSubmitted && participant.essayReviewed;
        case "completed-ungraded":
          return participant.hasSubmitted && !participant.essayReviewed;
        case "incomplete":
          return !participant.hasSubmitted;
        case "all":
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    try {
      // Membuat header CSV
      const headers = [
        "Nama Barista",
        "Username",
        "Status Pengerjaan",
        "Status Penilaian",
        "Nilai MC",
        "Nilai Esai",
        "Total Nilai",
        "Hasil",
        "Tanggal Submit",
      ];

      // Membuat konten CSV
      const csvContent = [
        headers.join(","),
        ...filteredParticipants.map((participant) =>
          [
            `"${participant.fullName.replace(/"/g, '""')}"`,
            `"${participant.username.replace(/"/g, '""')}"`,
            `"${
              participant.hasSubmitted ? "Sudah Dikerjakan" : "Belum Dikerjakan"
            }"`,
            `"${
              participant.hasSubmitted
                ? participant.essayReviewed
                  ? "Sudah Dinilai"
                  : "Belum Dinilai"
                : "Belum Dinilai"
            }"`,
            participant.hasSubmitted ? participant.mcScore : 0,
            participant.hasSubmitted ? participant.essayScore : 0,
            participant.hasSubmitted ? participant.totalScore : 0,
            `"${
              participant.hasSubmitted
                ? participant.totalScore >=
                  (assessmentDetail?.passingGrade || 70)
                  ? "Lulus"
                  : "Gagal"
                : "-"
            }"`,
            `"${
              participant.hasSubmitted
                ? new Date(participant.submittedAt).toLocaleDateString("id-ID")
                : "-"
            }"`,
          ].join(",")
        ),
      ].join("\n");

      // Membuat link download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);

      // Membuat nama file dengan tanggal
      const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const assessmentName = assessment?.template || "assessment";
      link.setAttribute(
        "download",
        `hasil-${assessmentName.toLowerCase()}-${today}.csv`
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("Data assessment berhasil diekspor ke CSV");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Gagal mengekspor data ke CSV");
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-700">
            Memuat Detail Assessment
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
              Error Memuat Detail
            </CardTitle>
            <CardDescription className="text-red-700">
              Kami tidak dapat memuat detail assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-700">{error}</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!assessment || !assessmentDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-yellow-200">
          <CardHeader className="bg-yellow-50 text-yellow-800 rounded-t-lg">
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Assessment Tidak Ditemukan
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Assessment yang diminta tidak dapat ditemukan
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const capitalize = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const templateConfig = getTemplateConfig(assessment.template);
  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", { month: "long" });
  };
  const assessmentTitle = `Tes ${capitalize(
    assessment.template
  )} ${getMonthName(assessment.deadline)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Kembali</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {assessmentTitle}
            </h1>
            <p className="text-slate-500 text-sm">
              ID Assessment: {assessment.id} • Deadline:{" "}
              {formatDate(assessment.deadline)}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Link
              href={`/assessment/dashboard-clevel/questions/${assessment.id}`}
            >
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Lihat Soal
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-700">Passing Grade</h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Wajib
                </Badge>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {assessmentDetail.passingGrade}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Nilai minimum untuk lulus assessment
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-700">Rata-rata Nilai</h3>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {assessmentDetail.averageScore > assessmentDetail.passingGrade
                    ? "Di Atas Target"
                    : "Di Bawah Target"}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {assessmentDetail.averageScore.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {assessmentDetail.averageScore > assessmentDetail.passingGrade
                  ? `${(
                      assessmentDetail.averageScore -
                      assessmentDetail.passingGrade
                    ).toFixed(1)}% di atas passing grade`
                  : `${(
                      assessmentDetail.passingGrade -
                      assessmentDetail.averageScore
                    ).toFixed(1)}% di bawah passing grade`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-700">Peserta</h3>
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700"
                >
                  {assessment.assignedUsers.length} Total
                </Badge>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {assessmentDetail.participants.length > 0
                  ? Math.round(
                      (assessmentDetail.participants.filter(
                        (p) => p.totalScore >= assessmentDetail.passingGrade
                      ).length /
                        assessmentDetail.participants.length) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {
                  assessmentDetail.participants.filter(
                    (p) => p.totalScore >= assessmentDetail.passingGrade
                  ).length
                }{" "}
                dari {assessmentDetail.participants.length} yang mengerjakan
                lulus
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="bg-white border border-blue-100">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Ringkasan
            </TabsTrigger>
            <TabsTrigger
              value="participants"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Peserta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Distribution Card */}
              <Card className="bg-white border-blue-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                    Distribusi Nilai
                  </CardTitle>
                  <CardDescription>
                    Distribusi nilai di seluruh peserta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Tinggi (80-100%)
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {assessmentDetail.scoreDistribution.high}%
                        </span>
                      </div>
                      <Progress
                        value={assessmentDetail.scoreDistribution.high}
                        className="h-2 bg-slate-100"
                        indicatorClassName="bg-green-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Sedang (70-79%)
                        </span>
                        <span className="text-sm font-medium text-blue-600">
                          {assessmentDetail.scoreDistribution.medium}%
                        </span>
                      </div>
                      <Progress
                        value={assessmentDetail.scoreDistribution.medium}
                        className="h-2 bg-slate-100"
                        indicatorClassName="bg-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Rendah (0-69%)
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          {assessmentDetail.scoreDistribution.low}%
                        </span>
                      </div>
                      <Progress
                        value={assessmentDetail.scoreDistribution.low}
                        className="h-2 bg-slate-100"
                        indicatorClassName="bg-red-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="font-medium text-sm mb-3">Insight Utama</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                          ✓
                        </span>
                        <span>
                          {assessmentDetail.scoreDistribution.high}% barista
                          mendapat nilai sangat baik (80% atau lebih tinggi)
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                          i
                        </span>
                        <span>
                          {assessmentDetail.scoreDistribution.medium}% barista
                          memenuhi kriteria kelulusan (70-79%)
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-red-100 text-red-700 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                          !
                        </span>
                        <span>
                          {assessmentDetail.scoreDistribution.low}% barista
                          membutuhkan pelatihan tambahan (di bawah 70%)
                        </span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Assigned Users Card */}
              <Card className="bg-white border-blue-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Daftar Peserta
                  </CardTitle>
                  <CardDescription>
                    Barista yang ditugaskan untuk assessment ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignedUsersWithStatus.map((user) => (
                      <div key={user.id} className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <Avatar className="h-10 w-10 border-2 border-white">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {getInitials(user.username)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {user.username}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge
                            className={
                              user.hasSubmitted
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          >
                            {user.hasSubmitted
                              ? "Sudah Dikerjakan"
                              : "Belum Dikerjakan"}
                          </Badge>
                          <div className="mt-1 text-xs">
                            {user.hasSubmitted ? (
                              user.isGraded ? (
                                <span
                                  className={`font-medium ${getScoreColor(
                                    user.totalScore || 0
                                  )}`}
                                >
                                  Nilai: {user.totalScore}%
                                </span>
                              ) : (
                                <span className="text-slate-500">
                                  Belum dinilai
                                </span>
                              )
                            ) : (
                              <span className="text-slate-500">
                                Belum ada nilai
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {assignedUsersWithStatus.length === 0 && (
                    <div className="text-center py-6">
                      <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <h3 className="text-lg font-medium text-slate-700">
                        Tidak ada peserta
                      </h3>
                      <p className="text-slate-500 mt-1">
                        Belum ada barista yang ditugaskan untuk assessment ini
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="participants" className="mt-4">
            <Card className="bg-white border-blue-100">
              <CardHeader className="pb-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Hasil Peserta
                  </CardTitle>

                  <div className="flex flex-wrap gap-2">
                    {/* Search */}
                    <div className="relative min-w-[200px]">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Cari peserta..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-blue-100 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Combined Status Filter */}
                    <Select
                      value={selectedStatus}
                      onValueChange={setSelectedStatus}
                    >
                      <SelectTrigger className="w-[200px] border-blue-100 bg-white text-sm h-9">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="completed-graded">
                          Sudah Dikerjakan & Dinilai
                        </SelectItem>
                        <SelectItem value="completed-ungraded">
                          Sudah Dikerjakan & Belum Dinilai
                        </SelectItem>
                        <SelectItem value="incomplete">
                          Belum Dikerjakan
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-md border border-blue-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-blue-50">
                      <TableRow>
                        <TableHead className="font-medium">Barista</TableHead>
                        <TableHead className="font-medium text-center">
                          Status Pengerjaan
                        </TableHead>
                        <TableHead className="font-medium text-center">
                          Status Penilaian
                        </TableHead>
                        <TableHead className="font-medium text-right">
                          Nilai MC
                        </TableHead>
                        <TableHead className="font-medium text-right">
                          Nilai Esai
                        </TableHead>
                        <TableHead className="font-medium text-right">
                          Total Nilai
                        </TableHead>
                        <TableHead className="font-medium text-center">
                          Hasil
                        </TableHead>
                        <TableHead className="font-medium text-center">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParticipants.map((participant) => (
                        <TableRow key={participant.submissionId}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback className="bg-blue-100 text-blue-700">
                                  {getInitials(participant.username)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {participant.fullName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {participant.username}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                participant.hasSubmitted
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }
                            >
                              {participant.hasSubmitted ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Sudah Dikerjakan
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Belum Dikerjakan
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                participant.hasSubmitted &&
                                participant.essayReviewed
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                              }
                            >
                              {participant.hasSubmitted &&
                              participant.essayReviewed ? (
                                <>
                                  <CheckSquare className="h-3 w-3 mr-1" />
                                  Sudah Dinilai
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Belum Dinilai
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {participant.hasSubmitted
                              ? `${participant.mcScore}%`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {participant.hasSubmitted
                              ? `${participant.essayScore}%`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {participant.hasSubmitted ? (
                              <span
                                className={`font-medium ${getScoreColor(
                                  participant.totalScore
                                )}`}
                              >
                                {participant.totalScore}%
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {participant.hasSubmitted ? (
                              <Badge
                                className={`${
                                  participant.totalScore >=
                                  assessmentDetail.passingGrade
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {participant.totalScore >=
                                assessmentDetail.passingGrade
                                  ? "Lulus"
                                  : "Gagal"}
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-500">
                                -
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {participant.hasSubmitted ? (
                              <Link
                                href={`/assessment/review/${participant.submissionId}?assessmentId=${assessmentId}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  Review
                                </Button>
                              </Link>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Review
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
                <div className="text-sm text-slate-500">
                  Menampilkan {filteredParticipants.length} dari{" "}
                  {assessment?.assignedUsers.length || 0} peserta
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export ke CSV
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
