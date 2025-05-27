/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Search,
  TrendingUp,
  MapPin,
  Coffee,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Toast from "@/components/Toast";

// Types based on the Java models
interface PeerReviewSubmission {
  id: number;
  assignmentId: number;
  reviewerUsername: string;
  revieweeUsername: string;
  reviewedAt: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
}

interface PeerReviewQuestion {
  questionNumber: number;
  text: string;
}

interface BaristaReviewSummary {
  username: string;
  averageScore: number;
  reviewsCompleted: number;
  reviewsTotal: number;
  status: "Tidak Lulus" | "Lulus Bersyarat" | "Lulus" | "Pending";
  lastReviewDate: string;
  outlet: string;
  position: string;
  probationEndDate: string;
  trend: "up" | "down" | "stable";
  trendValue: number;
}

interface OutletSummary {
  name: string;
  averageScore: number;
  baristaCount: number;
  passRate: number;
  reviewCompletionRate: number;
}

interface QuestionSummary {
  questionNumber: number;
  text: string;
  averageScore: number;
}

interface ReviewStatusCount {
  name: string;
  value: number;
  color: string;
}

interface DashboardSummary {
  totalBaristas: number;
  averageScore: number;
  scoreTrend: number;
  passRate: number;
  completedReviews: number;
  totalReviews: number;
}

interface ScoreTrend {
  month: string;
  score: number;
}

