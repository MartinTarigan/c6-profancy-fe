"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Timer,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Toast from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "ESSAY";
  options: Option[];
}

interface Assessment {
  id: number;
  template: string;
  deadline: string;
  questions: Question[];
  assignedUsers: { id: string; fullName: string }[];
}

interface QuestionAnswer {
  questionId: string;
  selectedOptionId?: string;
  essayAnswer?: string;
}

export default function KerjakanAssessment() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: QuestionAnswer }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const [optionsOrder, setOptionsOrder] = useState<{ [key: string]: string[] }>(
    {}
  );

  // --- TIMER STATE ---
  const TOTAL_SECONDS = 20 * 60; // 10 minutes
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [timerStarted, setTimerStarted] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const loadSavedState = () => {
      try {
        // Load timer
        const savedTimeLeft = localStorage.getItem(
          `assessment_${assessmentId}_timeLeft`
        );
        if (savedTimeLeft) {
          const parsedTime = Number.parseInt(savedTimeLeft, 10);
          setTimeLeft(parsedTime > 0 ? parsedTime : TOTAL_SECONDS);
          setTimerStarted(true);
        }

        // Load question order
        const savedOrder = localStorage.getItem(
          `assessment_${assessmentId}_questionOrder`
        );
        if (savedOrder) {
          setQuestionOrder(JSON.parse(savedOrder));
        }

        // Load options order
        const savedOptionsOrder = localStorage.getItem(
          `assessment_${assessmentId}_optionsOrder`
        );
        if (savedOptionsOrder) {
          setOptionsOrder(JSON.parse(savedOptionsOrder));
        }

        // Load answers
        const savedAnswers = localStorage.getItem(
          `assessment_${assessmentId}_answers`
        );
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }

        // Load current question index
        const savedIndex = localStorage.getItem(
          `assessment_${assessmentId}_currentIndex`
        );
        if (savedIndex) {
          setCurrentQuestionIndex(Number.parseInt(savedIndex, 10));
        }
      } catch (err) {
        console.error("Error loading saved state:", err);
        // If there's an error, we'll just use the default state
      }
    };

    loadSavedState();
  }, [assessmentId, TOTAL_SECONDS]);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");
        if (!username) throw new Error("Silakan login ulang.");

        // 1. Fetch assessment
        const res = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/assessments/access/${username}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (!res.ok)
          throw new Error(`Error fetching assessment: ${res.status}`);
        const data: Assessment[] = await res.json();
        const found = data.find((a) => a.id === Number(assessmentId));
        if (!found) throw new Error("Assessment tidak ditemukan");
        setAssessment(found);

        // 2. Inisialisasi questionOrder
        const qoKey = `assessment_${assessmentId}_questionOrder`;
        const savedQo = localStorage.getItem(qoKey);
        if (savedQo) {
          setQuestionOrder(JSON.parse(savedQo));
        } else {
          const serverOrder = found.questions.map((q) => q.id);
          setQuestionOrder(serverOrder);
          localStorage.setItem(qoKey, JSON.stringify(serverOrder));
        }

        // 3. Inisialisasi optionsOrder
        const ooKey = `assessment_${assessmentId}_optionsOrder`;
        const savedOo = localStorage.getItem(ooKey);
        if (savedOo) {
          setOptionsOrder(JSON.parse(savedOo));
        } else {
          const newOo: { [key: string]: string[] } = {};
          found.questions.forEach((q) => {
            if (q.type === "MULTIPLE_CHOICE") {
              newOo[q.id] = q.options.map((opt) => opt.id);
            }
          });
          setOptionsOrder(newOo);
          localStorage.setItem(ooKey, JSON.stringify(newOo));
        }

        // 4. Inisialisasi answers
        const ansKey = `assessment_${assessmentId}_answers`;
        const savedAns = localStorage.getItem(ansKey);
        if (savedAns) {
          setAnswers(JSON.parse(savedAns));
        } else {
          const initAns: { [k: string]: QuestionAnswer } = {};
          found.questions.forEach((q) => {
            initAns[q.id] = {
              questionId: q.id,
              selectedOptionId: undefined,
              essayAnswer: "",
            };
          });
          setAnswers(initAns);
          localStorage.setItem(ansKey, JSON.stringify(initAns));
        }

        // 5. Inisialisasi currentQuestionIndex
        const idxKey = `assessment_${assessmentId}_currentIndex`;
        const savedIdx = localStorage.getItem(idxKey);
        if (savedIdx) {
          setCurrentQuestionIndex(Number.parseInt(savedIdx, 10));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId]);

  // Timer effect
  useEffect(() => {
    if (isLoading || error || !assessment) return;

    // Start the timer if not already started
    if (!timerStarted) {
      setTimerStarted(true);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev <= 1 ? 0 : prev - 1;
        // Save timer to localStorage
        localStorage.setItem(
          `assessment_${assessmentId}_timeLeft`,
          newTime.toString()
        );

        if (newTime <= 0) {
          clearInterval(timer);
          handleSubmit(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error, assessment, timerStarted, assessmentId]);

  // Save current question index to localStorage
  useEffect(() => {
    if (assessment) {
      localStorage.setItem(
        `assessment_${assessmentId}_currentIndex`,
        currentQuestionIndex.toString()
      );
    }
  }, [currentQuestionIndex, assessmentId, assessment]);

  // format MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleMultipleChoiceChange = (questionId: string, optionId: string) => {
    const updatedAnswers = {
      ...answers,
      [questionId]: { ...answers[questionId], selectedOptionId: optionId },
    };
    setAnswers(updatedAnswers);
    // Save to localStorage
    localStorage.setItem(
      `assessment_${assessmentId}_answers`,
      JSON.stringify(updatedAnswers)
    );
  };

  const handleEssayChange = (questionId: string, value: string) => {
    const updatedAnswers = {
      ...answers,
      [questionId]: { ...answers[questionId], essayAnswer: value },
    };
    setAnswers(updatedAnswers);
    // Save to localStorage
    localStorage.setItem(
      `assessment_${assessmentId}_answers`,
      JSON.stringify(updatedAnswers)
    );
  };

  const nextQuestion = () => {
    if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (assessment && index >= 0 && index < assessment.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // submit (skipValidation=true => MC kosong jadi "-1")
  const handleSubmit = async (skipValidation = false) => {
    if (!assessment) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");
      if (!token || !username) {
        setToast({ type: "error", message: "Silakan login kembali." });
        setIsSubmitting(false);
        return;
      }

      if (!skipValidation) {
        const missing = assessment.questions.filter((q) =>
          q.type === "MULTIPLE_CHOICE"
            ? !answers[q.id]?.selectedOptionId
            : !answers[q.id]?.essayAnswer?.trim()
        );
        if (missing.length > 0) {
          setToast({
            type: "warning",
            message: `Ada ${missing.length} pertanyaan yang belum dijawab.`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      const formatted = assessment.questions.map((q) => {
        const ans = answers[q.id] || {
          questionId: q.id,
          selectedOptionId: undefined,
          essayAnswer: "",
        };
        return {
          questionId: ans.questionId,
          selectedOptionId:
            q.type === "MULTIPLE_CHOICE"
              ? ans.selectedOptionId ?? "-1"
              : undefined,
          essayAnswer: ans.essayAnswer,
        };
      });

      const payload = {
        username,
        assessmentId: Number.parseInt(assessmentId, 10),
        answers: formatted,
      };

      const res = await fetch(
        "https://rumahbaristensbe-production.up.railway.app/api/trainee/assessment/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal mengirim jawaban");
      }

      // Clear localStorage after successful submission
      localStorage.removeItem(`assessment_${assessmentId}_timeLeft`);
      localStorage.removeItem(`assessment_${assessmentId}_questionOrder`);
      localStorage.removeItem(`assessment_${assessmentId}_optionsOrder`);
      localStorage.removeItem(`assessment_${assessmentId}_answers`);
      localStorage.removeItem(`assessment_${assessmentId}_currentIndex`);

      setToast({ type: "success", message: "Assessment berhasil dikirim!" });
      setTimeout(() => router.push("/assessment"), 2000);
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
      setIsSubmitting(false);
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!assessment) return 0;
    const totalQuestions = assessment.questions.length;
    const answeredQuestions = assessment.questions.filter((q) => {
      const answer = answers[q.id];
      return q.type === "MULTIPLE_CHOICE"
        ? !!answer?.selectedOptionId
        : !!answer?.essayAnswer && answer.essayAnswer.trim() !== "";
    }).length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="relative w-20 h-20 mb-4">
          <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-spin"></div>
          <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h3 className="text-xl font-medium text-slate-700">
          Memuat Assessment
        </h3>
        <p className="text-slate-500 mt-2">Mohon tunggu sebentar...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex justify-center items-center">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="bg-red-50 text-red-800 rounded-t-lg">
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error Loading Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-700">{error}</p>
          </CardContent>
          <CardFooter>
            <Link href="/assessment" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar Assessment
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );

  if (!assessment)
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex justify-center items-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              Assessment Tidak Ditemukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-slate-600">
              Assessment yang Anda cari tidak tersedia.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/assessment">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar Assessment
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );

  // Get current question based on the saved order
  const currentQuestion = assessment.questions.find(
    (q) => q.id === questionOrder[currentQuestionIndex]
  );
  if (!currentQuestion) return null;

  const progress = calculateProgress();

  return (
    <>
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => handleSubmit(true)}
        title="Keluar Ujian"
        message="Apakah Anda yakin ingin keluar dari ujian? Jika keluar maka ujian Anda akan diberikan nilai 0."
      />

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-6">
        {/* TIMER FIXED POJOK KANAN ATAS
        <div className="fixed top-4 right-4 z-50 flex items-center bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md border border-blue-100">
          <Clock
            className={`h-5 w-5 ${
              timeLeft <= 60 ? "text-red-500 animate-pulse" : timeLeft <= 180 ? "text-amber-500" : "text-blue-600"
            }`}
          />
          <span
            className={`ml-2 font-medium ${
              timeLeft <= 60 ? "text-red-500 animate-pulse" : timeLeft <= 180 ? "text-amber-500" : "text-blue-600"
            }`}
          >
            {formatTime(timeLeft)}
          </span>
        </div> */}

        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
            duration={3000}
          />
        )}

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <button
                onClick={() => setModalOpen(true)}
                className="mr-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {`Assessment ${capitalize(assessment.template)}`}
                </h1>
                <p className="text-slate-500 text-sm">
                  Deadline:{" "}
                  {new Date(assessment.deadline).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <Badge
              className="self-start md:self-auto bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1.5 text-xs"
              variant="outline"
            >
              <Timer className="mr-1.5 h-3.5 w-3.5" />
              Waktu Tersisa: {formatTime(timeLeft)}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Progress</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Question Navigation Sidebar */}
            <div className="md:col-span-1">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                    Navigasi Soal
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-5 md:grid-cols-3 gap-2">
                    {questionOrder.map((qId, idx) => {
                      // cari data soal-nya
                      const q = assessment.questions.find((q) => q.id === qId)!;
                      const isAnswered =
                        q.type === "MULTIPLE_CHOICE"
                          ? !!answers[qId]?.selectedOptionId
                          : !!answers[qId]?.essayAnswer?.trim();
                      const isCurrent = idx === currentQuestionIndex;

                      return (
                        <button
                          key={qId}
                          onClick={() => goToQuestion(idx)}
                          className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            isCurrent
                              ? "bg-blue-600 text-white"
                              : isAnswered
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-xs text-slate-600">
                      <div className="h-3 w-3 rounded-full bg-blue-600 mr-2"></div>
                      <span>Soal Aktif</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600">
                      <div className="h-3 w-3 rounded-full bg-green-100 border border-green-200 mr-2"></div>
                      <span>Sudah Dijawab</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600">
                      <div className="h-3 w-3 rounded-full bg-slate-100 border border-slate-200 mr-2"></div>
                      <span>Belum Dijawab</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Total Soal:</span>
                      <span className="font-medium">
                        {assessment.questions.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Sudah Dijawab:</span>
                      <span className="font-medium text-green-600">
                        {
                          assessment.questions.filter((q) => {
                            const answer = answers[q.id];
                            return q.type === "MULTIPLE_CHOICE"
                              ? !!answer?.selectedOptionId
                              : !!answer?.essayAnswer &&
                                  answer.essayAnswer.trim() !== "";
                          }).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Belum Dijawab:</span>
                      <span className="font-medium text-amber-600">
                        {
                          assessment.questions.filter((q) => {
                            const answer = answers[q.id];
                            return q.type === "MULTIPLE_CHOICE"
                              ? !answer?.selectedOptionId
                              : !answer?.essayAnswer ||
                                  answer.essayAnswer.trim() === "";
                          }).length
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions - Moved from below */}
              <div className="mt-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-700">Petunjuk</AlertTitle>
                  <AlertDescription className="text-blue-600 text-sm">
                    Pastikan semua soal telah dijawab sebelum mengirimkan
                    assessment.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Submit Button - Moved from below */}
              <div className="mt-6">
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim Assessment...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Selesai & Kirim Assessment
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Question Content */}
            <div className="md:col-span-3">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-center">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Soal {currentQuestionIndex + 1} dari{" "}
                      {assessment.questions.length}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        currentQuestion.type === "MULTIPLE_CHOICE"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {currentQuestion.type === "MULTIPLE_CHOICE"
                        ? "Pilihan Ganda"
                        : "Essay"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">
                      {currentQuestion.question}
                    </h3>
                    <Separator className="my-4" />
                  </div>

                  {currentQuestion.type === "MULTIPLE_CHOICE" ? (
                    <RadioGroup
                      value={
                        answers[currentQuestion.id]?.selectedOptionId || ""
                      }
                      onValueChange={(value) =>
                        handleMultipleChoiceChange(currentQuestion.id, value)
                      }
                      className="space-y-3"
                    >
                      {/* Use the saved options order if available */}
                      {(optionsOrder[currentQuestion.id]
                        ? optionsOrder[currentQuestion.id]
                            .map((optId) =>
                              currentQuestion.options.find(
                                (opt) => opt.id === optId
                              )
                            )
                            .filter(Boolean)
                        : currentQuestion.options
                      ).map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                        >
                          <RadioGroupItem
                            value={opt.id}
                            id={`${currentQuestion.id}-${opt.id}`}
                          />
                          <Label
                            htmlFor={`${currentQuestion.id}-${opt.id}`}
                            className="flex-1 cursor-pointer font-normal"
                          >
                            {opt.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      <Label
                        htmlFor={currentQuestion.id}
                        className="text-sm text-slate-600"
                      >
                        Jawaban Anda:
                      </Label>
                      <Textarea
                        id={currentQuestion.id}
                        placeholder="Tulis jawaban Anda di sini..."
                        value={answers[currentQuestion.id]?.essayAnswer || ""}
                        onChange={(e) =>
                          handleEssayChange(currentQuestion.id, e.target.value)
                        }
                        className="min-h-[200px] resize-none"
                      />
                    </div>
                  )}

                  {/* Question Navigation */}
                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={prevQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Soal Sebelumnya
                    </Button>

                    {currentQuestionIndex < assessment.questions.length - 1 ? (
                      <Button
                        onClick={nextQuestion}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Soal Berikutnya
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Selesai & Kirim
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper
const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
