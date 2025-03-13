"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

interface BaristaOption {
  id: string;
  fullName: string;
  role: string;
}

export default function MyCalendar() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState("");
  const [outletId, setOutletId] = useState<number | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [outlets, setOutlets] = useState<any[]>([]);
  const [baristaOptions, setBaristaOptions] = useState<BaristaOption[]>([]);
  const [schedules, setSchedules] = useState<any>({});
  const [backupSchedules, setBackupSchedules] = useState<any>({});
  const [date, setDate] = useState<Date>(new Date());
  const [isEditing, setIsEditing] = useState(false);

  // ✅ Gunakan outletId sebagai key!
  const selectedDateKey = date.toDateString();
  const currentOutletSchedules = schedules[outletId!] || {};
  const currentSchedule = currentOutletSchedules[selectedDateKey] || {
    morningShift: [],
    eveningShift: [],
  };

  // ✅ FETCH USER DATA ON LOAD
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem("userid");
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        alert("User tidak ditemukan atau belum login");
        return;
      }

      try {
        const res = await fetch(`http://localhost:8080/api/account/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const userRes = await res.json();
        console.log("✅ User data:", userRes);

        setUser(userRes);
        setUserRole(userRes.data.role);

        // Check if outlet exists
        const outlet = userRes.data.outlet;
        if (outlet) {
          const selectedOutlet = outlet;
          // const selectedOutletId = outlet.outletId;
          console.log("User's outlet name:", selectedOutlet);

          setSelectedOutlet(selectedOutlet); // Set the outlet name for non-admin
          fetchAllOutlets(token, selectedOutlet); // Fetch all outlets and set selected outlet
        } else {
          console.error("❌ Outlet not found for the user");
        }

        if (userRes.data.role === "Admin" || userRes.data.role === "C-Level") {
          fetchAllOutlets(token); // Admin or C-Level can select any outlet
        } else {
          console.log("Non-admin, outlet associated with user:", outlet);
        }
      } catch (err) {
        console.error("❌ Gagal fetch user data:", err);
      }
    };

    const fetchAllOutlets = async (token: string, userOutletName?: string) => {
      try {
        const res = await fetch(`http://localhost:8080/api/outlets`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setOutlets(data);

        // If non-admin, set the selected outlet
        console.log("User role:", userOutletName);
        if (userOutletName) {
          const matchedOutlet = data.find((o) => o.name === userOutletName);
          if (matchedOutlet) {
            setSelectedOutlet(matchedOutlet.name);
            setOutletId(matchedOutlet.outletId); // Set the outletId for selected outlet
            console.log("✅ Outlet selected:", matchedOutlet); // Debugging selected outlet
          } else {
            console.error("❌ Outlet terkait dengan pengguna tidak ditemukan");
          }
        }

        console.log("✅ All outlets:", data); // Debugging list of all outlets
      } catch (err) {
        console.error("❌ Gagal fetch all outlets:", err);
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
  }, [outletId]);

  // ✅ FETCH BARISTAS
  const fetchBaristas = async (outletId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `http://localhost:8080/api/baristas?outletId=${outletId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setBaristaOptions(data);
      console.log("✅ Baristas fetched:", data);
    } catch (error) {
      console.error("❌ Gagal ambil baristas:", error);
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
        `http://localhost:8080/api/shift/${outletId}?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.log(`❌ Server responded with status ${res.status}`);
        const errText = await res.text();
        console.log("❌ Response body:", errText);
        alert("Failed to fetch shifts");
        return;
      }

      const data = await res.json();
      console.log("✅ Fetched shifts data:", data);

      const shiftMap = buildShiftMap(data);
      setSchedules(shiftMap);
    } catch (error) {
      console.error("❌ Error fetching shifts:", error);
    }
  };

  // ✅ BUILD SHIFT MAP by outletId
  const buildShiftMap = (data: any[]) => {
    const shiftMap: any = {};

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

      const baristaIds = shift.baristas.map((b: any) => b.id);

      if (shift.shiftType === 1) {
        shiftMap[outletId][dateKey].morningShift = baristaIds;
      } else if (shift.shiftType === 2) {
        shiftMap[outletId][dateKey].eveningShift = baristaIds;
      }
    });

    console.log("✅ Shift map after build (by outletId):", shiftMap);
    return shiftMap;
  };

  // ✅ UPDATE SCHEDULE LOCAL STATE
  const updateSchedule = (newSchedule: any) => {
    setSchedules((prev: any) => ({
      ...prev,
      [outletId!]: {
        ...prev[outletId!],
        [selectedDateKey]: newSchedule,
      },
    }));
  };

  // ✅ SAVE SCHEDULE TO BACKEND
  const saveSchedule = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const dateShift = date.toISOString().split("T")[0];
      const currentOutlet = outlets.find((o) => o.outletId === outletId);

      if (!currentOutlet) {
        alert("❌ Outlet tidak ditemukan! Pastikan outlet telah dipilih.");
        return;
      }

      if (!currentOutlet.headBarId) {
        alert("❌ HeadBar belum di-assign di outlet ini!");
        return;
      }

      const headBarId = currentOutlet.headBarId;

      const shifts = [];

      if (currentSchedule.morningShift.length > 0) {
        shifts.push({
          shiftType: 1,
          dateShift,
          outletId,
          headBarId,
          baristaIds: currentSchedule.morningShift,
        });
      }

      if (currentSchedule.eveningShift.length > 0) {
        shifts.push({
          shiftType: 2,
          dateShift,
          outletId,
          headBarId,
          baristaIds: currentSchedule.eveningShift,
        });
      }

      console.log("✅ Shifts to save:", shifts);

      for (const shift of shifts) {
        const res = await fetch("http://localhost:8080/api/shift/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(shift),
        });

        if (!res.ok) {
          throw new Error(`❌ Gagal simpan shift! Status: ${res.status}`);
        }
      }

      alert("✅ Jadwal berhasil disimpan!");
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Gagal simpan shift:", error);
      alert("Gagal menyimpan jadwal.");
    }
  };

  const cancelEdit = () => {
    const confirmCancel = window.confirm(
      "Batal edit jadwal? Perubahan tidak akan disimpan."
    );
    if (!confirmCancel) return;

    setSchedules(backupSchedules);
    setIsEditing(false);
  };

  const handleOutletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (selectedValue === "" || !selectedValue) {
      setOutletId(null);
      setSelectedOutlet("");
      setBaristaOptions([]);
      setSchedules({});
      return;
    }

    const selectedId = parseInt(selectedValue);
    const selected = outlets.find((o) => o.outletId === selectedId);

    setOutletId(selectedId);
    setSelectedOutlet(selected?.outletName || "");
    console.log("✅ Selected outlet after change:", selected); // Debugging selected outlet after change

    fetchBaristas(selectedId);

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    fetchShiftsByRange(selectedId, startDate, endDate);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
      {/* Sidebar Kalender */}
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-4">
          Manajemen Jadwal ({userRole})
        </h2>

        {/* FIXED DROPDOWN - Added fixed position and higher z-index */}
        <div className="relative w-full z-50">
          <select
            value={outletId || ""}
            onChange={handleOutletChange}
            disabled={
              isEditing || (userRole !== "Admin" && userRole !== "C-Level")
            }
            className="px-4 py-2 border rounded-md w-full text-black bg-white"
          >
            <option value="">Pilih Outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.outletId} value={outlet.outletId}>
                {outlet.name}
              </option>
            ))}
          </select>
        </div>

        <Calendar
          onChange={(value) => setDate(value as Date)}
          value={date}
          className="mt-6 border border-gray-300 rounded-lg p-4"
        />

        <p className="mt-4 text-sm">Tanggal: {selectedDateKey}</p>
      </div>

      {/* Jadwal Shift */}
      <div className="bg-indigo-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">
          Jadwal Shift ({selectedOutlet})
        </h3>

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

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => {
              if (isEditing) {
                saveSchedule();
              } else {
                setBackupSchedules(JSON.parse(JSON.stringify(schedules)));
                setIsEditing(true);
              }
            }}
            className={`${
              isEditing
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white py-2 px-4 rounded-md w-full`}
          >
            {isEditing ? "Simpan Jadwal" : "Edit Jadwal"}
          </button>

          {isEditing && (
            <button
              onClick={cancelEdit}
              className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white py-2 px-4 rounded-md w-full transition duration-300"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );

  function renderShiftSection(
    title: string,
    shiftList: string[],
    shiftType: "morningShift" | "eveningShift"
  ) {
    return (
      <div className="mb-6">
        <h4 className="text-md font-semibold mb-2">{title}</h4>

        {shiftList.length === 0 && !isEditing && (
          <p className="text-gray-500">Belum ada barista di shift ini.</p>
        )}

        {shiftList.map((baristaId, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            {/* FIXED SELECT - Added higher z-index and inline styles */}
            <div className="relative flex-1 z-10">
              <select
                value={baristaId}
                onChange={(e) => {
                  const updated = [...shiftList];
                  updated[index] = e.target.value;
                  updateSchedule({
                    ...currentSchedule,
                    [shiftType]: updated,
                  });
                }}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-md text-black bg-white"
                style={{ color: "black" }}
              >
                <option
                  value=""
                  style={{ backgroundColor: "white", color: "black" }}
                >
                  Pilih Barista
                </option>
                {baristaOptions.map((opt) => (
                  <option
                    key={opt.id}
                    value={opt.id}
                    style={{ backgroundColor: "white", color: "black" }}
                  >
                    {opt.fullName} ({opt.role})
                  </option>
                ))}
              </select>
            </div>

            {isEditing && index > 0 && (
              <button
                onClick={() => {
                  const updated = shiftList.filter((_, i) => i !== index);
                  updateSchedule({
                    ...currentSchedule,
                    [shiftType]: updated,
                  });
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"
              >
                ❌
              </button>
            )}
          </div>
        ))}

        {isEditing && (
          <button
            onClick={() =>
              updateSchedule({
                ...currentSchedule,
                [shiftType]: [...shiftList, ""],
              })
            }
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
          >
            + Tambah Barista
          </button>
        )}
      </div>
    );
  }
}
