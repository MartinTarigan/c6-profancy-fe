"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Bell, User, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const [role, setRole] = useState("User");

  useEffect(() => {
    const updateRole = () => {
      const storedRole = localStorage.getItem("role");
      if (storedRole) {
        setRole(storedRole);
      }
    };

    updateRole();
    window.addEventListener("roleChanged", updateRole);

    return () => window.removeEventListener("roleChanged", updateRole);
  }, []);

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full h-[60px] md:h-[80px] bg-primary text-white flex items-center justify-between px-4 md:px-8 shadow-md">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden text-white"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center">
          <Image
            src="/images/login_logo.png"
            alt="Logo"
            width={60}
            height={0}
            priority
            className="dark:invert mt-1 mb-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-5">
        <button className="text-white" aria-label="Notifications">
          <Bell className="h-6 w-6 md:h-7 md:w-7" />
        </button>

        <div className="flex items-center gap-2 md:gap-3 text-white">
          <User className="h-6 w-6 md:h-7 md:w-7" />
          <span className="hidden md:inline font-medium text-sm md:text-lg">
            {role}
          </span>
        </div>
      </div>
    </header>
  );
}
