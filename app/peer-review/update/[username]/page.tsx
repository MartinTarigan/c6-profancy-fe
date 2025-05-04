"use client";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import LoadingIndicator from "@/components/LoadingIndicator";
import Toast from "@/components/Toast";

export default function UpdatePeerReview() {
  const router = useRouter();
  const search = useSearchParams();
  const params = useParams();
  const rawEnd = search.get("endDate");
  if (!rawEnd) throw new Error("Missing params");
  const endDate: string = rawEnd;

  const [deadline, setDeadline] = useState<Date>(() => new Date(endDate));
  const [allReviewers, setAllReviewers] = useState<string[]>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [newReviewer, setNewReviewer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch(
          `https://sahabattensbe-production-0c07.up.railway.app/api/trainee/peer-review-assignment/by-reviewee/${params.username}`,
          { headers: { Authorization: `Bearer ${storedToken}` } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data: Array<{ reviewerUsername: string; endDateFill: string }> =
          json.data;
        const here = data
          .filter((a) => a.endDateFill.startsWith(endDate))
          .map((a) => a.reviewerUsername);
        setAssigned(here);

        const reviewersResponse = await fetch(
          "https://sahabattensbe-production-0c07.up.railway.app-production-0c07.up.railway.app-production-0c07.up.railway.app/api/trainee/peer-review-assignment/reviewers",
          { headers: { Authorization: `Bearer ${storedToken}` } }
        );
        if (!reviewersResponse.ok)
          throw new Error(
            `Error fetching reviewers: ${reviewersResponse.status}`
          );
        const reviewersData = await reviewersResponse.json();
        setAllReviewers(reviewersData.data || []);
      } catch (e) {
        console.error(e);
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
    if (assigned.length === 0) {
      setToast({
        type: "error",
        message: "Setidaknya satu user harus ditugaskan.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(
        `https://sahabattensbe-production-0c07.up.railway.app-production-0c07.up.railway.app/api/trainee/peer-review-assignment/update/${params.username}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
      setTimeout(() => router.push("/peer-review"), 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingIndicator />;

  return (
    <div className="p-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      <div className="mb-4">
        <Link
          href="/peer-review"
          className="inline-flex items-center text-primary"
        >
          <ArrowLeft className="mr-2" /> Back
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Update Peer Review</h1>

      <div className="max-w-md space-y-4 bg-white p-6 rounded border">
        <div className="space-y-2">
          <label htmlFor="deadline" className="block font-medium">
            Deadline Peer Review
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="deadline"
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline ? format(deadline, "PPP") : "Select deadline"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
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

        <div>
          <label className="block mb-1 font-medium">Assign User</label>
          <div className="flex space-x-2 mb-2">
            <select
              value={newReviewer}
              onChange={(e) => setNewReviewer(e.target.value)}
              className="flex-1 border rounded p-2"
            >
              <option value="">Choose Barista</option>
              {allReviewers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <Button onClick={handleAdd} disabled={!newReviewer}>
              +
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {assigned.map((u) => (
              <span
                key={u}
                className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
              >
                {u}
                <button
                  onClick={() => handleRemove(u)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* ✅ Tombol Update */}
        <div className="pt-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || assigned.length === 0}
          >
            {isSaving ? "Saving..." : "Update"}
          </Button>
        </div>
      </div>
    </div>
  );
}
