"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noLayoutPages = ["/login"];
  const showLayout = !noLayoutPages.includes(pathname);
  if (!showLayout) return <>{children}</>;
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 mt-5">
        <Sidebar />
        <main className="ml-[290px] pt-[100px] p-6 flex-1">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
