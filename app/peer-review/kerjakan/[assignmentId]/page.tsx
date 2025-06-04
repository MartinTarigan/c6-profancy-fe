"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LoadingIndicator from "@/components/LoadingIndicator";

interface Question {
  questionNumber: number;
  text: string;
}

interface SubmissionPayload {
  assignmentId: number;
  [questionKey: string]: number;
}

export default function KerjakanPeerReview() {
  const { assignmentId } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // opsi skala statis
  const scaleOptions = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4];

  useEffect(() => {
    const fetchQuestions = async () => {
      const storedToken = localStorage.getItem("token");
      try {
        const res = await fetch(
          "http://localhost:8080/api/peer-review/questions",
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: Question[] = await res.json();
        setQuestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleChange = (qNum: number, val: number) => {
    setAnswers((prev) => ({ ...prev, [qNum]: val }));
  };

  const handleSubmit = async () => {
    const storedToken = localStorage.getItem("token");
    const payload: SubmissionPayload = {
      assignmentId: Number(assignmentId),
    };
    questions.forEach((q) => {
      payload[`q${q.questionNumber}`] = answers[q.questionNumber] ?? 0;
    });
    try {
      const res = await fetch(
        "http://localhost:8080/api/peer-review/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
      // setelah sukses bisa redirect
      router.push("/peer-review");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (isLoading) return <LoadingIndicator />;
  if (error)
    return (
      <div className="text-center py-16 text-red-500">
        <p>{error}</p>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Tens Probation Scoring</h1>

      <div className="p-4 border rounded-lg mb-8 bg-blue-50">
        <p>
          Hasil Peer Review memiliki peran penting dalam menentukan kelulusan
          masa percobaan (probation) untuk karyawan baru. Terdapat tiga kategori
          hasil evaluasi sebagai berikut:
        </p>
        <ol className="list-decimal list-inside ml-4 mt-2 text-sm">
          <li>Tidak Lulus (Skor rata-rata &lt; 2)</li>
          <li>Lulus Bersyarat (Skor rata-rata ≥ 2 sampai &lt; 3.5)</li>
          <li>Lulus (Skor rata-rata ≥ 3.5)</li>
        </ol>
        <p className="text-sm mt-2">
          Catatan: Setiap karyawan wajib mengisi; buka link ini jika ingin
          menilai karyawan lain.
        </p>
      </div>

      {questions.map((q) => (
        <div key={q.questionNumber} className="mb-6">
          <p className="font-medium mb-2">
            {q.questionNumber}. {q.text}
          </p>
          <div className="grid grid-cols-8 gap-2">
            {scaleOptions.map((opt) => (
              <label key={opt} className="flex flex-col items-center text-sm">
                <input
                  type="radio"
                  name={`q${q.questionNumber}`}
                  value={opt}
                  checked={answers[q.questionNumber] === opt}
                  onChange={() => handleChange(q.questionNumber, opt)}
                  className="mb-1"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      <Button onClick={handleSubmit} className="mt-4">
        Submit Peer Review
      </Button>
    </div>
  );
}
