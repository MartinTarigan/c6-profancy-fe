"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Loader2,
  AlertCircle,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Question {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "ESSAY";
  options: {
    id: string;
    text: string;
  }[];
}

interface Assessment {
  id: number;
  template: string;
  deadline: string;
  questions: Question[];
  assignedUsers: { id: string; fullName: string }[];
}

interface CorrectAnswers {
  [questionId: string]: number;
}

export default function AssessmentQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState<CorrectAnswers>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessmentQuestions = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        // Check if user is authorized (C-level)
        const role = localStorage.getItem("roles");
        const isExecutive = ["CLEVEL"].includes(role || "");
        if (!isExecutive) {
          throw new Error(
            "Unauthorized: Hanya C-level executives yang dapat mengakses halaman ini"
          );
        }

        // Fetch assessments to get the current assessment
        const assessmentsRes = await fetch(
          "http://localhost:8080/api/assessments",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!assessmentsRes.ok) {
          throw new Error(
            `Error fetching assessments: ${assessmentsRes.status}`
          );
        }

        const assessmentsData: Assessment[] = await assessmentsRes.json();
        const currentAssessment = assessmentsData.find(
          (a) => a.id === Number(assessmentId)
        );

        if (!currentAssessment) {
          throw new Error("Assessment tidak ditemukan");
        }

        setAssessment(currentAssessment);

        // Fetch correct answers
        try {
          const correctAnswersRes = await fetch(
            `http://localhost:8080/api/trainee/answers/correct/${assessmentId}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );

          if (correctAnswersRes.ok) {
            const correctAnswersData = await correctAnswersRes.json();
            setCorrectAnswers(correctAnswersData.data || {});
          }
        } catch (error) {
          console.error("Error fetching correct answers:", error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessmentQuestions();
  }, [assessmentId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-700">
            Memuat Soal Assessment
          </h3>
          <p className="text-slate-500 mt-2">
            Mohon tunggu sementara kami mengambil data
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="bg-red-50 text-red-800 rounded-t-lg">
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Memuat Soal
            </CardTitle>
            <CardDescription className="text-red-700">
              Kami tidak dapat memuat soal assessment
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
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-yellow-200">
          <CardHeader className="bg-yellow-50 text-yellow-800 rounded-t-lg">
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Assessment Tidak Ditemukan
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Assessment yang diminta tidak dapat ditemukan
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const capitalize = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", { month: "long" });
  };
  const assessmentTitle = `Tes ${capitalize(
    assessment.template
  )} ${getMonthName(assessment.deadline)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Kembali</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Soal Assessment
            </h1>
            <p className="text-slate-500 text-sm">
              {assessmentTitle} • Deadline: {formatDate(assessment.deadline)}
            </p>
          </div>
        </div>

        <Card className="bg-white border-blue-100 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Informasi Assessment
            </CardTitle>
            <CardDescription>Detail tentang assessment ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-500">
                  ID Assessment:
                </span>
                <span className="text-sm">{assessment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Template:
                </span>
                <Badge className="bg-blue-100 text-blue-700">
                  {capitalize(assessment.template)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Deadline:
                </span>
                <span className="text-sm">
                  {formatDate(assessment.deadline)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Passing Grade:
                </span>
                <span className="text-sm font-medium text-green-600">70%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Total Soal:
                </span>
                <span className="text-sm">{assessment.questions.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {assessment.questions.map((question, index) => {
            const correctOptionId = correctAnswers[question.id];

            return (
              <Card key={question.id} className="bg-white border-blue-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-100 text-blue-700">
                      Soal {index + 1} dari {assessment.questions.length}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-50">
                      {question.type === "MULTIPLE_CHOICE"
                        ? "Pilihan Ganda"
                        : "Esai"}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">
                    {question.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {question.type === "MULTIPLE_CHOICE" ? (
                    <RadioGroup defaultValue={correctOptionId?.toString()}>
                      <div className="space-y-3">
                        {question.options.map((option) => {
                          const isCorrect =
                            Number(option.id) === correctOptionId;

                          return (
                            <div
                              key={option.id}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem
                                value={option.id}
                                id={`option-${question.id}-${option.id}`}
                              />
                              <Label
                                htmlFor={`option-${question.id}-${option.id}`}
                                className={`flex items-center ${
                                  isCorrect ? "text-green-700 font-medium" : ""
                                }`}
                              >
                                {option.text}
                                {isCorrect && (
                                  <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                                )}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  ) : (
                    <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                      <p className="text-sm text-slate-500 italic">
                        [Kolom jawaban esai - Jawaban akan dievaluasi oleh
                        penilai]
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
