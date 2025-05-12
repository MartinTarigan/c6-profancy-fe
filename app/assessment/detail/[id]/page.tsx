"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import LoadingIndicator from "@/components/LoadingIndicator";

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

interface SubmissionSummary {
  submissionId: number;
  submittedAt: string;
  mcScore: number;
  essayScore: number;
  totalScore: number;
  essayReviewed: boolean;
  username: string;
}

export default function DetailAssessment() {
  const params = useParams();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");
        if (!username)
          throw new Error("Username tidak ditemukan. Silakan login kembali.");

        // Fetch assessment
        const assessmentRes = await fetch(
          "http://localhost:8080/api/assessments",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (!assessmentRes.ok)
          throw new Error(`Error fetching assessment: ${assessmentRes.status}`);
        const assessmentsData: Assessment[] = await assessmentRes.json();
        const found = assessmentsData.find(
          (a) => a.id === parseInt(assessmentId, 10)
        );
        if (!found) throw new Error("Assessment tidak ditemukan");
        setAssessment(found);

        // Fetch submissions
        setIsLoadingSubmissions(true);
        const submissionsRes = await fetch(
          `http://localhost:8080/api/trainee/assessment/${assessmentId}/summaries`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!submissionsRes.ok)
          throw new Error(
            `Error fetching submissions: ${submissionsRes.status}`
          );
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
        setIsLoadingSubmissions(false);
      }
    };

    fetchAssessmentData();
  }, [assessmentId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-destructive text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            Assessment Tidak Ditemukan
          </h3>
          <p>Assessment yang Anda cari tidak tersedia.</p>
          <Link href="/assessment">
            <Button className="mt-4">Kembali ke Daftar Assessment</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/assessment"
          className="inline-flex items-center text-primary hover:text-primary/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-primary text-3xl font-bold mb-2">
          Detail Assessment
        </h1>
        <p className="text-gray-500">
          {assessment.template} — Deadline: {formatDate(assessment.deadline)}
        </p>
      </div>

      {/* Assessment Info */}
      <div className="w-full max-w-4xl mx-auto border border-gray-200 rounded-lg p-8 bg-white shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Informasi Assessment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium mb-2">Template</h3>
            <p>{assessment.template}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Deadline</h3>
            <p>{formatDate(assessment.deadline)}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Jumlah Peserta</h3>
            <p>{assessment.assignedUsers.length} Peserta</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Jumlah Pertanyaan</h3>
            <p>{assessment.questions.length} Pertanyaan</p>
          </div>
        </div>

        <h3 className="font-medium mb-2">Daftar Pertanyaan</h3>
        <div className="space-y-4 mb-6">
          {assessment.questions.map((q, i) => (
            <div key={q.id} className="border-b pb-3">
              <p className="font-medium">
                {i + 1}. {q.question}
              </p>
              <p className="text-sm text-gray-500">
                Tipe: {q.type === "MULTIPLE_CHOICE" ? "Pilihan Ganda" : "Esai"}
              </p>
              {q.type === "MULTIPLE_CHOICE" && (
                <div className="mt-2 pl-4">
                  {q.options.map((opt, j) => (
                    <p key={opt.id} className="text-sm">
                      {String.fromCharCode(65 + j)}. {opt.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <h3 className="font-medium mb-2">Daftar Peserta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {assessment.assignedUsers.map((u) => (
            <div key={u.id} className="text-sm">
              {u.fullName}
            </div>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="w-full max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Daftar Submisi</h2>

        {isLoadingSubmissions ? (
          <div className="text-center py-8">
            <LoadingIndicator />
            <p className="mt-4 text-gray-500">Memuat data submisi...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-gray-500">
              Belum ada submisi untuk assessment ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="py-3 px-4 text-left">Username</th>
                  <th className="py-3 px-4 text-left">Waktu Submisi</th>
                  <th className="py-3 px-4 text-left">Nilai MC</th>
                  <th className="py-3 px-4 text-left">Nilai Esai</th>
                  <th className="py-3 px-4 text-left">Total Nilai</th>
                  <th className="py-3 px-4 text-left">Status Esai</th>
                  <th className="py-3 px-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  // kondisi: MC = 0 & belum dinilai → tidak perlu review esai
                  const skipEssayReview =
                    !sub.essayReviewed && sub.mcScore === 0;

                  return (
                    <tr
                      key={sub.submissionId}
                      className="bg-blue-50 border-b border-white"
                    >
                      <td className="py-3 px-4">{sub.username}</td>
                      <td className="py-3 px-4">
                        {formatDate(sub.submittedAt)}
                      </td>
                      <td className="py-3 px-4">{sub.mcScore.toFixed(1)}</td>
                      <td className="py-3 px-4">{sub.essayScore.toFixed(1)}</td>
                      <td className="py-3 px-4">{sub.totalScore.toFixed(1)}</td>
                      <td className="py-3 px-4">
                        {skipEssayReview ? (
                          <span className="text-red-600">
                            Penilaian Esai Tidak Diperlukan
                          </span>
                        ) : sub.essayReviewed ? (
                          <span className="text-green-600">Sudah Dinilai</span>
                        ) : (
                          <span className="text-amber-600">Belum Dinilai</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={
                            `/assessment/review/${sub.submissionId}` +
                            `?assessmentId=${assessmentId}` +
                            `&username=${encodeURIComponent(sub.username)}`
                          }
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={skipEssayReview}
                          >
                            Review
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
