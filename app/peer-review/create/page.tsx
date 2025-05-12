"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, ChevronsUpDown, Check } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function TambahPeerReview() {
  const router = useRouter();
  const [reviewers, setReviewers] = useState<string[]>([]);
  const [reviewees, setReviewees] = useState<string[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<string>("");
  const [selectedReviewee, setSelectedReviewee] = useState<string>("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const reviewersResponse = await fetch(
          "http://localhost:8080/api/trainee/peer-review-assignment/reviewers",
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );
        if (!reviewersResponse.ok) {
          throw new Error(
            `Error fetching reviewers: ${reviewersResponse.status}`
          );
        }
        const reviewersData = await reviewersResponse.json();
        setReviewers(reviewersData.data || []);

        const revieweesResponse = await fetch(
          "http://localhost:8080/api/trainee/peer-review-assignment/reviewees",
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );
        if (!revieweesResponse.ok) {
          throw new Error(
            `Error fetching reviewees: ${revieweesResponse.status}`
          );
        }
        const revieweesData = await revieweesResponse.json();
        setReviewees(revieweesData.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (storedToken) {
      fetchData();
    } else {
      // Untuk demo jika token tidak tersedia.
      setReviewers([
        "skinny.pete",
        "badger",
        "combo",
        "hank.schrader",
        "steve.gomez",
        "gustavo.fring",
        "saul.goodman",
      ]);
      setReviewees(["jesse.pinkman", "todd.alquist", "andrea.cantillo"]);
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span>Loading...</span>
      </div>
    );
  }

  // Form dianggap valid jika semua field yang diperlukan telah terisi.
  const isFormValid =
    selectedReviewer !== "" &&
    selectedReviewee !== "" &&
    deadline !== undefined &&
    token !== null;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    try {
      setIsSubmitting(true);
      const formattedDate = format(deadline as Date, "yyyy-MM-dd");
      const response = await fetch(
        "http://localhost:8080/api/trainee/peer-review-assignment/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reviewerUsername: selectedReviewer,
            revieweeUsername: selectedReviewee,
            endDateFill: formattedDate,
          }),
        }
      );
      const result = await response.json();
      if (response.ok) {
        router.push("/peer-review");
      } else {
        console.error(
          result.message || "Failed to create peer review assignment"
        );
      }
    } catch (err) {
      console.error("Error creating peer review assignment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Komponen Combobox untuk reviewer dan reviewee
  function Combobox({
    options,
    value,
    onValueChange,
    placeholder,
  }: {
    options: string[];
    value: string;
    onValueChange: (val: string) => void;
    placeholder: string;
  }) {
    const [open, setOpen] = useState(false);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value ? value : placeholder}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={placeholder} className="h-9" />
            <CommandList>
              {options.length === 0 && (
                <CommandEmpty>No option found.</CommandEmpty>
              )}
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {option}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <Link
          href="/peer-review"
          className="inline-flex items-center text-primary hover:text-primary/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="flex flex-col items-center">
        <h1 className="text-primary text-3xl font-bold mb-6">
          Tambah Peer Review
        </h1>
        <div className="w-full max-w-2xl border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
          <div className="space-y-6">
            {/* Combobox Reviewer */}
            <div className="space-y-2">
              <label htmlFor="reviewer" className="block font-medium">
                Reviewer
              </label>
              <Combobox
                options={reviewers}
                value={selectedReviewer}
                onValueChange={setSelectedReviewer}
                placeholder="Select reviewer"
              />
            </div>

            {/* Combobox Reviewee */}
            <div className="space-y-2">
              <label htmlFor="reviewee" className="block font-medium">
                Reviewee
              </label>
              <Combobox
                options={reviewees}
                value={selectedReviewee}
                onValueChange={setSelectedReviewee}
                placeholder="Select reviewee"
              />
            </div>

            {/* Calendar for Deadline */}
            <div className="space-y-2">
              <label htmlFor="deadline" className="block font-medium">
                Deadline Peer Review
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
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
                    onSelect={setDeadline}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-10">
            <Link href="/peer-review">
              <Button
                type="button"
                variant="outline"
                className="w-40 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Batal
              </Button>
            </Link>
            <Button
              className="w-40"
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Peer Review"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
