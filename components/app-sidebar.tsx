"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpen, Calendar } from "lucide-react";

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

  // State untuk menampung URL dinamis "Izin/Cuti"
  const [izinCutiUrl, setIzinCutiUrl] = React.useState("");
  const [lemburUrl, setLemburUrl] = React.useState("");
  const [shiftiUrl, setShiftUrl] = React.useState("");

  React.useEffect(() => {
    const storedName = localStorage.getItem("username") ?? "";
    const storedRoles = localStorage.getItem("roles") ?? "";
    const token = localStorage.getItem("token");

    setUser({
      name: storedName,
      email: storedRoles,
      avatar: "/images/Mascott Tens@300x.png",
    });

    // Jika tidak ada token, user dianggap sesi kadaluarsa
    if (!token) {
      return;
    }

    // Tentukan URL dinamis berdasarkan roles
    if (storedRoles.includes("HeadBar")) {
      setIzinCutiUrl("/jadwal/izin-cuti/headbar");
    } else {
      setIzinCutiUrl("/jadwal/izin-cuti/barista");
    }

    if (storedRoles.includes("Admin")) {
      setShiftUrl("/jadwal/shift/admin");
    } else {
      setShiftUrl("/jadwal/shift");
    }

    if (storedRoles.includes("HeadBar")) {
      setLemburUrl("/jadwal/lembur/headbar");
    } else {
      setLemburUrl("/jadwal/lembur");
    }
  }, []);

  const handleIzinCutiClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesi Anda telah berakhir. Silakan login kembali.");
      router.push("/login");
      return;
    }

    // Arahkan ke URL dinamis yang sudah ditentukan
    if (izinCutiUrl) {
      router.push(izinCutiUrl);
    }
  };

  const handleShiftClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesi Anda telah berakhir. Silakan login kembali.");
      router.push("/login");
      return;
    }

    // Arahkan ke URL dinamis yang sudah ditentukan
    if (shiftiUrl) {
      router.push(shiftiUrl);
    }
  };

  const handleLemburClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesi Anda telah berakhir. Silakan login kembali.");
      router.push("/login");
      return;
    }

    // Arahkan ke URL dinamis yang sudah ditentukan
    if (lemburUrl) {
      router.push(lemburUrl);
    }
  };

  // Perhatikan di item "Izin/Cuti":
  // - Kita bisa beri url: "#" agar Link tidak benar-benar ke mana-mana
  // - Gunakan onClick untuk menentukan ke mana user diarahkan
  const navMain = [
    {
      title: "Training",
      url: "#",
      icon: BookOpen,
      isActive: true,
      items: [
        { title: "Ujian", url: "/assessment" },
        { title: "Materi", url: "/training-materials" },
        { title: "Peer Review", url: "/peer-review" },
        { title: "Barista", url: "/barista" },
      ],
    },
    {
      title: "Jadwal",
      url: "#",
      icon: Calendar,
      items: [
        { title: "Lembur", url: lemburUrl, onClick: handleLemburClick },
        {
          title: "Izin/Cuti",
          url: izinCutiUrl,
          onClick: handleIzinCutiClick,
        },
        { title: "Shift", url: shiftiUrl, onClick: handleShiftClick },
        { title: "Dashboard", url: "/jadwal/shift/dashboard" },
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
