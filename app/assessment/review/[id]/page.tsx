"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import LoadingIndicator from "@/components/LoadingIndicator";
import Toast from "@/components/Toast";

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

interface SubmissionAnswer {
  questionId: string;
  selectedOptionId?: number;
  essayAnswer?: string;
}

interface CorrectAnswers {
  [questionId: string]: number;
}

interface Submission {
  submissionId: number;
  submittedAt: string;
  mcScore: number;
  essayScore: number;
  totalScore: number;
  essayReviewed: boolean;
  username: string;
}

export default function ReviewSubmission() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;
  const search = useSearchParams();
  const assessmentId = search.get("assessmentId");
  if (!assessmentId) throw new Error("assessmentId tidak tersedia");
  const aid = parseInt(assessmentId, 10);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<Record<string, SubmissionAnswer>>({});
  const [correctAnswers, setCorrectAnswers] = useState<CorrectAnswers>({});
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  const handleSubmitScores = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setToast({
          type: "error",
          message: "Sesi login tidak valid. Silakan login kembali.",
        });
        return;
      }

      const totalEssayScore = Object.values(essayScores).reduce(
        (sum, val) => sum + val,
        0
      );

      const payload = {
        submissionId: parseInt(submissionId, 10),
        essayScore: totalEssayScore,
      };

      const response = await fetch(
        "http://localhost:8080/api/trainee/assessment/review-essay",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Gagal menyimpan nilai esai");
      }

      setToast({ type: "success", message: "Nilai esai berhasil disimpan!" });
      setTimeout(
        () => router.push(`/assessment/dashboard-clevel/${params.id}`),
        1500
      );
    } catch (e) {
      setToast({
        type: "error",
        message:
          e instanceof Error
            ? e.message
            : "Terjadi kesalahan saat menyimpan nilai",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Login expired");

        // 1. Jawaban user
        const ansRes = await fetch(
          `http://localhost:8080/api/trainee/answers/${submissionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!ansRes.ok) throw new Error("Gagal fetch submission answers");
        const ansArr = (await ansRes.json()) as Array<{
          questionId: string;
          answer: string;
        }>;

        const formatted: Record<string, SubmissionAnswer> = {};
        ansArr.forEach(({ questionId, answer }) => {
          const num = Number(answer);
          if (!isNaN(num)) {
            formatted[questionId] = { questionId, selectedOptionId: num };
          } else {
            formatted[questionId] = { questionId, essayAnswer: answer };
          }
        });
        setAnswers(formatted);

        // 2. Summary submisi
        const sumRes = await fetch(
          `http://localhost:8080/api/trainee/assessment/${aid}/summaries`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!sumRes.ok) throw new Error("Error fetching submission summaries");
        const sumJson = await sumRes.json();
        const subDetail = sumJson.data.find(
          (s: Submission) => s.submissionId === parseInt(submissionId, 10)
        );
        if (!subDetail) throw new Error("Detail submisi tidak ditemukan");
        setSubmission(subDetail);

        // 3. Jawaban benar
        const corrRes = await fetch(
          `http://localhost:8080/api/trainee/answers/correct/${aid}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!corrRes.ok) throw new Error("Error fetching correct answers");
        const corrJson = await corrRes.json();
        setCorrectAnswers(corrJson.data);

        // 4. Data assessment
        const assRes = await fetch(
          "http://localhost:8080/api/assessments",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!assRes.ok) throw new Error("Error fetching assessment");
        const assArr = (await assRes.json()) as Assessment[];
        const found = assArr.find((a) => a.id === aid);
        if (!found) throw new Error("Assessment tidak ditemukan");
        setAssessment(found);

        // Init skor esai per soal
        const initEs: Record<string, number> = {};
        found.questions
          .filter((q) => q.type === "ESSAY")
          .forEach((q) => (initEs[q.id] = 0));
        setEssayScores(initEs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [submissionId, aid]);

  const handleEssayScoreChange = (questionId: string, score: number) => {
    setEssayScores((prev) => ({ ...prev, [questionId]: score }));
  };

  //   const isCorrect = (questionId: string, selectedOptionId?: number) => {
  //     if (selectedOptionId == null || correctAnswers[questionId] == null) return false;
  //     return selectedOptionId === correctAnswers[questionId];
  //   };

  //   const countEssayQuestions = () => {
  //     if (!assessment) return 0;
  //     return assessment.questions.filter((q) => q.type === "ESSAY").length;
  //   };

  if (isLoading) return <LoadingIndicator />;
  if (error)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-red-600">{error}</p>
      </div>
    );
  if (!assessment || !submission)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p>Data tidak ditemukan</p>
      </div>
    );

  // Pisahkan soal esai dan MC
  const essayQuestions = assessment.questions.filter((q) => q.type === "ESSAY");
  const mcQuestions = assessment.questions.filter(
    (q) => q.type === "MULTIPLE_CHOICE"
  );

  return (
    <div className="flex flex-col p-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      <div className="mb-6">
        <Link
          href="/assessment"
          className="inline-flex items-center text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Link>
      </div>

      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Review Submisi Assessment {capitalize(assessment.template)}
        </h1>
        <p className="text-gray-500 mb-2">
          Peserta: <strong>{submission.username}</strong>
        </p>
        <p className="text-gray-500">
          Waktu Pengumpulan:{" "}
          {new Date(submission.submittedAt).toLocaleString("id-ID")}
        </p>
      </div>

      {/* Section Skor */}
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-500">Nilai Pilihan Ganda</p>
            <p className="text-2xl font-bold">
              {submission.mcScore.toFixed(1)}
            </p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-500">Nilai Esai</p>
            <p className="text-2xl font-bold">
              {submission.essayScore.toFixed(1)}
            </p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-500">Total Nilai</p>
            <p className="text-2xl font-bold">
              {submission.totalScore.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Soal-Soal Essay */}
        {essayQuestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Soal Esai</h2>
            {essayQuestions.map((q, idx) => (
              <div key={q.id} className="mb-6">
                <p className="font-medium mb-2">
                  {idx + 1}. {q.question}
                </p>
                <textarea
                  disabled
                  value={answers[q.id]?.essayAnswer || ""}
                  rows={4}
                  className="w-full p-3 border rounded mb-2 bg-gray-50"
                />
                <div className="flex items-center">
                  <label className="mr-2">Nilai:</label>
                  <input
                    min={0}
                    max={25}
                    value={essayScores[q.id] || 0}
                    onChange={(e) =>
                      handleEssayScoreChange(
                        q.id,
                        Math.min(25, Math.max(0, parseInt(e.target.value) || 0))
                      )
                    }
                    className="w-20 border rounded p-1 text-center"
                  />
                  <span className="ml-2">/ 25</span>
                </div>
              </div>
            ))}
            <div className="text-right">
              <Button onClick={handleSubmitScores} disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Nilai Esai"}
              </Button>
            </div>
          </div>
        )}

        {/* Soal-Soal Pilihan Ganda */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Soal Pilihan Ganda</h2>
          {mcQuestions.map((question, i) => {
            const userSel = answers[question.id]?.selectedOptionId;
            const questionIsCorrect = userSel === correctAnswers[question.id];

            return (
              <div key={question.id} className="mb-8 border-b pb-6">
                <h3 className="mb-4 font-medium">
                  {i + 1 + essayQuestions.length}. {question.question}{" "}
                  <span
                    className={`ml-2 font-semibold ${
                      questionIsCorrect ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {questionIsCorrect ? "BENAR" : "SALAH"}
                  </span>
                </h3>
                <div className="space-y-3">
                  {question.options.map((opt) => {
                    const optId = Number(opt.id);
                    const isSelected = userSel === optId;
                    const highlightCorrectButWrong =
                      !questionIsCorrect &&
                      correctAnswers[question.id] === optId;

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center p-3 rounded-lg ${
                          isSelected
                            ? questionIsCorrect
                              ? "bg-green-100 border-green-300"
                              : "bg-red-100 border-red-300"
                            : highlightCorrectButWrong
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          disabled
                          checked={isSelected}
                          className="mr-2"
                        />
                        <span className="text-gray-700">{opt.text}</span>
                        {highlightCorrectButWrong && (
                          <span className="ml-auto text-green-600 text-sm font-medium">
                            Jawaban Benar
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
