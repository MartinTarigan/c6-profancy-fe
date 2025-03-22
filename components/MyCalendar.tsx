"use client";

import { useState, useEffect, Key } from "react";
import Calendar from "react-calendar";
import Toast from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");

  const [toast, setToast] = useState<{ type: string; message: string } | null>(
    null
  );

  const selectedDateKey = date.toDateString();
  const currentOutletSchedules = schedules[outletId!] || {};
  const currentSchedule = currentOutletSchedules[selectedDateKey] || {
    morningShift: [],
    eveningShift: [],
  };

  const validateShift = (shiftList: string[], minBarista: number) => {
    const validBaristas = shiftList.filter((id) => id !== "");
    return validBaristas.length >= minBarista;
  };

  const getDoubleShiftBaristas = () => {
    const pagi = currentSchedule.morningShift.filter((id: string) => id !== "");
    const sore = currentSchedule.eveningShift.filter((id: string) => id !== "");
    const duplicates = pagi.filter((id: any) => sore.includes(id));
    return duplicates;
  };

  const isMorningShiftValid = validateShift(currentSchedule.morningShift, 1);
  const isEveningShiftValid = validateShift(currentSchedule.eveningShift, 2);
  const doubleShiftBaristas = getDoubleShiftBaristas();

  {
    /* GLOBAL WARNING */
  }
  {
    isEditing && getDoubleShiftBaristas().length > 0 && (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
        <p className="font-semibold">⚠️ Catatan:</p>
        {getDoubleShiftBaristas().map((baristaId: Key | null | undefined) => {
          const barista = baristaOptions.find((b) => b.id === baristaId);
          return (
            <p key={baristaId}>
              Barista <strong>{barista?.fullName || baristaId}</strong>{" "}
              seharusnya tidak diassign ke dua shift di tanggal yang sama.
            </p>
          );
        })}
      </div>
    );
  }
  useEffect(() => {
    if (!isEditing) return;

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
  }, [isEditing]);

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
          // console.error("❌ Outlet not found for the user");
        }

        if (userRes.data.role === "admin" || userRes.data.role === "clevel") {
          fetchAllOutlets(token); // Admin or C-Level can select any outlet
        } else {
          // console.log("Non-admin, outlet associated with user:", outlet);
        }
      } catch (err) {
        // console.error("❌ Gagal fetch user data:", err);
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
          const matchedOutlet = data.find(
            (o: { name: string }) => o.name === userOutletName
          );
          if (matchedOutlet) {
            setSelectedOutlet(matchedOutlet.name);
            setOutletId(matchedOutlet.outletId); // Set the outletId for selected outlet
            console.log("✅ Outlet selected:", matchedOutlet); // Debugging selected outlet
          } else {
            // console.error("❌ Outlet terkait dengan pengguna tidak ditemukan");
          }
        }

        console.log("✅ All outlets:", data); // Debugging list of all outlets
      } catch (err) {
        // console.error("❌ Gagal fetch all outlets:", err);
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
      // console.error("❌ Gagal ambil baristas:", error);
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
        // console.log(`❌ Server responded with status ${res.status}`);
        const errText = await res.text();
        // console.log("❌ Response body:", errText);
        alert("Failed to fetch shifts");
        return;
      }

      const data = await res.json();
      console.log("✅ Fetched shifts data:", data);

      const shiftMap = buildShiftMap(data);
      setSchedules(shiftMap);
    } catch (error) {
      // console.error("❌ Error fetching shifts:", error);
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

      // const dateShift = date.toISOString().split("T")[0];
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // tambah leading zero
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const dateShift = formatDate(date);
      const currentOutlet = outlets.find((o) => o.outletId === outletId);

      // if (
      //   !isMorningShiftValid ||
      //   !isEveningShiftValid ||
      //   doubleShiftBaristas.length > 0
      // ) {
      //   alert("❌ Periksa kembali validasi shift sebelum menyimpan!");
      //   return;
      // }

      if (!currentOutlet) {
        // alert("❌ Outlet tidak ditemukan! Pastikan outlet telah dipilih.");
        setToast({
          type: "error",
          message: "Outlet tidak ditemukan! Pastikan outlet telah dipilih.",
        });

        return;
      }

      if (!currentOutlet.headBarId) {
        // alert("❌ HeadBar belum di-assign di outlet ini!");
        setToast({
          type: "error",
          message: "HeadBar belum di-assign di outlet ini!",
        });

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
          // throw new Error(`❌ Gagal simpan shift! Status: ${res.status}`);
          setToast({
            type: "error",
            message: `Gagal simpan shift! Status: ${res.status}`,
          });
          return;
        }
      }

      // alert("✅ Jadwal berhasil disimpan!");
      setToast({ type: "success", message: "Jadwal berhasil disimpan!" });
      setIsEditing(false);
    } catch (error) {
      console.error("Gagal simpan shift:", error);
      setToast({
        type: "error",
        message: "Gagal menyimpan jadwal. Silakan coba lagi!",
      });

      // alert("Gagal menyimpan jadwal.");
    }
  };

  // const cancelEdit = () => {
  //   const confirmCancel = window.confirm(
  //     "Batal edit jadwal? Perubahan tidak akan disimpan."
  //   );
  //   if (!confirmCancel) return;

  //   setSchedules(backupSchedules);
  //   setIsEditing(false);
  // };
  const cancelEdit = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmCancel = () => {
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
  useEffect(() => {
    const date = new Date();
    const newDate = date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setFormattedDate(newDate);
  }, []);
  if (!formattedDate) return null;

  

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-6 gap-4">
      {toast && (
        <Toast
          type={
            toast.type as "error" | "success" | "info" | "warning" | undefined
          } // Fix the code by adding a comma at the end
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* ✅ CONFIRM MODAL ADA DI SINI */}
      {showConfirmModal && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => {
            // Tindakan yang mau dijalankan saat confirm, misal:
            handleConfirmCancel(); // atau saveSchedule()
          }}
          title={isEditing ? "Simpan atau Batalkan Edit?" : "Konfirmasi"}
          message={
            isEditing
              ? "Kamu ingin menyimpan perubahan atau membatalkan edit jadwal ini?"
              : "Apakah kamu yakin ingin melanjutkan?"
          }
        />
      )}

      {/* {showConfirmModal && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmCancel}
          title="Batalkan Edit Jadwal"
          message="Batal edit jadwal? Perubahan tidak akan disimpan."
        />
      )} */}

      {/* SECTION PILIH OUTLET */}
      <div className="flex flex-col items-center w-full gap-2">
        {/* <label
          className="text-center text-[20px] font-medium leading-none"
          style={{
            color: "#5171E3",        // Tens-Muted-Blue
            fontFamily: "Inter",
          }}
        >
          Pilih Outlet
        </label> */}

        <div className="relative w-full max-w-md">
          <select
            value={outletId || ""}
            onChange={handleOutletChange}
            disabled={
              isEditing || (userRole !== "admin" && userRole !== "clevel")
            }
            className="w-full px-4 py-3 rounded-[12px] bg-[#EFF2FF] text-center text-[20px] font-medium text-[#5171E3] appearance-none border-none"
            style={{
              fontFamily: "Inter",
            }}
          >
            <option value="" className="text-[#5171E3]">
              Pilih Outlet
            </option>
            {outlets.map((outlet) => (
              <option
                key={outlet.outletId}
                value={outlet.outletId}
                className="text-[#5171E3]"
              >
                {outlet.name}
              </option>
            ))}
          </select>

          {/* Chevron Icon */}
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg
              className="h-5 w-5 text-[#5171E3]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.25 4.417a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* SECTION KALENDER + JADWAL */}
      <div
        className="flex flex-col md:flex-row justify-center items-center gap-[10px] w-full rounded-[20px] shadow-md bg-[#EDF1FF]"
        style={{
          padding: "28px 40px",
          alignSelf: "stretch", // Supaya bisa full container
        }}
      >
        {" "}
        {/* Sidebar Kalender */}
        <div className="flex flex-col items-center">
          <Calendar
            onChange={(value) => setDate(value as Date)}
            value={date}
            className="react-calendar"
            tileClassName={({ date }) => {
              if (date.toDateString() === new Date().toDateString()) {
                return "selected-tile";
              }
              return "";
            }}
          />
        </div>
        {/* Jadwal Shift */}
        <div className="jadwal-shift bg-white pt-0 px-0 pb-6 rounded-lg shadow-md w-full max-w-md overflow-hidden">
          {/* Header tanggal */}
          {/* <div className="bg-[#5171E3] text-white text-center w-full py-3 rounded-t-lg">
            <h3 className="text-lg font-semibold">{formattedDate}</h3>
          </div> */}
          {formattedDate && (
            <div className="bg-[#5171E3] text-white text-center w-full py-3 rounded-t-lg">
              <h3 className="text-lg font-semibold">{formattedDate}</h3>
            </div>
          )}
          {/* Wrapper isi konten shift + catatan */}
          <div className="px-6 mt-4">
            {/* Warning Catatan */}
            {isEditing && doubleShiftBaristas.length > 0 && (
              <div className="text-yellow-800 text-xs mb-4 max-w-xs">
                <p className="font-semibold flex items-center gap-1">
                  ⚠️ Catatan:
                </p>
                {doubleShiftBaristas.map((baristaId: string, idx: any) => {
                  const barista = baristaOptions.find(
                    (b) => b.id === baristaId
                  );
                  return (
                    <p key={`${baristaId}-${idx}`}>
                      Barista{" "}
                      <strong>
                        {barista ? barista.fullName : `ID ${baristaId}`}
                      </strong>{" "}
                      seharusnya tidak boleh diassign ke dua shift pada tanggal
                      yang sama.
                    </p>
                  );
                })}
              </div>
            )}

            {/* Shift Pagi */}
            {renderShiftSection(
              "Shift Pagi",
              currentSchedule.morningShift,
              "morningShift"
            )}

            {/* Shift Sore */}
            {renderShiftSection(
              "Shift Sore",
              currentSchedule.eveningShift,
              "eveningShift"
            )}

            {/* Tombol Aksi */}
            {userRole === "head_bar" && (
              <div className=" btn-cancel-edit flex gap-4 mt-6">
                {isEditing && (
                  <button
                    onClick={cancelEdit}
                    className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white py-2 px-4 rounded-md w-full transition duration-300"
                  >
                    Cancel
                  </button>
                )}

                <button
                  onClick={() => {
                    if (isEditing) {
                      saveSchedule();
                    } else {
                      setBackupSchedules(JSON.parse(JSON.stringify(schedules)));
                      setIsEditing(true);
                    }
                  }}
                  className={`btn-simpan-jadwal ${
                    isEditing
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white py-2 px-4 rounded-md w-full transition duration-300`}
                >
                  {isEditing ? "Simpan Jadwal" : "Edit Jadwal"}
                </button>
              </div>
            )}
          </div>{" "}
          {/* end px-6 wrapper */}
        </div>
      </div>
    </div>
  );

  function renderShiftSection(
    title: string,
    shiftList: string[],
    shiftType: "morningShift" | "eveningShift"
  ) {
    const hasValidBarista = shiftList.some((baristaId) => baristaId !== "");

    // Tentuin minimal barista tiap shift
    const minBarista = shiftType === "morningShift" ? 1 : 2;

    const isValidShift = validateShift(shiftList, minBarista);

    const availableBaristas = (index: number) => {
      const selectedIds = shiftList.filter((_, i) => i !== index);
      return baristaOptions.filter((b) => !selectedIds.includes(b.id));
    };

    return (
      <div className="mb-6">
        <h4
          className="text-md font-semibold mb-4 px-4 py-2 text-center mx-auto"
          style={{
            borderRadius: "24px",
            border: "2px solid #D5DEFF",
            color: "#5171E3", // Warna teks biru seperti yang lain
            width: "fit-content", // Supaya width-nya mengikuti isi
            fontFamily: "Inter",
            backgroundColor: "#ffffff", // Biar kontras sama section bg
          }}
        >
          {title}
        </h4>

        {/* WARNING untuk minimal barista */}
        {!isValidShift && isEditing && (
          <p className="text-red-600 text-sm mb-2">
            Catatan: Minimal {minBarista} barista yang harus dipilih di {title}.
          </p>
        )}

        {/* WARNING belum pilih outlet */}
        {!outletId && (
          <p className="text-gray-500">
            Tidak ada data. Silahkan pilih outlet terlebih dahulu.
          </p>
        )}

        {/* Kalau gak ada barista & gak editing */}
        {outletId && !hasValidBarista && !isEditing && (
          <p className="text-gray-500">Belum ada barista di shift ini.</p>
        )}

        {/* Render dropdown */}
        {(isEditing || hasValidBarista) &&
          shiftList.map((baristaId, index) => {
            if (!isEditing && baristaId === "") return null;

            return (
              <div key={index} className="flex items-center gap-2 mb-2">
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
                    className="dropdown-barista w-full px-4 py-3 rounded-[12px] bg-[#EFF2FF] text-center text-[16px] font-medium text-[#5171E3] appearance-none border-none"
                    style={{
                      fontFamily: "Inter",
                    }}
                  >
                    <option value="" className="text-[#5171E3]">
                      Pilih Barista
                    </option>
                    {availableBaristas(index).map((opt) => (
                      <option
                        key={opt.id}
                        value={opt.id}
                        className="text-[#5171E3]"
                      >
                        {opt.fullName} ({opt.role})
                      </option>
                    ))}
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg
                      className="h-5 w-5 text-[#5171E3]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.25 4.417a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                {isEditing && (
                  <button
                    onClick={() => {
                      const updated = shiftList.filter((_, i) => i !== index);
                      updateSchedule({
                        ...currentSchedule,
                        [shiftType]: updated,
                      });
                    }}
                    className=" btn-hapus-barista 
                    bg-[#E45252]
                    hover:bg-[#c73838]
                    text-white
                    px-4 py-2
                    rounded-[7.253px]
                    text-sm
                    font-medium
                    transition
                    duration-300
                  "
                  >
                    Hapus
                  </button>
                )}
              </div>
            );
          })}

        {isEditing && (
          <button
            onClick={() =>
              updateSchedule({
                ...currentSchedule,
                [shiftType]: [...shiftList, ""],
              })
            }
            className={`btn-tambah-barista text-[#5171E3] font-medium py-2 px-4 border-2 border-[#D5DEFF] rounded-[24px] bg-white hover:bg-[#5171E3] hover:text-white transition duration-300`}
            style={{
              fontFamily: "Inter",
            }}
          >
            + Tambah Barista
          </button>
        )}
      </div>
    );
  }
}
