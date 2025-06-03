"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  ClipboardCheck,
  Coffee,
  FileText,
  GraduationCap,
  UserCheck,
  Users,
  Clock,
  CalendarPlus2Icon as CalendarIcon2,
  AlertTriangle,
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingIndicator from "@/components/LoadingIndicator";

const TEMPLATES = [
  {
    label: "Assessment Head Bar",
    value: "HEADBAR",
    icon: <Coffee className="h-5 w-5" />,
    description: "Evaluasi untuk posisi Head Bar",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    label: "Assessment Barista",
    value: "BARISTA",
    icon: <Coffee className="h-5 w-5" />,
    description: "Evaluasi untuk Barista",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    label: "Assessment Trainee Barista",
    value: "TRAINEEBARISTA",
    icon: <GraduationCap className="h-5 w-5" />,
    description: "Evaluasi untuk Trainee Barista",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    label: "Assessment Probation Barista",
    value: "PROBATIONBARISTA",
    icon: <UserCheck className="h-5 w-5" />,
    description: "Evaluasi untuk Probation Barista",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
];

interface AssignedUser {
  id: string;
  fullName: string;
}

interface Assessment {
  id: number;
  template: string;
  deadline: string;
  assignedUsers: AssignedUser[];
}

interface AssignedUserDisplay {
  id: string;
  fullName: string;
}

export default function UpdateAssessment() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState(TEMPLATES[0].value);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [, setUsers] = useState<string[]>([]);
  const [, setSelectedUsers] = useState<string[]>([]);
  const [, setLoadingUsers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedUserDetails, setAssignedUserDetails] = useState<
    AssignedUserDisplay[]
  >([]);
  const [, setActiveTab] = useState("details");

  // Fetch assessment data
  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        // Fetch assessment by ID
        const response = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/assessments/${id}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching assessment: ${response.status}`);
        }

        const assessmentData: Assessment = await response.json();

        // Set form data with existing values
        setTemplate(assessmentData.template);
        setDeadline(new Date(assessmentData.deadline));

        // Extract usernames from assigned users
        const assignedUsernames = assessmentData.assignedUsers.map(
          (user) => user.id
        );
        setSelectedUsers(assignedUsernames);

        // Store the full user details for display
        setAssignedUserDetails(
          assessmentData.assignedUsers.map((user) => ({
            id: user.id,
            fullName: user.fullName,
          }))
        );

        // Fetch available users for the template
        await fetchUsers(assessmentData.template);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengambil data"
        );
        console.error("Error fetching assessment data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAssessmentData();
    }
  }, [id]);

  const fetchUsers = async (tpl: string) => {
    setLoadingUsers(true);
    let url: string;
    if (tpl === "PROBATIONBARISTA") {
      url =
        "https://rumahbaristensbe-production.up.railway.app/api/trainee/peer-review-assignment/reviewees";
    } else {
      url = `https://rumahbaristensbe-production.up.railway.app/api/assessments/${tpl.toLowerCase()}`;
    }
    try {
      const res = await fetch(url, {
        headers: localStorage.getItem("token")
          ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
          : {},
      });
      if (!res.ok) throw new Error(`Cannot fetch users: ${res.status}`);
      const json = await res.json();
      setUsers(json.data || []);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!isLoading && template) {
      fetchUsers(template);
    }
  }, [template, isLoading]);

  // Toggle checkbox
  useEffect(() => {
    if (!isLoading && template) {
      // Assuming toggleUser should be invoked here for some reason
      toggleUser("someUsername");
    }
  }, [isLoading, template]);

  // Toggle user function
  const toggleUser = (username: string) => {
    setSelectedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  const selectedTemplateInfo = TEMPLATES.find((t) => t.value === template);

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="bg-red-50 text-red-800 rounded-t-lg">
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error Loading Data
            </CardTitle>
            <CardDescription className="text-red-700">
              Terjadi kesalahan saat memuat data assessment
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
              Kembali
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 group"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Kembali
      </Button>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            Detail Assessment
          </h1>
          <p className="text-slate-500 mt-2">
            Informasi lengkap tentang assessment ini
          </p>
        </div>

        <div className="mb-8">
          <Tabs
            defaultValue="details"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <div className="flex justify-center mb-6">
              <TabsList className="grid grid-cols-2 w-[400px]">
                <TabsTrigger value="details" className="text-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Detail Assessment
                </TabsTrigger>
                <TabsTrigger value="participants" className="text-sm">
                  <Users className="h-4 w-4 mr-2" />
                  Peserta ({assignedUserDetails.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details">
              <Card className="border-t-4 border-t-slate-700">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center text-2xl">
                        <ClipboardCheck className="mr-3 h-6 w-6 text-slate-700" />
                        Detail Assessment
                      </CardTitle>
                      <CardDescription>
                        Informasi tentang assessment ini
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${selectedTemplateInfo?.color} px-3 py-1.5`}
                    >
                      {selectedTemplateInfo?.icon}
                      <span className="ml-1">
                        {selectedTemplateInfo?.label}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-500">
                          ID Assessment
                        </h3>
                        <div className="flex items-center">
                          <div className="bg-slate-100 px-3 py-2 rounded-lg text-slate-800 font-mono w-full">
                            #{id}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-500">
                          Template
                        </h3>
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-2 rounded-md ${selectedTemplateInfo?.color}`}
                          >
                            {selectedTemplateInfo?.icon}
                          </div>
                          <div>
                            <p className="font-medium">
                              {selectedTemplateInfo?.label}
                            </p>
                            <p className="text-sm text-slate-500">
                              {selectedTemplateInfo?.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-500">
                          Deadline
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-3 rounded-lg">
                            <CalendarIcon2 className="h-5 w-5 text-slate-700" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {deadline ? format(deadline, "d MMMM yyyy") : "-"}
                            </p>
                            <p className="text-sm text-slate-500">
                              Batas waktu pengisian
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-500">
                          Status
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-3 rounded-lg">
                            <Clock className="h-5 w-5 text-green-700" />
                          </div>
                          <div>
                            <p className="font-medium">Aktif</p>
                            <p className="text-sm text-slate-500">
                              {deadline && new Date() < deadline
                                ? `${Math.ceil(
                                    (deadline.getTime() -
                                      new Date().getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )} hari tersisa`
                                : "Deadline telah lewat"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-500">
                      Ringkasan Peserta
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-slate-700" />
                          <span className="font-medium">Total Peserta</span>
                        </div>
                        <Badge variant="outline" className="px-3">
                          {assignedUserDetails.length} peserta
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {assignedUserDetails.slice(0, 5).map((user) => (
                          <Badge
                            key={user.id}
                            variant="secondary"
                            className="px-2 py-1"
                          >
                            {user.fullName || user.id}
                          </Badge>
                        ))}
                        {assignedUserDetails.length > 5 && (
                          <Badge variant="secondary" className="px-2 py-1">
                            +{assignedUserDetails.length - 5} lainnya
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="participants">
              <Card className="border-t-4 border-t-slate-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center text-2xl">
                        <Users className="mr-3 h-6 w-6 text-slate-700" />
                        Daftar Peserta
                      </CardTitle>
                      <CardDescription>
                        Peserta yang ditugaskan dalam assessment ini
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="px-3 py-1.5">
                      {assignedUserDetails.length} peserta
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {assignedUserDetails.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {assignedUserDetails.map((user, index) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <Avatar className="h-10 w-10 bg-slate-200 text-slate-700">
                            <AvatarFallback>
                              {(user.fullName || user.id)
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {user.fullName || "Unnamed User"}
                            </p>
                            <p className="text-sm text-slate-500 truncate">
                              {user.id}
                            </p>
                          </div>
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                            #{index + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <h3 className="text-lg font-medium text-slate-700">
                        Tidak ada peserta
                      </h3>
                      <p className="text-slate-500 mt-1">
                        Belum ada peserta yang ditugaskan
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => router.back()}>
                    Tutup
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
