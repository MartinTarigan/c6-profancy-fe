"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Home, Calendar, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  hasDropdown?: boolean;
  children?: React.ReactNode;
}

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  if (pathname === "/login") {
    return null;
  }


  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-[280px] h-screen bg-primary-bg p-4 border-r border-gray-200 shadow-sm">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 w-[240px] h-full bg-white shadow-lg transform transition-transform md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-end p-4">
          <button onClick={() => setIsOpen(false)}>
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <SidebarContent pathname={pathname} onLinkClick={() => setIsOpen(false)} />
      </aside>

      {/* Floating Button untuk Mobile */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-primary text-white rounded-full shadow-md md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <MenuIcon />
      </button>
    </>
  );
}

function SidebarContent({
  pathname,
  onLinkClick,
}: {
  pathname: string;
  onLinkClick?: () => void;
}) {
  return (
    <div className="flex flex-col space-y-1">
      <NavItem
        href="/"
        icon={<Home className="h-5 w-5" />}
        label="Home"
        isActive={pathname === "/"}
        onClick={onLinkClick}
      />
      <NavItem
        href="/account"
        icon={
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        label="Daftar Akun"
        isActive={pathname === "/account"}
        onClick={onLinkClick}
      />
      <NavItem
        href="/training"
        icon={<BookOpen className="h-5 w-5" />}
        label="Training"
        hasDropdown
      >
        <SubNavItem
          href="/training/ujian"
          label="Ujian"
          isActive={pathname === "/training/ujian"}
          onClick={onLinkClick}
        />
        <SubNavItem
          href="/training/materi"
          label="Materi"
          isActive={pathname === "/training/materi"}
          onClick={onLinkClick}
        />
        <SubNavItem
          href="/training/peer-review"
          label="Peer Review"
          isActive={pathname === "/training/peer-review"}
          onClick={onLinkClick}
        />
      </NavItem>
      <NavItem
        href="/jadwal"
        icon={<Calendar className="h-5 w-5" />}
        label="Jadwal"
        hasDropdown
      >
        <SubNavItem
          href="/jadwal/lembur"
          label="Lembur"
          isActive={pathname === "/jadwal/lembur"}
          onClick={onLinkClick}
        />
        <SubNavItem
          href="/jadwal/izin-cuti"
          label="Izin/Cuti"
          isActive={pathname === "/jadwal/izin-cuti"}
          onClick={onLinkClick}
        />
        <SubNavItem
          href="/jadwal/shift"
          label="Shift"
          isActive={pathname === "/shift"}
          onClick={onLinkClick}
        />
      </NavItem>
    </div>
  );
}

const NavItem = ({
  href,
  icon,
  label,
  isActive,
  hasDropdown,
  children,
  onClick,
}: NavItemProps & { onClick?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (hasDropdown) {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else {
      onClick?.();
    }
  };

  return (
    <div>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 py-3 px-4 text-gray-700 hover:bg-primary-lightest transition-colors rounded-lg",
          isActive && "text-primary font-medium"
        )}
        onClick={handleClick}
      >
        {icon}
        <span>{label}</span>
        {hasDropdown && (
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 transition-transform",
              isOpen && "transform rotate-180"
            )}
          />
        )}
      </Link>
      {hasDropdown && isOpen && (
        <div className="relative pl-4">
          <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-primary/20" />
          <div className="flex flex-col space-y-1 py-1">{children}</div>
        </div>
      )}
    </div>
  );
};

const SubNavItem = ({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <Link
    href={href}
    className={cn(
      "flex items-center py-2 px-4 text-gray-700 hover:bg-primary-lightest transition-colors rounded-md",
      isActive && "text-primary font-medium"
    )}
    onClick={onClick}
  >
    {label}
  </Link>
);

const MenuIcon = () => (
  <svg
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
