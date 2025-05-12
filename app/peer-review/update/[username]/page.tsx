"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarIcon,
  Users,
  Clock,
  CheckCircle2,
  Save,
  Loader2,
  AlertCircle,
  X,
  Info,
  UserPlus,
  User,
  CalendarDays,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function UpdatePeerReview() {
  const router = useRouter();
  const search = useSearchParams();
  const params = useParams();
  const endDate = search.get("endDate");
  if (!endDate) throw new Error("Missing params");

  const [deadline, setDeadline] = useState<Date>(() => new Date(endDate));
  const [allReviewers, setAllReviewers] = useState<string[]>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [newReviewer, setNewReviewer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    async function load() {
      try {
        setIsLoading(true);
        // 1. get assignments for this reviewee
        const res = await fetch(
          `http://localhost:8080/api/trainee/peer-review-assignment/by-reviewee/${params.username}`,
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data: Array<{
          reviewerUsername: string;
          endDateFill: string;
        }> = json.data;
        // filter by endDate
        const here = data
          .filter((a) => endDate && a.endDateFill.startsWith(endDate))
          .map((a) => a.reviewerUsername);
        setAssigned(here);

        // 2. fetch full list of baristas for dropdown
        const reviewersResponse = await fetch(
          "http://localhost:8080/api/trainee/peer-review-assignment/reviewers",
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );
        if (!reviewersResponse.ok) {
          throw new Error(
            `Error fetching reviewers: ${reviewersResponse.status}`
          );
        }
        const reviewersData = await reviewersResponse.json();
        setAllReviewers(reviewersData.data || []);
      } catch (e: unknown) {
        // Check if the error is an instance of Error
        if (e instanceof Error) {
          setToast({ type: "error", message: e.message });
        } else {
          setToast({ type: "error", message: "An unknown error occurred" });
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.username, endDate]);

  const handleAdd = () => {
    if (newReviewer && !assigned.includes(newReviewer)) {
      setAssigned([...assigned, newReviewer]);
    }
    setNewReviewer("");
  };

  const handleRemove = (u: string) => {
    setAssigned(assigned.filter((x) => x !== u));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(
        `http://localhost:8080/api/trainee/peer-review-assignment/update/${params.username}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reviewerUsernames: assigned,
            endDateFill: format(deadline, "yyyy-MM-dd"),
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Save failed");
      }
      setToast({ type: "success", message: "Saved successfully!" });
      setTimeout(() => router.push("/peer-review"), 1500);
      // } catch (e: unknown) {
      //   setToast({ type: "error", message: e.message })
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate days remaining or overdue
  const getDaysStatus = () => {
    const end = deadline;
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)} days overdue`,
        color: "text-red-600",
        bgColor: "bg-red-50",
        progress: 100,
      };
    } else if (diffDays === 0) {
      return {
        text: "Due today",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        progress: 95,
      };
    } else if (diffDays <= 3) {
      return {
        text: `${diffDays} days remaining`,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        progress: 80,
      };
    } else {
      return {
        text: `${diffDays} days remaining`,
        color: "text-green-600",
        bgColor: "bg-green-50",
        progress: 50,
      };
    }
  };

  const daysStatus = getDaysStatus();
  const isDeadlinePassed = new Date() > deadline;

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  // Get random color for avatar based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-green-100 text-green-700",
      "bg-purple-100 text-purple-700",
      "bg-amber-100 text-amber-700",
      "bg-rose-100 text-rose-700",
      "bg-cyan-100 text-cyan-700",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-slate-700">Loading...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 p-3 sm:p-4 md:p-6">
      {/* Toast Notification - Fully Responsive */}
      {toast && (
        <div className="fixed top-4 right-4 left-4 z-50 animate-in fade-in slide-in-from-top-5 max-w-md mx-auto">
          <Alert
            //variant={toast.type === "error" ? "destructive" : toast.type === "success" ? "default" : "outline"}
            className={`
              ${
                toast.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : ""
              }
              ${
                toast.type === "info"
                  ? "border-blue-200 bg-blue-50 text-blue-800"
                  : ""
              }
              shadow-md
            `}
          >
            <div className="flex items-center">
              {toast.type === "success" && (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              {toast.type === "info" && <Info className="h-4 w-4 mr-2" />}
              <div>
                <AlertTitle className="text-sm font-medium">
                  {toast.type === "success"
                    ? "Success"
                    : toast.type === "error"
                    ? "Error"
                    : "Information"}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  {toast.message}
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 w-6 p-0"
                onClick={() => setToast(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Alert>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto">
        {/* Header - Responsive */}
        <div className="bg-white rounded-xl shadow-sm mb-4 sm:mb-6 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center mb-3 sm:mb-4">
              <Link href="/peer-review" className="group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 group-hover:bg-slate-100 h-8 px-2 sm:px-3"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span className="hidden xs:inline">Back</span>
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                  Peer Review Details
                </h1>
                <p className="text-sm text-slate-500 mt-0.5 sm:mt-1">
                  Managing review for{" "}
                  <span className="font-medium text-slate-700">
                    {params.username}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start mt-2 sm:mt-0">
                <Badge
                  className={`px-2 py-1 text-xs ${
                    isDeadlinePassed
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {isDeadlinePassed ? "Deadline Passed" : "Active"}
                </Badge>

                <Badge
                  variant="outline"
                  className="px-2 py-1 text-xs bg-blue-50 border-blue-100"
                >
                  <Users className="h-3 w-3 mr-1" />
                  {assigned.length} Reviewers
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Reviewee Info */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm h-full">
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center">
                  <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Reviewee Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Details about the person being reviewed
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3 space-y-4 sm:space-y-6">
                <div className="flex items-center p-3 rounded-lg border bg-slate-50">
                  <Avatar
                    className={`h-10 w-10 sm:h-12 sm:w-12 mr-3 ${getAvatarColor(
                      params.username as string
                    )}`}
                  >
                    <AvatarFallback>
                      {getInitials(params.username as string)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{params.username}</p>
                    <p className="text-xs sm:text-sm text-slate-500">Barista</p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="deadline"
                        className="text-xs sm:text-sm font-medium text-slate-700"
                      >
                        Review Deadline
                      </label>
                      <Badge
                        className={`${daysStatus.bgColor} ${daysStatus.color} text-xs`}
                      >
                        {daysStatus.text}
                      </Badge>
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="deadline"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deadline
                            ? format(deadline, "PPP")
                            : "Select deadline"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={deadline}
                          onSelect={(date) => date && setDeadline(date)}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="pt-1 sm:pt-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Progress</span>
                      <span>{daysStatus.progress}%</span>
                    </div>
                    <Progress value={daysStatus.progress} className="h-2" />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4">
                  <div className="flex">
                    <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-800 text-xs sm:text-sm">
                        Important Dates
                      </h4>
                      <div className="mt-1 sm:mt-2 space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Due Date:</span>
                          <span className="font-medium text-blue-800">
                            {format(deadline, "d MMM yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Reviewers */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base sm:text-lg flex items-center">
                      <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      Assigned Reviewers
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Manage baristas assigned to review {params.username}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-xs">
                    {assigned.length} reviewers
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3 space-y-4 sm:space-y-6">
                {/* Reviewer List - Responsive Grid */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-50 p-2 sm:p-3 border-b flex justify-between items-center">
                    <h3 className="font-medium text-xs sm:text-sm text-slate-700">
                      Reviewer List
                    </h3>
                    <span className="text-xs text-slate-500">
                      {assigned.length} assigned
                    </span>
                  </div>
                  <div className="max-h-[250px] sm:max-h-[300px] overflow-y-auto p-2 sm:p-3">
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                      {assigned.length > 0 ? (
                        assigned.map((reviewer) => (
                          <div
                            key={reviewer}
                            className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center min-w-0">
                              <Avatar
                                className={`h-7 w-7 sm:h-8 sm:w-8 mr-2 sm:mr-2.5 ${getAvatarColor(
                                  reviewer
                                )}`}
                              >
                                <AvatarFallback>
                                  {getInitials(reviewer)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-xs sm:text-sm truncate">
                                {reviewer}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 ml-1 flex-shrink-0"
                              onClick={() => handleRemove(reviewer)}
                            >
                              <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 sm:py-8 border border-dashed rounded-lg col-span-full">
                          <Users className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2" />
                          <h4 className="text-xs sm:text-sm font-medium text-slate-700">
                            No reviewers assigned
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Add reviewers using the form below
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Add Reviewer - Responsive */}
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xs sm:text-sm font-medium text-slate-700">
                    Add New Reviewer
                  </h3>

                  <div className="flex gap-2">
                    <Select value={newReviewer} onValueChange={setNewReviewer}>
                      <SelectTrigger className="flex-1 text-xs sm:text-sm h-9 sm:h-10">
                        <SelectValue placeholder="Select a barista" />
                      </SelectTrigger>
                      <SelectContent>
                        {allReviewers
                          .filter((reviewer) => !assigned.includes(reviewer))
                          .map((reviewer) => (
                            <SelectItem
                              key={reviewer}
                              value={reviewer}
                              className="text-xs sm:text-sm"
                            >
                              {reviewer}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleAdd}
                      disabled={!newReviewer}
                      className="bg-blue-600 hover:bg-blue-700 h-9 sm:h-10"
                    >
                      <UserPlus className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Add</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 sm:gap-3 p-4 sm:p-6 pt-2 sm:pt-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/peer-review")}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
