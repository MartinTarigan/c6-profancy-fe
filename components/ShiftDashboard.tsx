/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import Toast from "@/components/Toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AlertCircle, Clock, MapPin, User, CalendarIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import LoadingIndicator from "./LoadingIndicator";

// Types based on backend models
interface ShiftDetail {
  shiftType: number;
  outletName: string;
  shiftTime: string;
  isOvertime: boolean;
}

interface ShiftSummary {
  targetDays: number;
  completedDays: number;
  overtimeHours: number;
  remainingDays: number;
  progress: string;
  calendarData: Record<string, ShiftDetail>;
}

interface ShiftScheduleResponseDto {
  createdAt: string | number | Date;
  shiftScheduleId: number;
  shiftType: number;
  dateShift: string;
  outletId: number;
  outletName: string;
  headBarId: string;
  headBarName: string;
  baristas: {
    id: string;
    fullName: string;
    role: string;
  }[];
}

// Add interface for overtime logs
interface OvertimeLogResponse {
  id: number;
  baristaId: number;
  userId: string;
  outletId: number;
  dateOvertime: string;
  startHour: string;
  duration: string;
  reason: string;
  status: string;
}

// Add these helper functions at the top of the component (after the interfaces)
// Add these functions to get date ranges for current and previous months
const getCurrentMonthDateRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: format(firstDay, "yyyy-MM-dd"),
    endDate: format(lastDay, "yyyy-MM-dd"),
  };
};

const getPreviousMonthDateRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    startDate: format(firstDay, "yyyy-MM-dd"),
    endDate: format(lastDay, "yyyy-MM-dd"),
  };
};