export default function PeerReviewDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOutlet, setFilterOutlet] = useState<string>("all");
  const [questions, setQuestions] = useState<PeerReviewQuestion[]>([]);
  const [baristaData, setBaristaData] = useState<BaristaReviewSummary[]>([]);
  const [outletData, setOutletData] = useState<OutletSummary[]>([]);
  const [questionSummary, setQuestionSummary] = useState<QuestionSummary[]>([]);
  const [selectedBarista, setSelectedBarista] = useState<string | null>(null);
  const [baristaDetails, setBaristaDetails] = useState<PeerReviewSubmission[]>(
    []
  );
  const [timeRange, setTimeRange] = useState("this-month");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardSummary, setDashboardSummary] =
    useState<DashboardSummary | null>(null);
  const [trendData, setTrendData] = useState<ScoreTrend[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    const fetchYears = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${BACKEND_API_URL}/dashboard/peer-review/available-years`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        const years = json.data.map(String);
        setAvailableYears(years);

        // Set default selected year ke tahun terbaru (atau yang pertama)
        setTimeRange(years[0]);
      } else {
        const currentYear = String(new Date().getFullYear());
        setAvailableYears([currentYear]);
        setTimeRange(currentYear); // fallback default
      }
    };

    fetchYears();
  }, []);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  // URL backend Spring Boot
  const BACKEND_API_URL =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    "https://rumahbaristensbe-production.up.railway.app/api";

  // Fungsi untuk mengambil data dari backend
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching dashboard data...");
      console.log("Using API URL:", BACKEND_API_URL);

      // Ambil token dari localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        setError("Token tidak ditemukan. Silakan login kembali.");
        setIsLoading(false);
        loadMockData(); // Fallback ke data mock
        return;
      }

      // Headers untuk request
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      console.log("Headers:", headers);

      try {
        // 1. Fetch questions
        console.log("Fetching peer review questions...");
        const questionsRes = await fetch(
          `${BACKEND_API_URL}/peer-review/questions`,
          {
            headers,
            cache: "no-store",
          }
        ).catch((err) => {
          console.error("Network error fetching questions:", err);
          throw new Error(`Network error: ${err.message}`);
        });

        if (!questionsRes.ok) {
          console.error("Error fetching questions:", questionsRes.status);
          throw new Error(`Error fetching questions: ${questionsRes.status}`);
        }
        const questionsData = await questionsRes.json();
        console.log("Questions data:", questionsData);
        setQuestions(questionsData);

        // 2. Fetch dashboard summary
        console.log("Fetching dashboard summary...");
        const summaryRes = await fetch(
          `${BACKEND_API_URL}/dashboard/peer-review/summary?timeRange=${timeRange}`,
          {
            headers,
          }
        );
        if (!summaryRes.ok) {
          console.error("Error fetching summary:", summaryRes.status);
          throw new Error(`Error fetching summary: ${summaryRes.status}`);
        }
        const summaryData = await summaryRes.json();
        console.log("Summary data:", summaryData.data);
        setDashboardSummary(summaryData.data);

        // 3. Fetch outlet performance
        console.log("Fetching outlet performance...");
        const outletRes = await fetch(
          `${BACKEND_API_URL}/dashboard/peer-review/outlet-performance?timeRange=${timeRange}${
            selectedMonth !== "all" ? `&month=${selectedMonth}` : ""
          }`,
          { headers }
        );
        if (!outletRes.ok) {
          console.error("Error fetching outlet performance:", outletRes.status);
          throw new Error(
            `Error fetching outlet performance: ${outletRes.status}`
          );
        }
        const outletResponse = await outletRes.json();
        console.log("Outlet response:", outletResponse);

        // Check if the response has a data property that's an array
        if (
          outletResponse &&
          outletResponse.data &&
          Array.isArray(outletResponse.data)
        ) {
          setOutletData(outletResponse.data);
        } else if (Array.isArray(outletResponse)) {
          setOutletData(outletResponse);
        } else {
          console.error("Unexpected outlet data format:", outletResponse);
          setOutletData([]);
        }

        // 4. Fetch category performance
        console.log("Fetching category performance...");
        const categoryRes = await fetch(
          `${BACKEND_API_URL}/dashboard/peer-review/category-performance?timeRange=${timeRange}`,
          { headers }
        );
        if (!categoryRes.ok) {
          console.error(
            "Error fetching category performance:",
            categoryRes.status
          );
          throw new Error(
            `Error fetching category performance: ${categoryRes.status}`
          );
        }
        const categoryData = await categoryRes.json();
        console.log("Category data:", categoryData);
        // setQuestionSummary(categoryData);
        setQuestionSummary(
          categoryData && Array.isArray(categoryData.data)
            ? categoryData.data
            : []
        );

        // 5. Fetch baristas
        console.log("Fetching baristas...");
        const baristasRes = await fetch(
          `${BACKEND_API_URL}/dashboard/peer-review/baristas?timeRange=${timeRange}&outlet=${
            filterOutlet !== "all" ? filterOutlet : ""
          }&status=${
            filterStatus !== "all" ? filterStatus : ""
          }&search=${searchQuery}`,
          { headers }
        );
        if (!baristasRes.ok) {
          console.error("Error fetching baristas:", baristasRes.status);
          throw new Error(`Error fetching baristas: ${baristasRes.status}`);
        }
        const baristasData = await baristasRes.json();
        console.log("Baristas data:", baristasData);
        setBaristaData(
          baristasData &&
            baristasData.data &&
            Array.isArray(baristasData.data.content)
            ? baristasData.data.content
            : []
        );
        // 6. Fetch score trend
        console.log("Fetching score trend...");
        const trendRes = await fetch(
          `${BACKEND_API_URL}/dashboard/peer-review/score-trend?timeRange=${timeRange}`,
          { headers }
        );
        if (!trendRes.ok) {
          console.error("Error fetching score trend:", trendRes.status);
          throw new Error(`Error fetching score trend: ${trendRes.status}`);
        }
        const trendData = await trendRes.json();
        console.log("Trend data:", trendData);
        setTrendData(trendData);

        console.log("Dashboard data fetched successfully");
        handleShowToast(
          "Dashboard telah diperbarui dengan data terbaru",
          "success"
        );
      } catch (apiError) {
        console.error("API Error:", apiError);
        setError(
          `Gagal mengambil data: ${
            apiError instanceof Error ? apiError.message : "Unknown error"
          }`
        );

        // Gunakan data mock jika API gagal
        console.log("Using mock data as fallback");
        loadMockData();

        handleShowToast("Menggunakan data contoh sebagai fallback", "error");
      }
    } catch (err) {
      console.error("Error in fetchDashboardData:", err);
      setError(
        `Terjadi kesalahan: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );

      // Gunakan data mock jika terjadi error
      try {
        loadMockData();
        handleShowToast("Menggunakan data contoh sebagai fallback", "warning");
      } catch (mockError) {
        console.error("Error loading mock data:", mockError);
        handleShowToast("Gagal memuat data contoh", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      const username = localStorage.getItem("username");
      const token = localStorage.getItem("token");

      if (!username || !token) {
        setIsLoadingUser(false);
        return;
      }

      try {
        const res = await fetch(`${BACKEND_API_URL}/account/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const json = await res.json();
        const role = json?.data?.role || "";
        setUserRole(role);
      } catch (err) {
        console.error("Gagal mengambil role user:", err);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserRole();
  }, []);

  // Fungsi untuk memuat data mock (sebagai fallback)
  const loadMockData = () => {
    console.log("Loading mock data...");

    // Mock questions
    const mockQuestions: PeerReviewQuestion[] = [
      { questionNumber: 1, text: "Komunikasi" },
      { questionNumber: 2, text: "Pengetahuan produk" },
      { questionNumber: 3, text: "Keterampilan teknis" },
      { questionNumber: 4, text: "Kecepatan pelayanan" },
      { questionNumber: 5, text: "Kebersihan area kerja" },
      { questionNumber: 6, text: "Kerjasama tim" },
      { questionNumber: 7, text: "Ketahanan terhadap tekanan" },
      { questionNumber: 8, text: "Pengetahuan tentang kopi" },
      { questionNumber: 9, text: "Ketelitian" },
      { questionNumber: 10, text: "Inisiatif dan pemecahan masalah" },
    ];

    // Mock barista summary data
    const mockBaristaData: BaristaReviewSummary[] = [
      {
        username: "jesse.pinkman",
        averageScore: 3.7,
        reviewsCompleted: 5,
        reviewsTotal: 5,
        status: "Lulus",
        lastReviewDate: "2025-05-01",
        outlet: "Kemang",
        position: "Barista",
        probationEndDate: "2025-06-15",
        trend: "up",
        trendValue: 0.3,
      },
      {
        username: "todd.alquist",
        averageScore: 2.3,
        reviewsCompleted: 4,
        reviewsTotal: 5,
        status: "Lulus Bersyarat",
        lastReviewDate: "2025-05-02",
        outlet: "Senopati",
        position: "Barista",
        probationEndDate: "2025-06-20",
        trend: "down",
        trendValue: -0.2,
      },
      {
        username: "andrea.cantillo",
        averageScore: 1.8,
        reviewsCompleted: 5,
        reviewsTotal: 5,
        status: "Tidak Lulus",
        lastReviewDate: "2025-05-03",
        outlet: "Kemang",
        position: "Barista",
        probationEndDate: "2025-05-30",
        trend: "down",
        trendValue: -0.5,
      },
      {
        username: "jane.margolis",
        averageScore: 3.2,
        reviewsCompleted: 3,
        reviewsTotal: 5,
        status: "Lulus Bersyarat",
        lastReviewDate: "2025-05-04",
        outlet: "Pondok Indah",
        position: "Barista",
        probationEndDate: "2025-06-10",
        trend: "up",
        trendValue: 0.1,
      },
      {
        username: "gale.boetticher",
        averageScore: 3.9,
        reviewsCompleted: 5,
        reviewsTotal: 5,
        status: "Lulus",
        lastReviewDate: "2025-05-05",
        outlet: "Senopati",
        position: "Barista",
        probationEndDate: "2025-06-25",
        trend: "up",
        trendValue: 0.4,
      },
      {
        username: "skinny.pete",
        averageScore: 2.8,
        reviewsCompleted: 4,
        reviewsTotal: 5,
        status: "Lulus Bersyarat",
        lastReviewDate: "2025-05-06",
        outlet: "Pondok Indah",
        position: "Barista",
        probationEndDate: "2025-06-05",
        trend: "stable",
        trendValue: 0,
      },
      {
        username: "badger",
        averageScore: 0,
        reviewsCompleted: 0,
        reviewsTotal: 5,
        status: "Pending",
        lastReviewDate: "",
        outlet: "Kemang",
        position: "Barista",
        probationEndDate: "2025-07-01",
        trend: "stable",
        trendValue: 0,
      },
      {
        username: "lydia.rodarte",
        averageScore: 3.5,
        reviewsCompleted: 5,
        reviewsTotal: 5,
        status: "Lulus",
        lastReviewDate: "2025-05-07",
        outlet: "Menteng",
        position: "Barista",
        probationEndDate: "2025-06-18",
        trend: "up",
        trendValue: 0.2,
      },
      {
        username: "huell.babineaux",
        averageScore: 2.1,
        reviewsCompleted: 5,
        reviewsTotal: 5,
        status: "Lulus Bersyarat",
        lastReviewDate: "2025-05-08",
        outlet: "Menteng",
        position: "Barista",
        probationEndDate: "2025-06-22",
        trend: "down",
        trendValue: -0.3,
      },
      {
        username: "ted.beneke",
        averageScore: 1.5,
        reviewsCompleted: 5,
        reviewsTotal: 5,
        status: "Tidak Lulus",
        lastReviewDate: "2025-05-09",
        outlet: "Senopati",
        position: "Barista",
        probationEndDate: "2025-05-25",
        trend: "down",
        trendValue: -0.7,
      },
    ];

    // Mock outlet summary data
    const mockOutletData: OutletSummary[] = [
      {
        name: "Kemang",
        averageScore: 2.75,
        baristaCount: 3,
        passRate: 33.33,
        reviewCompletionRate: 66.67,
      },
      {
        name: "Senopati",
        averageScore: 2.57,
        baristaCount: 3,
        passRate: 33.33,
        reviewCompletionRate: 100,
      },
      {
        name: "Pondok Indah",
        averageScore: 3.0,
        baristaCount: 2,
        passRate: 0,
        reviewCompletionRate: 70,
      },
      {
        name: "Menteng",
        averageScore: 2.8,
        baristaCount: 2,
        passRate: 50,
        reviewCompletionRate: 100,
      },
    ];

    // Mock question summary data
    const mockQuestionSummary: QuestionSummary[] = [
      { questionNumber: 1, text: "Komunikasi", averageScore: 3.2 },
      { questionNumber: 2, text: "Pengetahuan produk", averageScore: 2.8 },
      { questionNumber: 3, text: "Keterampilan teknis", averageScore: 2.5 },
      { questionNumber: 4, text: "Kecepatan pelayanan", averageScore: 2.9 },
      { questionNumber: 5, text: "Kebersihan area kerja", averageScore: 3.4 },
      { questionNumber: 6, text: "Kerjasama tim", averageScore: 3.1 },
      {
        questionNumber: 7,
        text: "Ketahanan terhadap tekanan",
        averageScore: 2.6,
      },
      {
        questionNumber: 8,
        text: "Pengetahuan tentang kopi",
        averageScore: 2.7,
      },
      { questionNumber: 9, text: "Ketelitian", averageScore: 3.0 },
      {
        questionNumber: 10,
        text: "Inisiatif dan pemecahan masalah",
        averageScore: 2.4,
      },
    ];

    // Mock detailed review data for a selected barista
    const mockBaristaDetails: PeerReviewSubmission[] = [
      {
        id: 1,
        assignmentId: 101,
        reviewerUsername: "gustavo.fring",
        revieweeUsername: "jesse.pinkman",
        reviewedAt: "2025-04-25",
        q1: 4.0,
        q2: 3.5,
        q3: 4.0,
        q4: 3.5,
        q5: 3.0,
        q6: 4.0,
        q7: 3.5,
        q8: 4.0,
        q9: 3.5,
        q10: 4.0,
      },
      {
        id: 2,
        assignmentId: 102,
        reviewerUsername: "mike.ehrmantraut",
        revieweeUsername: "jesse.pinkman",
        reviewedAt: "2025-04-26",
        q1: 3.5,
        q2: 4.0,
        q3: 3.5,
        q4: 3.0,
        q5: 4.0,
        q6: 3.5,
        q7: 4.0,
        q8: 3.5,
        q9: 4.0,
        q10: 3.5,
      },
      {
        id: 3,
        assignmentId: 103,
        reviewerUsername: "saul.goodman",
        revieweeUsername: "jesse.pinkman",
        reviewedAt: "2025-04-27",
        q1: 4.0,
        q2: 3.5,
        q3: 3.0,
        q4: 4.0,
        q5: 3.5,
        q6: 4.0,
        q7: 3.5,
        q8: 3.0,
        q9: 4.0,
        q10: 3.5,
      },
      {
        id: 4,
        assignmentId: 104,
        reviewerUsername: "walter.white",
        revieweeUsername: "jesse.pinkman",
        reviewedAt: "2025-04-28",
        q1: 3.5,
        q2: 4.0,
        q3: 3.5,
        q4: 4.0,
        q5: 3.5,
        q6: 3.0,
        q7: 4.0,
        q8: 3.5,
        q9: 3.0,
        q10: 4.0,
      },
      {
        id: 5,
        assignmentId: 105,
        reviewerUsername: "skyler.white",
        revieweeUsername: "jesse.pinkman",
        reviewedAt: "2025-04-29",
        q1: 4.0,
        q2: 3.5,
        q3: 4.0,
        q4: 3.5,
        q5: 4.0,
        q6: 3.5,
        q7: 3.0,
        q8: 4.0,
        q9: 3.5,
        q10: 4.0,
      },
    ];

    // Mock trend data
    const mockTrendData = [
      { month: "Jan", score: 2.4 },
      { month: "Feb", score: 2.6 },
      { month: "Mar", score: 2.7 },
      { month: "Apr", score: 2.9 },
      { month: "May", score: 3.1 },
    ];

    // Mock dashboard summary
    const mockDashboardSummary: DashboardSummary = {
      totalBaristas: mockBaristaData.length,
      averageScore: 2.9,
      scoreTrend: 0.2,
      passRate: 30,
      completedReviews: 42,
      totalReviews: 50,
    };

    setQuestions(mockQuestions);
    setBaristaData(mockBaristaData);
    setOutletData(mockOutletData);
    setQuestionSummary(mockQuestionSummary);
    setBaristaDetails(mockBaristaDetails);
    setTrendData(mockTrendData);
    setDashboardSummary(mockDashboardSummary);

    console.log("Mock data loaded");
  };

  const handleShowToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Panggil fetchDashboardData saat komponen dimuat
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Reset month filter ketika timeRange berubah
    setSelectedMonth("all");
  }, [timeRange]);

  // Panggil fetchDashboardData saat filter berubah
  useEffect(() => {
    if (!isLoading) {
      fetchDashboardData();
    }
  }, [timeRange, selectedMonth]);
  // Panggil fetchDashboardData saat filter barista berubah
  useEffect(() => {
    if (!isLoading && !isLoading) {
      const timer = setTimeout(() => {
        fetchDashboardData();
      }, 500); // Debounce untuk mencegah terlalu banyak request

      return () => clearTimeout(timer);
    }
  }, [filterStatus, filterOutlet, searchQuery]);

  // Fungsi untuk export data ke Excel
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      console.log("Exporting data to Excel...");

      // Ambil token dari localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        handleShowToast(
          "Token tidak ditemukan. Silakan login kembali.",
          "error"
        );
        setIsExporting(false);
        return;
      }

      // Headers untuk request
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Panggil API untuk export
      const response = await fetch(
        `${BACKEND_API_URL}/dashboard/peer-review/export?timeRange=${timeRange}&outlet=${
          filterOutlet !== "all" ? filterOutlet : ""
        }&status=${filterStatus !== "all" ? filterStatus : ""}`,
        {
          headers,
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(`Error exporting data: ${response.status}`);
      }

      // Dapatkan blob dari response
      const blob = await response.blob();

      // Buat URL untuk download
      const url = window.URL.createObjectURL(blob);

      // Buat link untuk download
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `peer-review-report-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Tambahkan link ke document
      document.body.appendChild(a);

      // Klik link untuk download
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      handleShowToast("Data telah berhasil diexport ke Excel", "success");
    } catch (err) {
      console.error("Error exporting data:", err);
      handleShowToast(
        `Gagal mengexport data: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Filter baristas based on search, status filter, and outlet filter
  // const filteredBaristas = baristaData.filter((barista) => {
  //   const matchesSearch = barista.username
  //     .toLowerCase()
  //     .includes(searchQuery.toLowerCase());
  //   const matchesStatus =
  //     filterStatus === "all" ||
  //     barista.status.toLowerCase() === filterStatus.toLowerCase();
  //   const matchesOutlet =
  //     filterOutlet === "all" || barista.outlet === filterOutlet;
  //   return matchesSearch && matchesStatus && matchesOutlet;
  // });

  const filteredBaristas = (baristaData || []).filter((barista) => {
    const matchesSearch = barista?.username
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      barista?.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesOutlet =
      filterOutlet === "all" || barista?.outlet === filterOutlet;

    return matchesSearch && matchesStatus && matchesOutlet;
  });

  // Calculate status counts for pie chart
  const statusCounts: ReviewStatusCount[] = [
    {
      name: "Lulus",
      value: baristaData.filter((b) => b.status === "Lulus").length,
      color: "#10b981", // green
    },
    {
      name: "Lulus Bersyarat",
      value: baristaData.filter((b) => b.status === "Lulus Bersyarat").length,
      color: "#f59e0b", // amber
    },
    {
      name: "Tidak Lulus",
      value: baristaData.filter((b) => b.status === "Tidak Lulus").length,
      color: "#ef4444", // red
    },
    {
      name: "Pending",
      value: baristaData.filter((b) => b.status === "Pending").length,
      color: "#6b7280", // gray
    },
  ];

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Lulus":
        return "bg-green-100 text-green-800 border-green-200";
      case "Lulus Bersyarat":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Tidak Lulus":
        return "bg-red-100 text-red-800 border-red-200";
      case "Pending":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Get trend icon and color
  const getTrendIndicator = (trend: string, value: number | undefined) => {
    const safeValue = typeof value === "number" ? value : 0;

    if (trend === "up") {
      return (
        <div className="flex items-center text-green-600">
          <ArrowUpRight className="h-4 w-4 mr-1" />
          <span>+{safeValue.toFixed(1)}</span>
        </div>
      );
    } else if (trend === "down") {
      return (
        <div className="flex items-center text-red-600">
          <ArrowDownRight className="h-4 w-4 mr-1" />
          <span>{safeValue.toFixed(1)}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-600">
          <span>0.0</span>
        </div>
      );
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(".")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // Find top and bottom performers
  const topPerformers = [...baristaData]
    .filter((b) => b.status !== "Pending")
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 3);

  const bottomPerformers = [...baristaData]
    .filter((b) => b.status !== "Pending")
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 3);

  // Find best and worst categories
  const sortedQuestions = Array.isArray(questionSummary)
    ? [...questionSummary].sort((a, b) => b.averageScore - a.averageScore)
    : [];
  const bestCategories = sortedQuestions.slice(0, 3);
  const worstCategories = [...sortedQuestions]
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 3);

  // Calculate outlet performance data for chart
  const outletPerformanceData = outletData.map((outlet) => ({
    name: outlet.name,
    score: outlet.averageScore,
    passRate: outlet.passRate,
  }));

  // Calculate completion percentage
  const calculateCompletionPercentage = (completed: number, total: number) => {
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  // Overall completion rate
  const overallCompletionRate =
    dashboardSummary?.completedReviews != null &&
    dashboardSummary?.totalReviews != null
      ? (dashboardSummary.completedReviews / dashboardSummary.totalReviews) *
        100
      : (baristaData.reduce((sum, b) => sum + b.reviewsCompleted, 0) /
          baristaData.reduce((sum, b) => sum + b.reviewsTotal, 0)) *
        100;

  // Overall pass rate
  const overallPassRate =
    dashboardSummary?.passRate ??
    (baristaData.filter((b) => b.status === "Lulus").length /
      baristaData.filter((b) => b.status !== "Pending").length) *
      100;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-slate-700">
            Loading dashboard data...
          </h3>
        </div>
      </div>
    );
  }
  if (isLoadingUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-gray-600">
          Memuat informasi user...
        </div>
      </div>
    );
  }

  if (!["CLEVEL"].includes(userRole)) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600">
          Anda tidak memiliki akses ke dashboard ini.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-1">
          {/* Main Content */}
          <main className="flex-1 bg-gray-50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-blue-600">
                  Tens Probation Scoring Dashboard
                </h1>
                <div className="flex items-center gap-3">
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          Tahun {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={handleExportData}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        <span>Export</span>
                      </>
                    )}
                  </Button> */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9"
                    onClick={fetchDashboardData}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 mr-2" />
                    <p>{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={fetchDashboardData}
                  >
                    Coba Lagi
                  </Button>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700 mb-2">
                  Hasil Peer Review memiliki peran penting dalam menentukan
                  kelulusan masa percobaan (probation) untuk karyawan baru.
                  Terdapat tiga kategori hasil evaluasi sebagai berikut:
                </p>
                <ol className="list-decimal list-inside ml-4 text-gray-700">
                  <li className="mb-1">
                    <span className="font-medium">Tidak Lulus</span> (Skor
                    rata-rata &lt; 2)
                  </li>
                  <li className="mb-1">
                    <span className="font-medium">Lulus Bersyarat</span> (Skor
                    rata-rata ≥ 2 sampai &lt; 3.5)
                  </li>
                  <li className="mb-1">
                    <span className="font-medium">Lulus</span> (Skor rata-rata ≥
                    3.5)
                  </li>
                </ol>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">
                          Total Barista Probation
                        </p>
                        <h3 className="text-2xl font-bold mt-1">
                          {dashboardSummary
                            ? dashboardSummary.totalBaristas
                            : baristaData.length}
                        </h3>
                      </div>
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-gray-500">
                      <span className="flex-1">Aktif dalam masa probation</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">Rata-rata Skor</p>
                        <h3 className="text-2xl font-bold mt-1">
                          {typeof dashboardSummary?.averageScore === "number" &&
                          !isNaN(dashboardSummary.averageScore)
                            ? dashboardSummary.averageScore.toFixed(1)
                            : baristaData.filter((b) => b.averageScore > 0)
                                .length > 0
                            ? (
                                baristaData.reduce(
                                  (sum, b) => sum + b.averageScore,
                                  0
                                ) /
                                baristaData.filter((b) => b.averageScore > 0)
                                  .length
                              ).toFixed(1)
                            : "0.0"}
                        </h3>
                      </div>
                      <div className="bg-green-100 p-2 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs">
                      <span
                        className={`flex items-center ${
                          typeof dashboardSummary?.scoreTrend === "number" &&
                          dashboardSummary.scoreTrend > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {typeof dashboardSummary?.scoreTrend === "number" ? (
                          dashboardSummary.scoreTrend > 0 ? (
                            <>
                              <ArrowUpRight className="h-3 w-3 mr-1" />+
                              {dashboardSummary.scoreTrend.toFixed(1)}{" "}
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                              {dashboardSummary.scoreTrend.toFixed(1)}{" "}
                            </>
                          )
                        ) : (
                          "0.0"
                        )}
                        dari penambahan nilai sebelumnya
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">
                          Tingkat Kelulusan
                        </p>
                        <h3 className="text-2xl font-bold mt-1">
                          {Math.round(overallPassRate)}%
                        </h3>
                      </div>
                      <div className="bg-amber-100 p-2 rounded-lg">
                        <Coffee className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(overallPassRate)}%</span>
                      </div>
                      <Progress value={overallPassRate} className="h-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">Review Selesai</p>
                        <h3 className="text-2xl font-bold mt-1">
                          {Math.round(overallCompletionRate)}%
                        </h3>
                      </div>
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>
                          {dashboardSummary
                            ? `${dashboardSummary.completedReviews}/${dashboardSummary.totalReviews}`
                            : `${baristaData.reduce(
                                (sum, b) => sum + b.reviewsCompleted,
                                0
                              )}/${baristaData.reduce(
                                (sum, b) => sum + b.reviewsTotal,
                                0
                              )}`}
                        </span>
                      </div>
                      <Progress value={overallCompletionRate} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Dashboard Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Outlet Performance */}
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium">
                          Performa Berdasarkan Outlet
                        </h2>
                        <div className="flex gap-2">
                          {timeRange.match(/^\d{4}$/) && (
                            <Select
                              value={selectedMonth}
                              onValueChange={setSelectedMonth}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Pilih bulan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Semua Bulan</SelectItem>
                                <SelectItem value="1">Januari</SelectItem>
                                <SelectItem value="2">Februari</SelectItem>
                                <SelectItem value="3">Maret</SelectItem>
                                <SelectItem value="4">April</SelectItem>
                                <SelectItem value="5">Mei</SelectItem>
                                <SelectItem value="6">Juni</SelectItem>
                                <SelectItem value="7">Juli</SelectItem>
                                <SelectItem value="8">Agustus</SelectItem>
                                <SelectItem value="9">September</SelectItem>
                                <SelectItem value="10">Oktober</SelectItem>
                                <SelectItem value="11">November</SelectItem>
                                <SelectItem value="12">Desember</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={outletPerformanceData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis dataKey="name" />
                            <YAxis stroke="#3b82f6" domain={[0, 4]} />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="score"
                              name="Rata-rata Skor"
                              fill="#3b82f6"
                              radius={[4, 4, 0, 0]}
                              barSize={30}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Tingkat Kelulusan Chart */}
                      <div className="h-[300px] mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={outletPerformanceData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis dataKey="name" />
                            <YAxis stroke="#f59e0b" domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="passRate"
                              name="Tingkat Kelulusan (%)"
                              fill="#f59e0b"
                              radius={[4, 4, 0, 0]}
                              barSize={30}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {/* <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={outletPerformanceData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis dataKey="name" />
                            <YAxis
                              yAxisId="left"
                              orientation="left"
                              stroke="#3b82f6"
                              domain={[0, 4]}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              stroke="#f59e0b"
                              domain={[0, 100]}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar
                              yAxisId="left"
                              dataKey="score"
                              name="Rata-rata Skor"
                              fill="#3b82f6"
                              radius={[4, 4, 0, 0]}
                              barSize={30}
                            />
                            <Bar
                              yAxisId="right"
                              dataKey="passRate"
                              name="Tingkat Kelulusan (%)"
                              fill="#f59e0b"
                              radius={[4, 4, 0, 0]}
                              barSize={30}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div> */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {Array.isArray(outletData) ? (
                          outletData.map((outlet) => (
                            <div
                              key={outlet.name}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
                              <div className="flex items-center mb-1">
                                <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                                <h3 className="font-medium">{outlet.name}</h3>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-gray-500">Skor</p>
                                  <p className="font-medium">
                                    {typeof outlet.averageScore === "number"
                                      ? outlet.averageScore.toFixed(1)
                                      : "0.0"}{" "}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Lulus</p>
                                  <p className="font-medium">
                                    {typeof outlet.passRate === "number"
                                      ? outlet.passRate.toFixed(0) + "%"
                                      : "0%"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-4 text-center py-4 text-gray-500">
                            Data outlet tidak tersedia
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trend Over Time */}
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <h2 className="text-lg font-medium mb-4">
                        Tren Skor Peer Review
                      </h2>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={trendData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id="colorScore"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" />
                            <YAxis domain={[0, 4]} />
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="score"
                              stroke="#3b82f6"
                              fillOpacity={1}
                              fill="url(#colorScore)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-between items-center mt-4 text-sm">
                        <div>
                          <span className="text-gray-500">
                            Rata-rata 6 bulan:
                          </span>
                          <span className="font-medium ml-1">
                            {trendData.length > 0
                              ? (
                                  trendData.reduce(
                                    (sum, item) => sum + (item.score || 0),
                                    0
                                  ) / trendData.length
                                ).toFixed(2)
                              : "0.0"}
                          </span>
                        </div>
                        {/* <div className="flex items-center text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span>
                            {trendData.data?.length > 1
                              ? `${(
                                  trendData.data[trendData.data.length - 1]
                                    .score - trendData.data[0].score
                                ).toFixed(1)} peningkatan`
                              : "+0.0 peningkatan"}
                          </span>
                        </div> */}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category Performance */}
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <h2 className="text-lg font-medium mb-4">
                        Performa Berdasarkan Kategori
                      </h2>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={questionSummary}
                            layout="vertical"
                            margin={{ top: 25, right: 0, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              horizontal={true}
                              vertical={false}
                            />
                            <XAxis type="number" domain={[0, 4]} />
                            <YAxis
                              dataKey="text"
                              type="category"
                              width={300}
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip />
                            <Bar
                              dataKey="averageScore"
                              name="Rata-rata Skor"
                              fill="#3b82f6"
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Status Distribution */}
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <h2 className="text-lg font-medium mb-4">
                        Distribusi Status
                      </h2>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusCounts}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => {
                                const percentText = `${(percent * 100).toFixed(
                                  0
                                )}%`;
                                return `${name}\n${percentText}`;
                              }}
                              labelLine={false}
                            >
                              {statusCounts.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => [
                                `${value} barista`,
                                "Jumlah",
                              ]}
                              contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {statusCounts.map((status) => (
                          <div key={status.name} className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: status.color }}
                            ></div>
                            <span className="text-sm">
                              {status.name}: {status.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Performers */}
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <h2 className="text-lg font-medium mb-4">
                        Barista Terbaik
                      </h2>
                      <div className="space-y-3">
                        {topPerformers.map((barista, index) => (
                          <div
                            key={barista.username}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center">
                              <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {barista.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {barista.outlet}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {typeof barista.averageScore === "number"
                                  ? barista.averageScore.toFixed(1)
                                  : "0.0"}{" "}
                              </p>
                              {getTrendIndicator(
                                barista.trend,
                                barista.trendValue
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bottom Performers */}
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <h2 className="text-lg font-medium mb-4">
                        Barista Terendah
                      </h2>
                      <div className="space-y-3">
                        {bottomPerformers.map((barista, index) => (
                          <div
                            key={barista.username}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center">
                              <div className="bg-red-100 text-red-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {barista.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {barista.outlet}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {typeof barista.averageScore === "number"
                                  ? barista.averageScore.toFixed(1)
                                  : "0.0"}
                              </p>
                              {getTrendIndicator(
                                barista.trend,
                                barista.trendValue
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Best & Worst Categories */}
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <Tabs defaultValue="best">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="best">
                            Kategori Terbaik
                          </TabsTrigger>
                          <TabsTrigger value="worst">
                            Kategori Terendah
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="best">
                          <div className="space-y-3">
                            {bestCategories.map((category, index) => (
                              <div
                                key={category.questionNumber}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center">
                                  <div className="bg-green-100 text-green-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                                    {index + 1}
                                  </div>
                                  <p className="font-medium">{category.text}</p>
                                </div>
                                <p className="font-bold">
                                  {typeof category.averageScore === "number"
                                    ? category.averageScore.toFixed(1)
                                    : "0.0"}{" "}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="worst">
                          <div className="space-y-3">
                            {worstCategories.map((category, index) => (
                              <div
                                key={category.questionNumber}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center">
                                  <div className="bg-red-100 text-red-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                                    {index + 1}
                                  </div>
                                  <p className="font-medium">{category.text}</p>
                                </div>
                                <p className="font-bold">
                                  {typeof category.averageScore === "number"
                                    ? category.averageScore.toFixed(1)
                                    : "0.0"}{" "}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Barista Table */}
              <Card className="bg-white mt-6">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">
                      Daftar Barista Probation
                    </h2>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Cari barista..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 w-[200px]"
                        />
                      </div>
                      <Select
                        value={filterOutlet}
                        onValueChange={setFilterOutlet}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Filter outlet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Outlet</SelectItem>
                          {outletData.map((outlet) => (
                            <SelectItem key={outlet.name} value={outlet.name}>
                              {outlet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={filterStatus}
                        onValueChange={setFilterStatus}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="lulus">Lulus</SelectItem>
                          <SelectItem value="lulus bersyarat">
                            Lulus Bersyarat
                          </SelectItem>
                          <SelectItem value="tidak lulus">
                            Tidak Lulus
                          </SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Barista</TableHead>
                          <TableHead>Outlet</TableHead>
                          <TableHead className="text-center">
                            Progress
                          </TableHead>
                          <TableHead className="text-center">Skor</TableHead>
                          <TableHead className="text-center">Trend</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBaristas.length > 0 ? (
                          filteredBaristas.map((barista) => (
                            <TableRow
                              key={barista.username}
                              className="hover:bg-blue-50"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2 bg-blue-100">
                                    <AvatarFallback className="text-xs text-blue-600">
                                      {getInitials(barista.username)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate">
                                    {barista.username}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{barista.outlet}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full"
                                      style={{
                                        width:
                                          barista.reviewsTotal === 0
                                            ? "0%"
                                            : `${calculateCompletionPercentage(
                                                barista.reviewsCompleted,
                                                barista.reviewsTotal
                                              )}%`,
                                      }}
                                    ></div>
                                  </div>
                                  {/* <span className="text-xs text-gray-500">
                                    {barista.reviewsCompleted}/
                                    {barista.reviewsTotal}
                                  </span> */}
                                  <span className="text-xs text-gray-500">
                                    {barista.reviewsTotal === 0
                                      ? "-"
                                      : `${barista.reviewsCompleted}/${barista.reviewsTotal}`}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {barista.status === "Pending" ? (
                                  <span className="text-gray-400">N/A</span>
                                ) : (
                                  <span className="font-medium">
                                    {typeof barista.averageScore === "number"
                                      ? barista.averageScore.toFixed(1)
                                      : "0.0"}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {barista.status === "Pending" ? (
                                  <span className="text-gray-400">-</span>
                                ) : (
                                  getTrendIndicator(
                                    barista.trend,
                                    barista.trendValue
                                  )
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  className={`${getStatusColor(
                                    barista.status
                                  )}`}
                                >
                                  {barista.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-6 text-gray-500"
                            >
                              Tidak ada barista yang sesuai dengan kriteria
                              pencarian
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
