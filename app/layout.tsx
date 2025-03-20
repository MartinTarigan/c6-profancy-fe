// app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Manajemen Jadwal | Tens Coffee",
  description: "Dashboard Shift Management untuk Barista dan Head Bar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="w-full h-full">
      <body className="w-full h-full m-0 p-0 bg-[#F9FAFB] text-gray-900">
        <Header />

        <div className="flex w-full min-h-screen pt-[60px] md:pt-[80px]">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 bg-white">{children}</main>
        </div>
      </body>
    </html>
  );
}