export default function ShiftDashboard() {
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("current");
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShiftDetails, setSelectedShiftDetails] = useState<
    ShiftScheduleResponseDto[] | null
  >(null);
  const [showShiftDetail, setShowShiftDetail] = useState(false);
  const [invalidPeriod, setInvalidPeriod] = useState(false);
  const [todayShift, setTodayShift] = useState<ShiftScheduleResponseDto | null>(
    null
  );
  const [upcomingShifts, setUpcomingShifts] = useState<
    ShiftScheduleResponseDto[]
  >([]);
  const [userId, setUserId] = useState<string>("");
  const [token, setToken] = useState<string>(""); // Store JWT token
  const [dataFetched, setDataFetched] = useState(false); // Track if data has been fetched
  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeLogResponse[]>([]); // Store overtime logs
  const [activeOvertimeHours, setActiveOvertimeHours] = useState(0); // Store calculated active overtime hours

  // Initialize userId from JWT token
  useEffect(() => {
    console.log("Checking localStorage for token...");

    // Check if we're in the browser
    if (typeof window === "undefined") {
      console.log("Running on server side, localStorage not available");
      return;
    }

    const storedToken = localStorage.getItem("token");
    console.log(
      "localStorage token:",
      storedToken ? "Token exists" : "Token missing"
    );

    if (storedToken) {
      console.log("Setting token from localStorage");
      setToken(storedToken);

      try {
        // Decode the JWT token to get the user information
        const tokenPayload = parseJwt(storedToken);
        console.log("Token payload:", tokenPayload);

        // Log the full payload to see all available fields
        console.log(
          "Full token payload:",
          JSON.stringify(tokenPayload, null, 2)
        );

        // Look for common ID fields in the token payload
        // Try different possible field names for the user ID
        if (tokenPayload && tokenPayload.id) {
          console.log("Setting userId from token id:", tokenPayload.id);
          setUserId(tokenPayload.id);
        } else if (tokenPayload && tokenPayload.userId) {
          console.log("Setting userId from token userId:", tokenPayload.userId);
          setUserId(tokenPayload.userId);
        } else if (tokenPayload && tokenPayload.sub) {
          console.log("Setting userId from token sub:", tokenPayload.sub);
          setUserId(tokenPayload.sub);
        } else if (tokenPayload && tokenPayload.user_id) {
          console.log(
            "Setting userId from token user_id:",
            tokenPayload.user_id
          );
          setUserId(tokenPayload.user_id);
        } else {
          console.error("User ID not found in token payload");
          setError(
            "User ID tidak ditemukan dalam token. Silakan login kembali."
          );
          setLoading(false);
        }
      } catch (err) {
        console.error("Error parsing JWT token:", err);
        setError("Token tidak valid. Silakan login kembali.");
        setLoading(false);
      }
    } else {
      console.error("Token not found in localStorage");
      setError("Token tidak ditemukan. Silakan login kembali.");
      setLoading(false);
    }
  }, []);

  // Function to parse JWT token
  const parseJwt = (token: string) => {
    try {
      // Split the token and get the payload part (second part)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Failed to parse JWT token:", e);
      return null;
    }
  };

  useEffect(() => {
    if (userId && token) {
      fetchShiftSummary();
      fetchTodayShift();
      fetchUpcomingShifts();
      fetchOvertimeLogs(); // Fetch overtime logs
    }
  }, [period, userId, token]);

  // Calculate active overtime hours whenever overtime logs change
  useEffect(() => {
    calculateActiveOvertimeHours();
  }, [overtimeLogs]);

  const calculateActiveOvertimeHours = (logs = overtimeLogs) => {
    // Filter out CANCELLED overtime logs
    const activeLogs = logs.filter((log) => log.status !== "CANCELLED");

    // Calculate total hours from active logs
    let totalHours = 0;
    activeLogs.forEach((log) => {
      // Parse duration (assuming format like "02:00:00" for 2 hours)
      const hours = Number.parseInt(log.duration.split(":")[0], 10) || 0;
      totalHours += hours;
    });

    setActiveOvertimeHours(totalHours);

    // If we have summary data, update it with the new overtime hours
    if (summary) {
      setSummary({
        ...summary,
        overtimeHours: totalHours,
      });
    }

    console.log(
      `Active overtime hours calculated for ${period} period:`,
      totalHours
    );
  };

  const fetchShiftSummary = async () => {
    setLoading(true);
    setError(null);
    setInvalidPeriod(false);

    try {
      console.log(`Fetching data for userId: ${userId}, period: ${period}`);
      const response = await fetch(
        `http://localhost:8080/api/shift/personal-summary?userId=${userId}&period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          setInvalidPeriod(true);
          setLoading(false);
          setToast({
            type: "warning",
            message: "Periode tidak valid. Silakan pilih periode yang benar.",
          });
          return;
        } else if (response.status === 404 || response.status === 204) {
          // Treat 404 or 204 (No Content) as "no data"
          setSummary(null);
          setDataFetched(true); // Mark that we've fetched data, even if it's empty
          setLoading(false);
          return;
        }
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      // Store the original data but we'll update the overtime hours later
      setSummary(data);
      setDataFetched(true); // Mark that we've fetched data successfully

      const currentDate = new Date();
      let monthName;

      if (period === "current") {
        //sahabattensbe-production-0c07.up.railway.app
        https: monthName = format(currentDate, "MMMM yyyy", { locale: id });
      } else if (period === "previous") {
        const previousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1
        );
        monthName = format(previousMonth, "MMMM yyyy", { locale: id });
      } else if (period.match(/\d{1,2}-\d{4}/)) {
        const [month, year] = period.split("-");
        const date = new Date(
          Number.parseInt(year),
          Number.parseInt(month) - 1,
          1
        );
        monthName = format(date, "MMMM yyyy", { locale: id });
      } else {
        monthName = period;
      }
    } catch (err) {
      console.error("Error fetching shift summary:", err);

      setToast({
        type: "error",
        message: "Gagal memuat data. Silakan coba lagi",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch overtime logs
  const fetchOvertimeLogs = async () => {
    try {
      // Get date range based on selected period
      const dateRange =
        period === "current"
          ? getCurrentMonthDateRange()
          : getPreviousMonthDateRange();

      console.log(
        `Fetching overtime logs for period: ${period}, date range:`,
        dateRange
      );

      const response = await fetch(
        `http://localhost:8080/api/overtime-logs/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const logs = await response.json();
      console.log("All overtime logs:", logs);

      // Filter logs based on the selected period's date range
      const filteredLogs = logs.filter((log: { dateOvertime: any }) => {
        const logDate = log.dateOvertime;
        return logDate >= dateRange.startDate && logDate <= dateRange.endDate;
      });

      console.log(`Filtered overtime logs for ${period} period:`, filteredLogs);
      setOvertimeLogs(filteredLogs);

      // Calculate active overtime hours after fetching logs
      calculateActiveOvertimeHours(filteredLogs);
    } catch (err) {
      console.error("Error fetching overtime logs:", err);
    }
  };

  const fetchTodayShift = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const response = await fetch(
        `http://localhost:8080/api/shift/detail?userId=${userId}&date=${today}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const shifts = await response.json();
      if (shifts && shifts.length > 0) {
        setTodayShift(shifts[0]);
      } else {
        setTodayShift(null);
      }
    } catch (err) {
      console.error("Error fetching today's shift:", err);
    }
  };

  const fetchUpcomingShifts = async () => {
    try {
      const today = new Date();
      const startDate = format(today, "yyyy-MM-dd");
      const endDate = format(
        new Date(today.setDate(today.getDate() + 30)),
        "yyyy-MM-dd"
      );

      let outletId = 1;
      if (todayShift) {
        outletId = todayShift.outletId;
      }

      const response = await fetch(
        `http://localhost:8080/api/shift/s/${outletId}?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const shifts = await response.json();
      const userShifts = shifts.filter((shift: ShiftScheduleResponseDto) =>
        shift.baristas.some((barista) => barista.id === userId)
      );

      // Group shifts by date and get only the latest updated one per day
      const latestShiftsByDay = new Map<string, ShiftScheduleResponseDto>();

      userShifts.forEach((shift: ShiftScheduleResponseDto) => {
        const shiftDate = new Date(shift.dateShift).toISOString().split("T")[0];

        if (!latestShiftsByDay.has(shiftDate)) {
          latestShiftsByDay.set(shiftDate, shift);
        } else {
          const existingShift = latestShiftsByDay.get(shiftDate)!;

          // Compare createdAt timestamps and keep the more recent one
          const existingCreatedAt = new Date(existingShift.createdAt).getTime();
          const currentCreatedAt = new Date(shift.createdAt).getTime();

          if (currentCreatedAt > existingCreatedAt) {
            latestShiftsByDay.set(shiftDate, shift);
          }
        }
      });

      // Convert map values back to array
      const filteredUserShifts = Array.from(latestShiftsByDay.values());

      // Sort by date
      filteredUserShifts.sort(
        (a: ShiftScheduleResponseDto, b: ShiftScheduleResponseDto) => {
          return (
            new Date(a.dateShift).getTime() - new Date(b.dateShift).getTime()
          );
        }
      );

      setUpcomingShifts(filteredUserShifts);
    } catch (err) {
      console.error("Error fetching upcoming shifts:", err);
    }
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, "yyyy-MM-dd");

    try {
      const response = await fetch(
        `http://localhost:8080/api/shift/detail?userId=${userId}&date=${dateStr}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const shifts = await response.json();

      if (shifts && shifts.length > 0) {
        setSelectedShiftDetails(shifts);
        setShowShiftDetail(true);
      } else {
        setToast({
          type: "warning",
          message: "Tidak ada jadwal shift pada tanggal ini",
        });
      }
    } catch (err) {
      console.error("Error fetching shift details:", err);
      setToast({
        type: "error",
        message: "Gagal memuat detail shift",
      });
    }
  };

  // Check if a date has active overtime (excluding CANCELLED and REJECTED logs)
  const hasActiveOvertime = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return overtimeLogs.some(
      (log) =>
        log.dateOvertime === dateStr &&
        log.status !== "CANCELLED" &&
        log.status !== "REJECTED"
    );
  };

  // Update the getDayClassName function to only mark active overtime days
  const getDayClassName = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const shift = summary?.calendarData?.[dateStr];

    if (!shift) return "";

    // Check if this date has active overtime from the overtime logs
    if (hasActiveOvertime(date)) {
      return "bg-green-100 text-green-800 font-medium rounded-full";
    }

    return "bg-[#E6EBFF] text-[#3C67FF] font-medium rounded-full";
  };

  const getShiftTimeByType = (shiftType: number) => {
    return shiftType === 1 ? "07:00 - 15:00" : "15:00 - 23:00";
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <main className="flex-1 overflow-y-auto p-4">
        <div className="py-6">
          {toast && (
            <Toast
              type={toast.type}
              message={toast.message}
              onClose={() => setToast(null)}
              duration={3000}
            />
          )}
          <Tabs defaultValue="ringkasan-pribadi">
            <TabsContent value="ringkasan-pribadi">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold">Dashboard Pribadi</h1>
                  <p className="text-muted-foreground">
                    Ringkasan informasi shift dan jadwal kerja Anda
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Periode</span>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger
                      className={`w-[180px] ${
                        invalidPeriod ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Pilih Periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Bulan Ini</SelectItem>
                      <SelectItem value="previous">Bulan Lalu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {invalidPeriod && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Validasi</AlertTitle>
                  <AlertDescription>Pilih periode yang valid</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={fetchShiftSummary}
                  >
                    Coba Lagi
                  </Button>
                </Alert>
              )}

              {loading ? (
                <LoadingIndicator />
              ) : error ? (
                // Show specific error message
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={fetchShiftSummary}
                  >
                    Coba Lagi
                  </Button>
                </Alert>
              ) : summary ? (
                // Show summary data (existing code)
                <div
                  className={`grid grid-cols-1 ${
                    period === "previous" ? "md:grid-cols-2" : "md:grid-cols-3"
                  } gap-6`}
                >
                  {/* Today's Shift Card - Only show for current month */}
                  {period !== "previous" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-[#3C67FF]" />
                          Todays Shift
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {todayShift ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-[#E6EBFF] p-2 rounded-full">
                                <Clock className="h-5 w-5 text-[#3C67FF]" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Shift Hours
                                </p>
                                <p className="font-medium">
                                  {getShiftTimeByType(todayShift.shiftType)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="bg-[#E6EBFF] p-2 rounded-full">
                                <MapPin className="h-5 w-5 text-[#3C67FF]" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Outlet Location
                                </p>
                                <p className="font-medium">
                                  {todayShift.outletName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="bg-[#E6EBFF] p-2 rounded-full">
                                <User className="h-5 w-5 text-[#3C67FF]" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Position
                                </p>
                                <p className="font-medium">
                                  {todayShift.baristas.find(
                                    (b) => b.id === userId
                                  )?.role || "Barista"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-32 text-center">
                            <p className="text-muted-foreground">
                              Tidak ada shift hari ini
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Nikmati waktu istirahat Anda
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Target Hari Kerja Card - Always show */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-[#3C67FF]" />
                        Target Hari Kerja
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-4xl font-bold text-[#3C67FF]">
                            {summary.completedDays}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Hari kerja selesai
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-bold">
                            {summary.targetDays}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Target hari
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(
                              (summary.completedDays / summary.targetDays) * 100
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            (summary.completedDays / summary.targetDays) * 100
                          }
                          className="h-2"
                        />
                        <p className="text-sm text-muted-foreground">
                          Sisa {summary.remainingDays} hari kerja bulan ini
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Days Breakdown Card - Always show */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-[#3C67FF]" />
                        Days Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Pie Chart for Regular Days and Remaining Days */}
                      <div className="h-[150px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Regular Days",
                                  value: summary.completedDays,
                                  color: "#3C67FF",
                                },
                                {
                                  name: "Remaining Days",
                                  value: summary.remainingDays,
                                  color: "#E5E7EB",
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={0}
                              outerRadius={60}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ value }) => value}
                            >
                              {[{ color: "#3C67FF" }, { color: "#E5E7EB" }].map(
                                (entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                )
                              )}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex justify-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-[#3C67FF]"></div>
                          <span className="text-xs">Regular Days</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-[#E5E7EB]"></div>
                          <span className="text-xs">Remaining Days</span>
                        </div>
                      </div>

                      {/* Radial Gauge Chart for Overtime Hours */}
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">
                          Overtime Hours
                        </h3>
                        <div className="h-[180px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                              cx="50%"
                              cy="50%"
                              innerRadius="60%"
                              outerRadius="80%"
                              barSize={10}
                              data={[
                                {
                                  name: "Overtime",
                                  hours: activeOvertimeHours || 0, // Use active overtime hours
                                  fill: "#4ADE80",
                                },
                              ]}
                              startAngle={180}
                              endAngle={0}
                            >
                              <PolarAngleAxis
                                type="number"
                                domain={[0, 10]}
                                angleAxisId={0}
                                tick={false}
                              />
                              <RadialBar
                                background
                                dataKey="hours"
                                cornerRadius={10}
                                fill="#4ADE80"
                              />
                              <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-2xl font-bold"
                                fill="#4ADE80"
                              >
                                {activeOvertimeHours || 0}
                              </text>
                              <text
                                x="50%"
                                y="65%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-xs"
                                fill="#6B7280"
                              >
                                hours
                              </text>
                            </RadialBarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center mt-2">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-[#4ADE80]"></div>
                            <span className="text-xs">
                              Total Overtime: {activeOvertimeHours || 0} hours
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upcoming Shifts Card - Only show for current month */}
                  {period !== "previous" && (
                    <Card
                      className={`${
                        period === "previous" ? "" : "md:col-span-3"
                      }`}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CalendarIcon className="h-5 w-5 text-[#3C67FF]" />
                          Upcoming Shifts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {upcomingShifts.length > 0 ? (
                          <div className="space-y-6">
                            {upcomingShifts.map((shift, index) => {
                              const shiftDate = new Date(shift.dateShift);
                              const formattedDate = format(
                                shiftDate,
                                "EEEE, d MMMM yyyy",
                                { locale: id }
                              );
                              const userRole =
                                shift.baristas.find((b) => b.id === userId)
                                  ?.role || "Barista";

                              return (
                                <div
                                  key={index}
                                  className="border-b pb-4 last:border-0 last:pb-0"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <p className="font-medium">
                                      {formattedDate}
                                    </p>
                                    <Badge variant="outline">{userRole}</Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4 text-[#3C67FF]" />
                                      <span>
                                        {getShiftTimeByType(shift.shiftType)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4 text-[#3C67FF]" />
                                      <span>{shift.outletName}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-32 text-center">
                            <p className="text-muted-foreground">
                              Tidak ada jadwal shift mendatang
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : dataFetched ? (
                // Show "No data" message only when we've fetched data but it's empty
                <Alert className="mb-4">
                  <AlertTitle>Tidak ada data</AlertTitle>
                  <AlertDescription>
                    Belum ada data shift untuk bulan ini
                  </AlertDescription>
                </Alert>
              ) : !userId || !token ? (
                // Show authentication error
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Authentication Error</AlertTitle>
                  <AlertDescription>
                    {!userId
                      ? "User ID tidak ditemukan."
                      : "Token tidak ditemukan."}{" "}
                    Silakan login kembali.
                  </AlertDescription>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.location.href = "/login";
                      }
                    }}
                  >
                    Login
                  </Button>
                </Alert>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
