/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import Toast from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

interface BaristaOption {
  id: string;
  fullName: string;
  role: string;
  status?: string; // Adding status field to the interface
}

export default function MyCalendar() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState("");
  const [outletId, setOutletId] = useState<number | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("");
  const [deletedShiftIds, setDeletedShiftIds] = useState<number[]>([]);
  const [deletedShiftBaristas, setDeletedShiftBaristas] = useState<
    Array<{ shiftId: number; baristaId: string }>
  >([]);
  const [existingShifts, setExistingShifts] = useState<{
    [key: string]: number[];
  }>({});

  interface Outlet {
    outletId: number;
    name: string;
    headBarId?: number;
  }

  interface User {
    id: string;
    username: string;
    role: string;
    outlet?: string;
  }

  interface ShiftData {
    shiftScheduleId: number;
    outletId: number;
    dateShift: string;
    shiftType: number;
    baristas: { id: string }[];
  }

  console.log("User info:", user);

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [allBaristas, setAllBaristas] = useState<BaristaOption[]>([]); // Store all baristas before filtering
  const [baristaOptions, setBaristaOptions] = useState<BaristaOption[]>([]);
  const [schedulesData, setSchedulesData] = useState<Schedules>({});
  const [isCurrentlyEditing, setIsCurrentlyEditing] = useState(false);
  const [currentScheduleState, setCurrentScheduleState] = useState({
    morningShift: [],
    eveningShift: [],
  });

  interface ShiftSchedule {
    morningShift: { id: string; shiftId?: number }[];
    eveningShift: { id: string; shiftId?: number }[];
  }

  type OutletSchedules = {
    [dateKey: string]: ShiftSchedule;
  };

  type Schedules = {
    [outletId: number]: OutletSchedules;
  };

  const [backupSchedules, setBackupSchedules] = useState<Schedules>({});

  const [date, setDate] = useState<Date>(() => new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");

  const [toast, setToast] = useState<{ type: string; message: string } | null>(
    null
  );

  const selectedDateKey = date.toDateString();
  const currentOutletSchedules = schedulesData[outletId!] || {};
  const currentSchedule = currentOutletSchedules[selectedDateKey] || {
    morningShift: [],
    eveningShift: [],
  };

  const validateShift = (
    shiftList: { id: string; shiftId?: number }[],
    minBarista: number
  ) => {
    const validBaristas = shiftList.filter((item) => item.id !== "");
    return validBaristas.length >= minBarista;
  };

  const getDoubleShiftBaristas = () => {
    const pagi = currentSchedule.morningShift
      .filter((item) => item.id !== "")
      .map((item) => item.id);
    const sore = currentSchedule.eveningShift
      .filter((item) => item.id !== "")
      .map((item) => item.id);
    const duplicates = pagi.filter((id) => sore.includes(id));
    return duplicates;
  };

  const isMorningShiftValid = validateShift(currentSchedule.morningShift, 1);
  const isEveningShiftValid = validateShift(currentSchedule.eveningShift, 2);
  const doubleShiftBaristas = getDoubleShiftBaristas();

  useEffect(() => {
    if (!isCurrentlyEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const allowedAreas = [
        "dropdown-barista",
        "btn-tambah-barista",
        "btn-hapus-barista",
        "btn-cancel-edit",
        "btn-simpan-jadwal",
        "btn-close-modal",
        "btn-cancel-modal",
        "btn-confirm-modal",
        "jadwal-shift",
      ];
      if (!target) return;

      const isAllowed = allowedAreas.some((className) =>
        target.closest(`.${className}`)
      );

      if (!isAllowed) {
        setShowConfirmModal(true);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isCurrentlyEditing]);

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem("username");
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        alert("User tidak ditemukan atau belum login");
        return;
      }

      try {
        const res = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/account/${userId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const userRes = await res.json();
        console.log("✅ User data:", userRes);

        setUser(userRes);
        setUserRole(userRes.data.role);

        // Check if outlet exists
        const outlet = userRes.data.outlet;
        if (outlet) {
          const selectedOutlet = outlet;
          console.log("User's outlet name:", selectedOutlet);

          setSelectedOutlet(selectedOutlet); // Set the outlet name for non-admin
          fetchAllOutlets(token, selectedOutlet); // Fetch all outlets and set selected outlet
        } else {
          console.log("❌ Outlet not found for the user");
        }

        if (
          userRes.data.role === "Admin" ||
          userRes.data.role === "CEO" ||
          userRes.data.role === "CIOO" ||
          userRes.data.role === "CMO"
        ) {
          fetchAllOutlets(token); // Admin or C-Level can select any outlet
        }
      } catch (err) {
        console.log("❌ Gagal fetch user data:", err);
      }
    };

    const fetchAllOutlets = async (token: string, userOutletName?: string) => {
      try {
        const res = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/outlets`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setOutlets(data);

        // If non-admin, set the selected outlet
        console.log("User role:", userOutletName);
        if (userOutletName) {
          const matchedOutlet = data.find(
            (o: { name: string }) => o.name === userOutletName
          );
          if (matchedOutlet) {
            setSelectedOutlet(matchedOutlet.name);
            setOutletId(matchedOutlet.outletId); // Set the outletId for selected outlet
            console.log("✅ Outlet selected:", matchedOutlet); // Debugging selected outlet
          } else {
            console.log("❌ Outlet terkait dengan pengguna tidak ditemukan");
          }
        }

        console.log("✅ All outlets:", data); // Debugging list of all outlets
      } catch (err) {
        console.log("❌ Gagal fetch all outlets:", err);
      }
    };

    fetchUserData();
  }, []);

  // ✅ FETCH BARISTAS & SHIFTS WHEN OUTLET CHANGES
  useEffect(() => {
    if (!outletId) return;

    fetchBaristas(outletId);

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    fetchShiftsByRange(outletId, startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  // ✅ FETCH BARISTAS
  const fetchBaristas = async (outletId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Add debugging to see what's happening with the API call
      console.log(
        `🔍 Fetching baristas for outlet ${outletId} with status Active`
      );

      const res = await fetch(
        `https://rumahbaristensbe-production.up.railway.app/api/baristas?outletId=${outletId}&status=Active`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("🔍 API Response status:", res.status);

      const data = await res.json();
      console.log("🔍 API Response data:", data);

      // If we got no baristas with Active status, try fetching all baristas as fallback
      if (data.length === 0) {
        console.log(
          "⚠️ No active baristas found, fetching all baristas as fallback"
        );
        const fallbackRes = await fetch(
          `https://rumahbaristensbe-production.up.railway.app/api/baristas?outletId=${outletId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const fallbackData = await fallbackRes.json();
        setAllBaristas(fallbackData);

        // Filter baristas to only include active ones
        const activeBaristas = fallbackData.filter(
          (barista: BaristaOption) => barista.status?.toLowerCase() === "active"
        );

        setBaristaOptions(activeBaristas);
        console.log("✅ All baristas fetched:", fallbackData);
        console.log(
          "✅ Active baristas (filtered client-side):",
          activeBaristas
        );
      } else {
        setAllBaristas(data);
        setBaristaOptions(data);
        console.log("✅ Active baristas fetched from API:", data);
      }
    } catch (error) {
      console.log("❌ Gagal ambil baristas:", error);
    }
  };

  // ✅ FETCH SHIFTS BY RANGE
  const fetchShiftsByRange = async (
    outletId: number,
    startDate: Date,
    endDate: Date
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to login first!");
        return;
      }

      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const res = await fetch(
        `https://rumahbaristensbe-production.up.railway.app/api/shift/${outletId}?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.log("❌ Response body:", errText);
        alert("Failed to fetch shifts");
        return;
      }

      const data = await res.json();
      console.log("✅ Fetched shifts data:", data);

      // Track existing shifts by date and type
      const existingShiftMap: { [key: string]: number[] } = {};

      data.forEach((shift: ShiftData) => {
        const dateKey = new Date(shift.dateShift).toDateString();
        const mapKey = `${dateKey}-${shift.shiftType}`;

        if (!existingShiftMap[mapKey]) {
          existingShiftMap[mapKey] = [];
        }

        existingShiftMap[mapKey].push(shift.shiftScheduleId);
      });

      setExistingShifts(existingShiftMap);
      console.log("✅ Existing shifts map:", existingShiftMap);

      const shiftMap = buildShiftMap(data);
      setSchedulesData(shiftMap);
    } catch (error) {
      console.log("❌ Error fetching shifts:", error);
    }
  };

  // ✅ BUILD SHIFT MAP by outletId
  const buildShiftMap = (data: ShiftData[]) => {
    const shiftMap: Record<
      number,
      Record<
        string,
        {
          morningShift: { id: string; shiftId?: number }[];
          eveningShift: { id: string; shiftId?: number }[];
        }
      >
    > = {};

    data.forEach((shift) => {
      const outletId = shift.outletId;
      const dateKey = new Date(shift.dateShift).toDateString();

      if (!shiftMap[outletId]) shiftMap[outletId] = {};
      if (!shiftMap[outletId][dateKey]) {
        shiftMap[outletId][dateKey] = {
          morningShift: [],
          eveningShift: [],
        };
      }

      const baristaObjs = (shift.baristas || []).map((b) => ({
        id: b.id,
        shiftId: shift.shiftScheduleId,
      }));

      if (shift.shiftType === 1) {
        shiftMap[outletId][dateKey].morningShift = baristaObjs; // REPLACE
      } else if (shift.shiftType === 2) {
        shiftMap[outletId][dateKey].eveningShift = baristaObjs; // REPLACE
      }
    });

    console.log("✅ Shift map after build (by outletId):", shiftMap);
    return shiftMap;
  };

  // ✅ GET SHIFT INDICATORS FOR CALENDAR TILES
  const getShiftIndicators = (date: Date) => {
    if (!outletId || !schedulesData[outletId])
      return { hasMorning: false, hasEvening: false };

    const dateKey = date.toDateString();
    const daySchedule = schedulesData[outletId][dateKey];

    if (!daySchedule) return { hasMorning: false, hasEvening: false };

    const hasMorning = daySchedule.morningShift.some(
      (barista) => barista.id !== ""
    );
    const hasEvening = daySchedule.eveningShift.some(
      (barista) => barista.id !== ""
    );

    return { hasMorning, hasEvening };
  };

  // ✅ UPDATE SCHEDULE LOCAL STATE
  const updateSchedule = (newSchedule: ShiftSchedule) => {
    if (outletId === null) {
      console.warn("❌ updateSchedule dipanggil tanpa outletId");
      return;
    }

    setSchedulesData((prev: Schedules) => ({
      ...prev,
      [outletId]: {
        ...prev[outletId],
        [selectedDateKey]: newSchedule,
      },
    }));
  };

  // ✅ SAVE SCHEDULE TO BACKEND
  const saveSchedule = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Format date for API
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const dateShift = formatDate(date);
      const currentOutlet = outlets.find((o) => o.outletId === outletId);

      if (!currentOutlet) {
        setToast({
          type: "error",
          message: "Outlet tidak ditemukan! Pastikan outlet telah dipilih.",
        });
        return;
      }

      if (!currentOutlet.headBarId) {
        setToast({
          type: "error",
          message: "HeadBar belum di-assign di outlet ini!",
        });
        return;
      }

      // Validation
      if (!isMorningShiftValid || !isEveningShiftValid) {
        setToast({
          type: "warning",
          message: "Periksa kembali jumlah barista di setiap shift!",
        });
        return;
      }

      if (doubleShiftBaristas.length > 0) {
        setToast({
          type: "warning",
          message:
            "Ada barista yang terdaftar di dua shift pada hari yang sama!",
        });
        return;
      }

      // Step 1: Soft delete existing shifts for this date/outlet if they exist
      const morningShiftKey = `${selectedDateKey}-1`;
      const eveningShiftKey = `${selectedDateKey}-2`;

      const existingMorningShiftIds = existingShifts[morningShiftKey] || [];
      const existingEveningShiftIds = existingShifts[eveningShiftKey] || [];

      console.log("🔍 Existing morning shifts:", existingMorningShiftIds);
      console.log("🔍 Existing evening shifts:", existingEveningShiftIds);

      // Delete existing shifts first
      for (const shiftId of [
        ...existingMorningShiftIds,
        ...existingEveningShiftIds,
      ]) {
        console.log(`🔴 Soft deleting existing shift: ${shiftId}`);

        try {
          const res = await fetch(
            `https://rumahbaristensbe-production.up.railway.app/api/shift/${shiftId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!res.ok) {
            console.error(`Failed to delete shift ${shiftId}: ${res.status}`);
          } else {
            console.log(`✅ Successfully deleted shift ${shiftId}`);
          }
        } catch (error) {
          console.error(`Error deleting shift ${shiftId}:`, error);
        }
      }

      // Step 2: Create new shifts
      const headBarId = currentOutlet.headBarId;
      const shifts = [];

      // Create morning shift if there are baristas assigned
      const morningBaristas = currentSchedule.morningShift.filter(
        (b) => b.id !== ""
      );
      if (morningBaristas.length > 0) {
        shifts.push({
          shiftType: 1,
          dateShift,
          outletId,
          headBarId,
          baristaIds: morningBaristas.map((b) => b.id),
        });
      }

      // Create evening shift if there are baristas assigned
      const eveningBaristas = currentSchedule.eveningShift.filter(
        (b) => b.id !== ""
      );
      if (eveningBaristas.length > 0) {
        shifts.push({
          shiftType: 2,
          dateShift,
          outletId,
          headBarId,
          baristaIds: eveningBaristas.map((b) => b.id),
        });
      }

      console.log("✅ New shifts to create:", shifts);

      // Save each shift
      for (const shift of shifts) {
        const res = await fetch(
          "https://rumahbaristensbe-production.up.railway.app/api/shift/create",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(shift),
          }
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);

          setToast({
            type: "error",
            message: `Gagal simpan shift! Status: ${res.status}`,
          });
          return;
        }
      }

      setToast({ type: "success", message: "Jadwal berhasil disimpan!" });
      setIsCurrentlyEditing(false);

      // Reset tracking states
      setDeletedShiftIds([]);
      setDeletedShiftBaristas([]);

      // Refresh data
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      await fetchShiftsByRange(outletId!, startDate, endDate);
    } catch (error) {
      console.error("Gagal simpan shift:", error);
      setToast({
        type: "error",
        message: "Gagal menyimpan jadwal. Silakan coba lagi!",
      });
    }
  };

  const cancelEdit = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmCancel = () => {
    setSchedulesData(backupSchedules);
    setDeletedShiftIds([]);
    setDeletedShiftBaristas([]);
    setIsCurrentlyEditing(false);
    setShowConfirmModal(false);
  };

  const handleOutletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (selectedValue === "" || !selectedValue) {
      setOutletId(null);
      setSelectedOutlet("");
      setBaristaOptions([]);
      setSchedulesData({});
      return;
    }

    const selectedId = Number.parseInt(selectedValue);
    const selected = outlets.find((o) => o.outletId === selectedId);

    setOutletId(selectedId);
    setSelectedOutlet(selected?.name || "");
    console.log("✅ Selected outlet after change:", selected);

    fetchBaristas(selectedId);

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    fetchShiftsByRange(selectedId, startDate, endDate);
  };

  useEffect(() => {
    const newDate = date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setFormattedDate(newDate);
  }, [date]);

  const renderShiftSection = (
    title: string,
    shiftList: { id: string; shiftId?: number }[],
    shiftType: "morningShift" | "eveningShift"
  ) => {
    const hasValidBarista = shiftList.some((b) => b.id !== "");
    const minBarista = shiftType === "morningShift" ? 1 : 2;
    const isValidShift =
      shiftList.filter((b) => b.id !== "").length >= minBarista;
    const shiftIcon = shiftType === "morningShift" ? "🌅" : "🌆";
    const shiftColor = shiftType === "morningShift" ? "amber" : "emerald";

    const availableBaristas = (index: number) => {
      const selectedIds = shiftList
        .filter((_, i) => i !== index)
        .map((b) => b.id);
      return baristaOptions.filter((b) => !selectedIds.includes(b.id));
    };

    return (
      <div className="mb-8">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-4 ${
            shiftColor === "amber"
              ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
              : "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200"
          }`}
        >
          <span className="text-lg">{shiftIcon}</span>
          <h4
            className={`font-bold text-lg ${
              shiftColor === "amber" ? "text-amber-800" : "text-emerald-800"
            }`}
          >
            {title}
          </h4>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              shiftColor === "amber"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            Min {minBarista} barista
          </span>
        </div>

        {!isValidShift && isCurrentlyEditing && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-700 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Minimal {minBarista} barista harus dipilih untuk {title}
            </p>
          </div>
        )}

        {!outletId && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">
              Pilih outlet terlebih dahulu
            </p>
          </div>
        )}

        {outletId && !hasValidBarista && !isCurrentlyEditing && (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              Belum ada barista di shift ini
            </p>
          </div>
        )}

        {(isCurrentlyEditing || hasValidBarista) &&
          shiftList.map((baristaObj, index) => (
            <div key={index} className="flex items-center gap-3 mb-3">
              <div className="relative flex-1">
                <select
                  value={baristaObj.id}
                  onChange={(e) => {
                    const updated = [...shiftList];
                    updated[index] = {
                      ...baristaObj,
                      id: e.target.value,
                    };
                    updateSchedule({
                      ...currentSchedule,
                      [shiftType]: updated,
                    });
                  }}
                  disabled={!isCurrentlyEditing}
                  className="dropdown-barista w-full px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 text-gray-700 font-medium appearance-none border border-gray-200 focus:border-blue-300 focus:outline-none transition-all duration-200"
                >
                  <option value="">Pilih Barista</option>
                  {availableBaristas(index).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.fullName}
                    </option>
                  ))}
                </select>
                {isCurrentlyEditing && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                )}
              </div>

              {isCurrentlyEditing && (
                <button
                  type="button"
                  className="btn-hapus-barista w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 transition-all duration-200"
                  onClick={() => {
                    const updated = [...shiftList];
                    const deletedBarista = updated.splice(index, 1)[0];

                    if (deletedBarista.shiftId) {
                      setDeletedShiftIds((prev) => [
                        ...prev,
                        deletedBarista.shiftId!,
                      ]);
                      setDeletedShiftBaristas((prev) => [
                        ...prev,
                        {
                          shiftId: deletedBarista.shiftId!,
                          baristaId: deletedBarista.id,
                        },
                      ]);
                    }

                    updateSchedule({
                      ...currentSchedule,
                      [shiftType]: updated,
                    });
                  }}
                >
                  <svg
                    className="w-5 h-5 text-red-500 mx-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}

        {isCurrentlyEditing && outletId && (
          <button
            type="button"
            className="btn-tambah-barista inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-all duration-200"
            onClick={() => {
              updateSchedule({
                ...currentSchedule,
                [shiftType]: [...shiftList, { id: "" }],
              });
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Tambah Barista
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {toast && (
        <Toast
          type={
            toast.type as "error" | "success" | "info" | "warning" | undefined
          }
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Shift Scheduler
              </h1>
              <p className="text-gray-600 text-sm">
                Kelola jadwal shift barista dengan mudah
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 bg-amber-400 rounded-full shadow-sm"></div>
                <span>Pagi</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div>
                <span>Sore</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 py-6">
        {showConfirmModal && (
          <ConfirmModal
            message="Apakah Anda yakin ingin membatalkan perubahan?"
            onConfirm={handleConfirmCancel}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}

        {/* Outlet Selection */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-4 border border-white/20 shadow-xl">
            <div className="relative max-w-md mx-auto">
              {userRole === "Admin" ||
              userRole === "CEO" ||
              userRole === "CIOO" ||
              userRole === "CMO" ? (
                <select
                  value={outletId || ""}
                  onChange={handleOutletChange}
                  className="w-full px-4 py-3 rounded-xl bg-white text-gray-700 font-medium appearance-none border border-gray-200 focus:border-blue-300 focus:outline-none transition-all duration-200"
                >
                  <option value="">Pilih Outlet</option>
                  {outlets.map((outlet) => (
                    <option key={outlet.outletId} value={outlet.outletId}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 rounded-xl bg-white text-gray-700 font-medium border border-gray-200 text-center">
                  {selectedOutlet}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div className="xl:col-span-2 bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-xl">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Kalender Shift
              </h3>
              <p className="text-gray-600 text-sm">
                Klik tanggal untuk melihat atau edit jadwal
              </p>
            </div>

            <div className="flex justify-center">
              <Calendar
                locale="id-ID"
                value={date}
                onChange={setDate}
                className="modern-calendar"
                tileClassName={({ date, view }) => {
                  if (view === "month") {
                    const { hasMorning, hasEvening } = getShiftIndicators(date);
                    if (hasMorning && hasEvening)
                      return "has-morning has-evening";
                    if (hasMorning) return "has-morning";
                    if (hasEvening) return "has-evening";
                  }
                  return "";
                }}
                tileContent={({ date, view }) => {
                  if (view === "month") {
                    const { hasMorning, hasEvening } = getShiftIndicators(date);
                    return (
                      <div className="flex justify-center mt-1">
                        {hasMorning && (
                          <div className="shift-indicator morning"></div>
                        )}
                        {hasEvening && (
                          <div className="shift-indicator evening"></div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </div>
            <div className="px-5 py-4 text-center">
              <h4 className="font-bold text-gray-700">{formattedDate}</h4>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-1">{formattedDate}</h3>
                <p className="text-blue-100 text-sm">Detail Jadwal Shift</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {renderShiftSection(
                "Shift Pagi",
                currentSchedule.morningShift,
                "morningShift"
              )}
              {renderShiftSection(
                "Shift Sore",
                currentSchedule.eveningShift,
                "eveningShift"
              )}
              {userRole === "Head Bar" && (
                <div className="mt-6 flex justify-center">
                  {isCurrentlyEditing ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="btn-cancel-edit px-5 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-all duration-200"
                        onClick={cancelEdit}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        className="btn-simpan-jadwal px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all duration-200"
                        onClick={saveSchedule}
                      >
                        Simpan Jadwal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all duration-200"
                      onClick={() => {
                        setBackupSchedules(schedulesData);
                        setIsCurrentlyEditing(true);
                      }}
                    >
                      Edit Jadwal
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
