import MyCalendar from "@/components/MyCalendar";


export default function ShiftPage() {
  return (
    // <div className="min-h-screen  py-8 px-6">
    <div className="min-h-screen   px-6">

      <div className="max-w-7xl mx-auto">
        <h3
          className="text-center text-[44px] font-bold leading-none mb-[10px]"
          style={{
            color: "#5171E3",
            fontFamily: "Inter",
          }}
        >
          Manajemen Jadwal
        </h3>

        <MyCalendar />
      </div>
    </div>
  );
}
