"use client";

import { usePathname } from "next/navigation";
import {Sidebar} from "@/components/Sidebar";
import {Header} from "@/components/Header";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noLayoutPages = ["/login"];
  const showLayout = !noLayoutPages.includes(pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {showLayout && <Header />}
      <div className="flex flex-1 mt-2">
        {showLayout && <Sidebar />}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
