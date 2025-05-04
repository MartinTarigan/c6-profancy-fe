"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  CheckCircle2,
  ClipboardList,
  Coffee,
  GraduationCap,
  Loader2,
  UserCheck,
  Users,
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const TEMPLATES = [
  {
    label: "Assessment Head Bar",
    value: "HEADBAR",
    icon: <Coffee className="h-5 w-5" />,
    description: "Evaluasi untuk posisi Head Bar",
    color: "bg-amber-100 text-amber-800",
  },
  {
    label: "Assessment Barista",
    value: "BARISTA",
    icon: <Coffee className="h-5 w-5" />,
    description: "Evaluasi untuk Barista",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    label: "Assessment Trainee Barista",
    value: "TRAINEEBARISTA",
    icon: <GraduationCap className="h-5 w-5" />,
    description: "Evaluasi untuk Trainee Barista",
    color: "bg-blue-100 text-blue-800",
  },
  {
    label: "Assessment Probation Barista",
    value: "PROBATIONBARISTA",
    icon: <UserCheck className="h-5 w-5" />,
    description: "Evaluasi untuk Probation Barista",
    color: "bg-purple-100 text-purple-800",
  },
];

export default function TambahAssessment() {
  const router = useRouter();

  const [template, setTemplate] = useState(TEMPLATES[0].value);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  const [users, setUsers] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async (tpl: string) => {
    setLoadingUsers(true);
    let url: string;
    if (tpl === "PROBATIONBARISTA") {
      url =
        "https://sahabattensbe-production-0c07.up.railway.app/api/trainee/peer-review-assignment/reviewees";
    } else {
      url = `https://sahabattensbe-production-0c07.up.railway.app/api/assessments/${tpl.toLowerCase()}`;
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
      setSelectedUsers([]);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers(template);
  }, [template]);

  // toggle checkbox
  const toggleUser = (username: string) => {
    setSelectedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  const handleSubmit = async () => {
    if (!deadline || selectedUsers.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        template,
        deadline: format(deadline, "yyyy-MM-dd"),
        assignedUsername: selectedUsers,
      };
      const res = await fetch(
        "https://sahabattensbe-production-0c07.up.railway.app/api/assessments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token")
              ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
              : {}),
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      router.push("/assessment");
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTemplate = TEMPLATES.find((t) => t.value === template);

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
        <div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              Tambah Assessment Baru
            </h1>
            <p className="text-slate-500 mt-2">
              Buat dan tetapkan assessment untuk evaluasi kinerja
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <div className="flex space-x-2">
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center ${
                    currentStep >= 1
                      ? "bg-slate-800 text-white"
                      : "bg-slate-200"
                  }`}
                >
                  1
                </div>
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center ${
                    currentStep >= 2
                      ? "bg-slate-800 text-white"
                      : "bg-slate-200"
                  }`}
                >
                  2
                </div>
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center ${
                    currentStep >= 3
                      ? "bg-slate-800 text-white"
                      : "bg-slate-200"
                  }`}
                >
                  3
                </div>
              </div>
              <div className="text-sm text-slate-500">
                {currentStep === 1 && "Pilih Template"}
                {currentStep === 2 && "Tetapkan Deadline"}
                {currentStep === 3 && "Pilih Peserta"}
              </div>
            </div>
            <Progress value={currentStep * 33.33} className="h-2" />
          </div>

          {currentStep === 1 && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardList className="mr-2 h-5 w-5 text-slate-700" />
                    Pilih Template Assessment
                  </CardTitle>
                  <CardDescription>
                    Pilih jenis assessment yang ingin dibuat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TEMPLATES.map((t) => (
                      <div
                        key={t.value}
                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                          template === t.value
                            ? "ring-2 ring-slate-800 bg-slate-50"
                            : ""
                        }`}
                        onClick={() => setTemplate(t.value)}
                      >
                        <div className="flex items-center mb-2">
                          <div className={`p-2 rounded-full mr-3 ${t.color}`}>
                            {t.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{t.label}</h3>
                            <p className="text-sm text-slate-500">
                              {t.description}
                            </p>
                          </div>
                          {template === t.value && (
                            <CheckCircle2 className="ml-auto h-5 w-5 text-slate-800" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={() => setCurrentStep(2)}>Lanjutkan</Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-slate-700" />
                    Tetapkan Deadline
                  </CardTitle>
                  <CardDescription>
                    Pilih tanggal deadline untuk pengisian assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="mb-4">
                        <Badge className={selectedTemplate?.color}>
                          {selectedTemplate?.label}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline Pengisian</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="deadline"
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {deadline
                                ? format(deadline, "PPP", { locale: undefined })
                                : "Pilih tanggal deadline"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={deadline}
                              onSelect={setDeadline}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed">
                        <CalendarIcon className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500">
                          Pilih tanggal deadline untuk menentukan batas waktu
                          pengisian assessment
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Kembali
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!deadline}
                  >
                    Lanjutkan
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-slate-700" />
                    Pilih Peserta
                  </CardTitle>
                  <CardDescription>
                    Pilih peserta yang akan mengikuti assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="mb-4 space-y-2">
                        <Badge className={selectedTemplate?.color}>
                          {selectedTemplate?.label}
                        </Badge>
                        {deadline && (
                          <Badge variant="outline" className="ml-2">
                            Deadline: {format(deadline, "d MMMM yyyy")}
                          </Badge>
                        )}
                      </div>

                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Cari peserta..."
                          className="w-full px-3 py-2 border rounded-lg"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      {loadingUsers ? (
                        <div className="flex items-center justify-center h-40">
                          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                      ) : (
                        <div className="border rounded-lg">
                          <div className="p-3 bg-slate-50 border-b flex justify-between">
                            <span className="font-medium">Daftar Peserta</span>
                            <Badge variant="outline">
                              {selectedUsers.length} dipilih
                            </Badge>
                          </div>
                          <div className="h-64 overflow-y-auto">
                            <div className="p-2">
                              {filteredUsers.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                  Tidak ada peserta yang ditemukan
                                </div>
                              ) : (
                                filteredUsers.map((u) => (
                                  <div
                                    key={u}
                                    className={`flex items-center p-2 rounded-md hover:bg-slate-50 ${
                                      selectedUsers.includes(u)
                                        ? "bg-slate-50"
                                        : ""
                                    }`}
                                  >
                                    <Checkbox
                                      id={u}
                                      checked={selectedUsers.includes(u)}
                                      onCheckedChange={() => toggleUser(u)}
                                      className="mr-3"
                                    />
                                    <Label
                                      htmlFor={u}
                                      className="flex-1 cursor-pointer"
                                    >
                                      {u}
                                    </Label>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="bg-slate-50 rounded-lg border border-dashed p-4 mb-4">
                        <h3 className="font-medium mb-2 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-slate-700" />
                          Ringkasan Assessment
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Template:</span>
                            <span className="font-medium">
                              {selectedTemplate?.label}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-slate-500">Deadline:</span>
                            <span className="font-medium">
                              {deadline ? format(deadline, "d MMMM yyyy") : "-"}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Jumlah Peserta:
                            </span>
                            <span className="font-medium">
                              {selectedUsers.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedUsers.length > 0 && (
                        <div className="bg-slate-50 rounded-lg border p-4">
                          <h3 className="font-medium mb-2">Peserta Terpilih</h3>
                          <div className="h-32 overflow-y-auto">
                            <div className="space-y-1">
                              {selectedUsers.map((user) => (
                                <div
                                  key={user}
                                  className="flex items-center justify-between text-sm p-1"
                                >
                                  <span>{user}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleUser(user)}
                                    className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    Hapus
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Kembali
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !deadline || selectedUsers.length === 0 || submitting
                    }
                    className="relative"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Assessment"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
