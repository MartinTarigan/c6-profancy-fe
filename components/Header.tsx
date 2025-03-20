"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Bell, User, Menu } from "lucide-react";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [role, setRole] = useState("User");

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  return (
    <header
      className="
        fixed top-0 left-0 z-50
        w-full
        h-[60px] md:h-[80px]
        bg-primary text-white
        flex items-center justify-between
        px-4 md:px-8
        shadow-md
      "
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger Menu */}
        <button
          className="md:hidden text-white"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <div className="flex items-center">
          <Image
            src="/images/login_logo.png"
            alt="Logo"
            width={60} // Adjust if needed
            height={0} // Auto height, because we use width
            priority
            className="dark:invert mt-1 mb-1"
          />
        </div>
      </div>

      {/* Right side */}
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
