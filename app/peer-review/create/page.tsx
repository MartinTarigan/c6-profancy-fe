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
import {
  ArrowLeft,
  CalendarIcon,
  ChevronsUpDown,
  Check,
  AlertCircle,
  Loader2,
  Users,
  Clock,
} from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Toast from "@/components/Toast";

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
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    reviewer?: string;
    reviewee?: string;
    deadline?: string;
  }>({});

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!storedToken) {
          // Demo data for when token is not available
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
          return;
        }

        const [reviewersResponse, revieweesResponse] = await Promise.all([
          fetch(
            "https://rumahbaristensbe-production.up.railway.app/api/trainee/peer-review-assignment/reviewers",
            {
              headers: { Authorization: `Bearer ${storedToken}` },
            }
          ),
          fetch(
            "https://rumahbaristensbe-production.up.railway.app/api/trainee/peer-review-assignment/reviewees",
            {
              headers: { Authorization: `Bearer ${storedToken}` },
            }
          ),
        ]);

        if (!reviewersResponse.ok) {
          throw new Error(
            `Error fetching reviewers: ${reviewersResponse.status}`
          );
        }
        if (!revieweesResponse.ok) {
          throw new Error(
            `Error fetching reviewees: ${revieweesResponse.status}`
          );
        }

        const [reviewersData, revieweesData] = await Promise.all([
          reviewersResponse.json(),
          revieweesResponse.json(),
        ]);

        setReviewers(reviewersData.data || []);
        setReviewees(revieweesData.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const validateForm = () => {
    const errors: typeof fieldErrors = {};

    if (!selectedReviewer) {
      errors.reviewer = "Please select a reviewer";
    }
    if (!selectedReviewee) {
      errors.reviewee = "Please select a reviewee";
    }
    if (!deadline) {
      errors.deadline = "Please select a deadline";
    }
    if (
      selectedReviewer &&
      selectedReviewee &&
      selectedReviewer === selectedReviewee
    ) {
      errors.reviewee = "Reviewer and reviewee cannot be the same person";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid =
    selectedReviewer !== "" &&
    selectedReviewee !== "" &&
    deadline !== undefined &&
    selectedReviewer !== selectedReviewee;

  const handleSubmit = async () => {
    if (!validateForm()) {
      setToast({ type: "warning", message: "tolong periksa kembali" });

      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formattedDate = format(deadline as Date, "yyyy-MM-dd");
      const response = await fetch(
        "https://rumahbaristensbe-production.up.railway.app/api/trainee/peer-review-assignment/create",
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
        setToast({
          type: "success",
          message: "Peer review berhasil ditambahkan",
        });

        router.push("/peer-review");
      } else {
        throw new Error(
          result.message || "Failed to create peer review assignment"
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setToast({
        type: "error",
        message: "Peer review gagal ditambahkan",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  function Combobox({
    options,
    value,
    onValueChange,
    placeholder,
    error,
  }: {
    options: string[];
    value: string;
    onValueChange: (val: string) => void;
    placeholder: string;
    error?: string;
  }) {
    const [open, setOpen] = useState(false);

    return (
      <div className="space-y-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between",
                error && "border-destructive focus:ring-destructive",
                !value && "text-muted-foreground"
              )}
            >
              {value ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {value}
                </div>
              ) : (
                placeholder
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>No option found.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={(currentValue) => {
                        onValueChange(
                          currentValue === value ? "" : currentValue
                        );
                        setOpen(false);
                      }}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {option}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
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
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading data...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/peer-review"
              className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Peer Reviews
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Create Peer Review Assignment
            </h1>
            <p className="text-slate-600">
              Assign a peer review between team members with a specific
              deadline.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Form Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-8 md:grid-cols-2">
                {/* Reviewer Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Reviewer
                    <span className="text-red-500">*</span>
                  </label>
                  <Combobox
                    options={reviewers}
                    value={selectedReviewer}
                    onValueChange={(value) => {
                      setSelectedReviewer(value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        reviewer: undefined,
                      }));
                    }}
                    placeholder="Select reviewer"
                    error={fieldErrors.reviewer}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose who will conduct the review
                  </p>
                </div>

                {/* Reviewee Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Reviewee
                    <span className="text-red-500">*</span>
                  </label>
                  <Combobox
                    options={reviewees}
                    value={selectedReviewee}
                    onValueChange={(value) => {
                      setSelectedReviewee(value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        reviewee: undefined,
                      }));
                    }}
                    placeholder="Select reviewee"
                    error={fieldErrors.reviewee}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose who will be reviewed
                  </p>
                </div>

                {/* Deadline Selection */}
                <div className="space-y-3 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Review Deadline
                    <span className="text-red-500">*</span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deadline && "text-muted-foreground",
                          fieldErrors.deadline &&
                            "border-destructive focus:ring-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline
                          ? format(deadline, "PPP")
                          : "Select deadline date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={(date) => {
                          setDeadline(date);
                          setFieldErrors((prev) => ({
                            ...prev,
                            deadline: undefined,
                          }));
                        }}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldErrors.deadline && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.deadline}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Set when the peer review should be completed
                  </p>
                </div>
              </div>

              {/* Summary Card */}
              {(selectedReviewer || selectedReviewee || deadline) && (
                <div className="mt-8 p-4 bg-slate-50 rounded-lg border">
                  <h3 className="font-semibold text-slate-700 mb-3">
                    Assignment Summary
                  </h3>
                  <div className="grid gap-2 text-sm">
                    {selectedReviewer && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Reviewer:</span>
                        <Badge variant="outline">{selectedReviewer}</Badge>
                      </div>
                    )}
                    {selectedReviewee && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Reviewee:</span>
                        <Badge variant="outline">{selectedReviewee}</Badge>
                      </div>
                    )}
                    {deadline && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Deadline:</span>
                        <Badge variant="outline">
                          {format(deadline, "PPP")}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 mt-10">
                <Link href="/peer-review">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-40 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  className="w-40"
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Assignment"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
