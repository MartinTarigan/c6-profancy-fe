import MyCalendar from "@/components/MyCalendar"; // Pastikan path ini sesuai dengan struktur project kamu

export default function ShiftPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Halaman Jadwal Shift</h1>
      <MyCalendar /> {/* Ini memanggil komponen MyCalendar */}
    </div>
  );
}
