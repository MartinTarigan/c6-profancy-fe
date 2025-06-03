"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // Keep for potential future use, or remove if truly no buttons
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import LoadingIndicator from "@/components/LoadingIndicator";
import Toast from "@/components/Toast"; // Keep for error messages

interface Option {
  id: string; // Option IDs are typically strings from DB, but might be numbers if parsed
  text: string;
}

interface Question {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "ESSAY";
  options: Option[];
}

interface Assessment {
  id: number; // Assuming assessment ID is a number
  template: string;
  // deadline: string; // Not strictly needed for viewing a submission
  questions: Question[];
  // assignedUsers: { id: string; fullName: string }[]; // Not needed for this view
}

interface SubmissionAnswer {
  questionId: string;
  selectedOptionId?: number; // Keep as number if option IDs are numbers after parsing
  essayAnswer?: string;
}

// Simplified Submission interface for this page
interface UserSubmission {
  submissionId: number;
  submittedAt: string;
  username: string; // Or perhaps userId, then fetch username separately if needed
  assessmentId: number; // We NEED this to fetch the assessment questions
}

export default function ViewUserSubmission() {
  const params = useParams();
  const router = useRouter(); // Keep for navigation if needed
  const submissionIdParam = params.id as string; // submissionId from URL

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [userSubmission, setUserSubmission] = useState<UserSubmission | null>(
    null
  );
  const [answers, setAnswers] = useState<Record<string, SubmissionAnswer>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!submissionIdParam) {
      setError("Submission ID tidak tersedia.");
      setIsLoading(false);
      return;
    }
    const submissionId = parseInt(submissionIdParam, 10);
    if (isNaN(submissionId)) {
      setError("Submission ID tidak valid.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setToast({
            type: "error",
            message: "Sesi login tidak valid. Silakan login kembali.",
          });
          setIsLoading(false);
          // Optionally redirect to login: router.push('/login');
          return;
        }

        // 1. Fetch the specific submission details to get assessmentId and other info
        //    ASSUMPTION: You have an endpoint like `/api/trainee/submission/{submissionId}`
        //    that returns submission details including `assessmentId`.
        //    If not, this part needs to be adjusted based on your backend capabilities.
        const subDetailRes = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/trainee/submission/${submissionId}`, // ADJUST API ENDPOINT
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!subDetailRes.ok) {
          const errData = await subDetailRes
            .json()
            .catch(() => ({ message: "Gagal mengambil detail submisi." }));
          throw new Error(errData.message || "Gagal mengambil detail submisi.");
        }
        const submissionData = (await subDetailRes.json()) as UserSubmission; // Adjust type based on actual API response
        setUserSubmission(submissionData);

        const assessmentId = submissionData.assessmentId;
        if (!assessmentId) {
          throw new Error("Assessment ID tidak ditemukan dalam data submisi.");
        }

        // 2. Fetch the user's answers for this submission
        const ansRes = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/trainee/answers/${submissionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!ansRes.ok) {
          const errData = await ansRes
            .json()
            .catch(() => ({ message: "Gagal mengambil jawaban submisi." }));
          throw new Error(
            errData.message || "Gagal mengambil jawaban submisi."
          );
        }
        const ansArr = (await ansRes.json()) as Array<{
          questionId: string;
          answer: string; // Answer can be option ID (number as string) or essay text
        }>;

        const formattedAnswers: Record<string, SubmissionAnswer> = {};
        ansArr.forEach(({ questionId, answer }) => {
          const numAnswer = Number(answer); // Try converting to number for MCQ
          if (
            !isNaN(numAnswer) &&
            answer.trim() !== "" &&
            !answer.match(/[a-zA-Z]/)
          ) {
            // Check if it's a plausible number ID
            formattedAnswers[questionId] = {
              questionId,
              selectedOptionId: numAnswer,
            };
          } else {
            formattedAnswers[questionId] = { questionId, essayAnswer: answer };
          }
        });
        setAnswers(formattedAnswers);

        // 3. Fetch the assessment details (questions, options) using the assessmentId from submissionData
        //    ASSUMPTION: You have an endpoint like `/api/assessments/{assessmentId}`
        //    or the existing `/api/assessments` and then filter.
        //    Using a direct fetch is more efficient if available.
        const assRes = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/assessments/${assessmentId}`, // ADJUST API ENDPOINT if you have a direct one
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!assRes.ok) {
          const errData = await assRes
            .json()
            .catch(() => ({ message: "Gagal mengambil data assessment." }));
          throw new Error(
            errData.message || "Gagal mengambil data assessment."
          );
        }
        // If /api/assessments/{id} returns the assessment object directly:
        const assessmentData = (await assRes.json()) as Assessment;
        setAssessment(assessmentData);

        // If /api/assessments returns an array and you need to find it:
        // const assArr = (await assRes.json()) as Assessment[];
        // const foundAssessment = assArr.find((a) => a.id === assessmentId);
        // if (!foundAssessment) throw new Error("Assessment tidak ditemukan.");
        // setAssessment(foundAssessment);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengambil data."
        );
        setToast({
          type: "error",
          message: err instanceof Error ? err.message : "Terjadi kesalahan.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [submissionIdParam, router]);

  if (isLoading) return <LoadingIndicator />;
  if (error)
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] p-6">
        <p className="text-red-600 text-center mb-4">{error}</p>
        <Link href="/dashboard" passHref>
          {" "}
          {/* Or relevant user dashboard page */}
          <Button variant="outline">Kembali ke Dashboard</Button>
        </Link>
      </div>
    );
  if (!assessment || !userSubmission)
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] p-6">
        <p className="text-gray-700 text-center mb-4">
          Data submisi tidak ditemukan.
        </p>
        <Link href="/dashboard" passHref>
          {" "}
          {/* Or relevant user dashboard page */}
          <Button variant="outline">Kembali ke Dashboard</Button>
        </Link>
      </div>
    );

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
        {/* Adjust the link to a relevant page for non-Clevel users, e.g., their list of submissions or dashboard */}
        <Link
          href="/my-assessments" // Example: User's list of taken assessments
          className="inline-flex items-center text-primary hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Assessment Saya
        </Link>
      </div>

      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Detail Submisi: {capitalize(assessment.template)}
        </h1>
        {/* Username can be displayed if preferred, or removed if it's their own submission */}
        {/* <p className="text-gray-500 mb-2">
          Peserta: <strong>{userSubmission.username}</strong>
        </p> */}
        <p className="text-gray-500">
          Waktu Pengumpulan:{" "}
          {new Date(userSubmission.submittedAt).toLocaleString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      </div>

      {/* Main content area */}
      <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
        {/* Soal-Soal Essay */}
        {essayQuestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              Jawaban Esai Anda
            </h2>
            {essayQuestions.map((q, idx) => (
              <div key={q.id} className="mb-6">
                <p className="font-medium mb-2 text-gray-800">
                  {idx + 1}. {q.question}
                </p>
                <textarea
                  disabled
                  value={answers[q.id]?.essayAnswer || "Tidak dijawab"}
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded mb-2 bg-gray-50 text-gray-700"
                  aria-label={`Jawaban Anda untuk soal esai: ${q.question}`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Soal-Soal Pilihan Ganda */}
        {mcQuestions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              Jawaban Pilihan Ganda Anda
            </h2>
            {mcQuestions.map((question, i) => {
              const userAnswer = answers[question.id];
              const userSelectedOptionId = userAnswer?.selectedOptionId;

              return (
                <div
                  key={question.id}
                  className="mb-8 border-b pb-6 last:border-b-0 last:pb-0"
                >
                  <h3 className="mb-4 font-medium text-gray-800">
                    {/* Adjust numbering if essays are shown first */}
                    {i +
                      1 +
                      (essayQuestions.length > 0 ? essayQuestions.length : 0)}
                    . {question.question}
                  </h3>
                  <div className="space-y-3">
                    {question.options.map((opt) => {
                      const optionId = Number(opt.id); // Assuming option IDs can be converted to numbers
                      const isSelected = userSelectedOptionId === optionId;

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center p-3 rounded-lg border ${
                            isSelected
                              ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" // Highlight user's selection
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <input
                            type="radio"
                            disabled
                            checked={isSelected}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            aria-label={`Opsi ${opt.text}, ${
                              isSelected ? "dipilih" : "tidak dipilih"
                            }`}
                          />
                          <span
                            className={`text-gray-700 ${
                              isSelected ? "font-medium" : ""
                            }`}
                          >
                            {opt.text}
                          </span>
                        </div>
                      );
                    })}
                    {!userSelectedOptionId &&
                      question.type === "MULTIPLE_CHOICE" && (
                        <p className="text-sm text-gray-500 italic mt-2">
                          Tidak ada jawaban yang dipilih untuk soal ini.
                        </p>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mcQuestions.length === 0 && essayQuestions.length === 0 && (
          <p className="text-center text-gray-600 py-8">
            Tidak ada soal dalam assessment ini.
          </p>
        )}
      </div>
    </div>
  );
}

function capitalize(s: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
