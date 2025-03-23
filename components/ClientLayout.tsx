"use client";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noLayoutPages = ["/login"];
  const showLayout = !noLayoutPages.includes(pathname);

  if (!showLayout) return <>{children}</>;

  return (
    <SidebarProvider>
      <AppSidebar />
        <SidebarTrigger />
      <main className="flex justify-center pl-[10px] px-4 py-6 w-full">
        <div className="w-full max-w-5xl">{children}</div>
      </main>
    </SidebarProvider>
  );
}
