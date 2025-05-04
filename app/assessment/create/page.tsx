"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const TEMPLATES = [
  { label: "Assessment Head Bar", value: "HEADBAR" },
  { label: "Assessment Barista", value: "BARISTA" },
  { label: "Assessment Trainee Barista", value: "TRAINEEBARISTA" },
  { label: "Assessment Probation Barista", value: "PROBATIONBARISTA" },
];

export default function TambahAssessment() {
  const router = useRouter();

  const [template, setTemplate] = useState(TEMPLATES[0].value);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  const [users, setUsers] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async (tpl: string) => {
    setLoadingUsers(true);
    let url: string;
    if (tpl === "PROBATIONBARISTA") {
      url = "https://sahabattensbe-production-0c07.up.railway.app/api/trainee/peer-review-assignment/reviewees";
    } else {
      url = `https://sahabattensbe-production-0c07.up.railway.app/api/assessments/${tpl.toLowerCase()}`;
    }
    try {
      const res = await fetch(url, {
        headers: localStorage.getItem("token")
          ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
          : {},
      });
      if (!res.ok) throw new Error(`Cannot fetch users: ${res.status}`);
      const json = await res.json();
      setUsers(json.data || []);
      setSelectedUsers([]);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers(template);
  }, [template]);

  // toggle checkbox
  const toggleUser = (username: string) => {
    setSelectedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  const handleSubmit = async () => {
    if (!deadline || selectedUsers.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        template,
        deadline: format(deadline, "yyyy-MM-dd"),
        assignedUsername: selectedUsers,
      };
      const res = await fetch("https://sahabattensbe-production-0c07.up.railway.app/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token")
            ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      router.push("/assessment");
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan assessment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <Button variant="outline" onClick={() => router.back()}>
        ← Back
      </Button>

      <h1 className="text-3xl font-bold text-center my-8">
        Tambah Assessment
      </h1>

      <div className="max-w-xl mx-auto space-y-6 border rounded-lg p-6">
        {/* Pilih Template */}
        <div className="space-y-2">
          <label htmlFor="template" className="block font-medium">
            Pilih Template
          </label>
          <select
            id="template"
            className="w-full border rounded-lg px-3 py-2"
            value={template}
            onChange={(e) => setTemplate(e.currentTarget.value)}
          >
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Deadline Pengisian */}
        <div className="space-y-2">
          <label htmlFor="deadline" className="block font-medium">
            Deadline Pengisian
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline ? format(deadline, "PPP", { locale: undefined }) : "Select deadline"}
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

        {/* Assign User */}
        <div className="space-y-2">
          <label className="block font-medium">Assign User</label>
          {loadingUsers ? (
            <p>Loading users…</p>
          ) : (
            <div className="border rounded-lg max-h-52 overflow-y-auto p-2 space-y-1">
              {users.map((u) => (
                <div key={u} className="flex items-center">
                  <input
                    id={u}
                    type="checkbox"
                    checked={selectedUsers.includes(u)}
                    onChange={() => toggleUser(u)}
                    className="mr-2"
                  />
                  <label htmlFor={u} className="flex-1">
                    {u}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            variant="destructive"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!deadline || selectedUsers.length === 0 || submitting}
          >
            {submitting ? "Menyimpan…" : "Simpan Assessment"}
          </Button>
        </div>
      </div>
    </div>
  );
}