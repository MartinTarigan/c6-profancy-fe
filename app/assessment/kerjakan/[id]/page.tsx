"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Timer } from "lucide-react";
import Link from "next/link";
import LoadingIndicator from "@/components/LoadingIndicator";
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

  // --- TIMER STATE ---
  const TOTAL_SECONDS = 1 * 20;
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");

        const res = await fetch(
          `https://sahabattensbe-production-0c07.up.railway.app/api/assessments/access/${username}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!res.ok) throw new Error(`Error fetching assessment: ${res.status}`);

        const data: Assessment[] = await res.json();
        const found = data.find(a => a.id === parseInt(assessmentId, 10));
        if (!found) throw new Error("Assessment tidak ditemukan");

        setAssessment(found);

        // init jawaban
        const init: { [k: string]: QuestionAnswer } = {};
        found.questions.forEach(q => {
          init[q.id] = { questionId: q.id, selectedOptionId: undefined, essayAnswer: "" };
        });
        setAnswers(init);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssessment();
  }, [assessmentId]);

  useEffect(() => {
    if (isLoading || error) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error, answers]);

  // format MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleMultipleChoiceChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedOptionId: optionId },
    }));
  };

  const handleEssayChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], essayAnswer: value },
    }));
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
        const missing = assessment.questions.filter(q =>
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

      const formatted = assessment.questions.map(q => {
        const ans = answers[q.id] || { questionId: q.id, selectedOptionId: undefined, essayAnswer: "" };
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
        assessmentId: parseInt(assessmentId, 10),
        answers: formatted,
      };

      const res = await fetch(
        "https://sahabattensbe-production-0c07.up.railway.app/api/trainee/assessment/submit",
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

  if (isLoading) return <LoadingIndicator />;
  if (error)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-destructive text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  if (!assessment)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Assessment Tidak Ditemukan</h3>
          <p>Assessment yang Anda cari tidak tersedia.</p>
          <Link href="/assessment">
            <Button className="mt-4">Kembali ke Daftar Assessment</Button>
          </Link>
        </div>
      </div>
    );

  return (
    <>
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => handleSubmit(true)}
        title="Keluar Ujian"
        message="Apakah Anda yakin ingin keluar dari ujian? Jika keluar maka ujian Anda akan diberikan nilai 0."
      />
    <div className="flex flex-col">
      {/* TIMER FIXED POJOK KANAN ATAS */}
      <div className="fixed top-4 right-4 z-50 flex items-center bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow">
        <Timer
          className={`h-6 w-6 ${
            timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-blue-500"
          }`}
        />
        <span
          className={`ml-2 text-lg font-medium ${
            timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-blue-500"
          }`}
        >
          {formatTime(timeLeft)}
        </span>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

<div className="mb-6">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center text-primary hover:text-primary/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </button>
        </div>

      <div className="flex flex-col items-center mb-8">
        <h1 className="text-primary text-3xl font-bold mb-2">
          {`Assessment ${capitalize(assessment.template)}`}
        </h1>
        <p className="text-gray-500">
          Deadline:{" "}
          {new Date(assessment.deadline).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
        {assessment.questions.map((q, idx) => (
          <div key={q.id} className="mb-8 border-b pb-6">
            <h3 className="text-lg font-medium mb-4">
              Soal {idx + 1}: {q.question}
            </h3>

            {q.type === "MULTIPLE_CHOICE" ? (
              <div className="space-y-3">
                {q.options.map(opt => (
                  <div key={opt.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`${q.id}-${opt.id}`}
                      name={q.id}
                      className="mr-3 h-4 w-4 text-primary"
                      value={opt.id}
                      checked={answers[q.id]?.selectedOptionId === opt.id}
                      onChange={() =>
                        handleMultipleChoiceChange(q.id, opt.id)
                      }
                    />
                    <label
                      htmlFor={`${q.id}-${opt.id}`}
                      className="text-gray-700"
                    >
                      {opt.text}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                id={q.id}
                className="w-full border border-gray-300 rounded-lg p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tulis jawaban Anda di sini..."
                value={answers[q.id]?.essayAnswer || ""}
                onChange={e => handleEssayChange(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="flex justify-center mt-8">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="px-8 py-2 text-lg"
          >
            {isSubmitting ? "Mengirim..." : "Submit Assessment"}
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}

// Helper
const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
