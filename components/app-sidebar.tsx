"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();

  const [user, setUser] = React.useState({
    name: "",
    email: "",
    avatar: "/images/Mascott Tens@300x.png",
  });

  React.useEffect(() => {
    setUser({
      name: localStorage.getItem("username") ?? "",
      email: localStorage.getItem("roles") ?? "",
      avatar: "/images/Mascott Tens@300x.png",
    });
  }, []);

  const handleIzinCutiClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesi Anda telah berakhir. Silakan login kembali.");
      router.push("/login");
      return;
    }

    const userRoles = localStorage.getItem("roles") ?? "";
    if (userRoles.includes("HeadBar")) {
      router.push("/jadwal/izin-cuti/headbar");
    } else {
      router.push("/jadwal/izin-cuti/barista");
    }
  };

  const navMain = [
    {
      title: "Training",
      url: "#",
      icon: BookOpen,
      isActive: true,
      items: [
        { title: "Ujian", url: "/training/ujian" },
        { title: "Materi", url: "/training-materials" },
        { title: "Peer Review", url: "/peer-review" },
      ],
    },
    {
      title: "Jadwal",
      url: "#",
      icon: Calendar,
      items: [
        { title: "Lembur", url: "/jadwal/lembur" },
        {
          title: "Izin/Cuti",
          url: "/jadwal/izin-cuti",
          onClick: handleIzinCutiClick, // ✅ tambahkan onClick khusus
        },
        { title: "Shift", url: "/jadwal/shift" },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Image
          className="dark:invert mt-3 mb-3"
          src="/images/login_logo.png"
          alt="Logo"
          width={120}
          height={10}
          priority
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
