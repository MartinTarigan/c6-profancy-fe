import MyCalendar from "@/components/MyCalendar";

export default function ShiftPage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Header di layout, gak perlu disini */}

      <h3
        className="text-center text-[32px] md:text-[44px] font-bold leading-none mb-4 px-4 md:px-0"
        style={{
          color: "#5171E3",
          fontFamily: "Inter",
        }}
      >
        Manajemen Jadwal
      </h3>

      <MyCalendar />
    </div>
  );
}
