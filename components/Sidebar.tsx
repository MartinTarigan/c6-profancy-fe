"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, Home, Calendar, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
  hasDropdown?: boolean
  children?: React.ReactNode
}

const NavItem = ({ href, icon, label, isActive, hasDropdown, children }: NavItemProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 py-3 px-4 text-gray-700 hover:bg-primary-lightest transition-colors rounded-lg",
          isActive && "text-primary font-medium",
        )}
        onClick={(e) => {
          if (hasDropdown) {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
      >
        {icon}
        <span>{label}</span>
        {hasDropdown && (
          <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isOpen && "transform rotate-180")} />
        )}
      </Link>
      {hasDropdown && isOpen && (
        <div className="relative pl-4">
          <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-primary/20" />
          <div className="flex flex-col space-y-1 py-1">{children}</div>
        </div>
      )}
    </div>
  )
}

const SubNavItem = ({ href, label, isActive }: { href: string; label: string; isActive?: boolean }) => (
  <Link
    href={href}
    className={cn(
      "flex items-center py-2 px-4 text-gray-700 hover:bg-primary-lightest transition-colors rounded-md",
      isActive && "text-primary font-medium",
    )}
  >
    {label}
  </Link>
)

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        localStorage.clear()
        router.push("/login")
      } else {
        console.error("Logout gagal")
      }
    } catch (err) {
      console.error("Error saat logout:", err)
    }
  }

  return (
    <div className="fixed left-2 top-[100px] w-[280px] h-[calc(100vh-116px)] z-10">
      <div className="bg-primary-bg rounded-2xl h-full shadow-sm border border-gray-100 overflow-auto flex flex-col justify-between">
        <div className="flex flex-col py-4">
          <NavItem href="/" icon={<Home className="h-5 w-5" />} label="Home" isActive={pathname === "/"} />
          <NavItem
            href="/account/"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          />
          <NavItem href="/training" icon={<BookOpen className="h-5 w-5" />} label="Training" hasDropdown>
            <SubNavItem href="/training/ujian" label="Ujian" isActive={pathname === "/training/ujian"} />
            <SubNavItem href="/training-materials" label="Materi" isActive={pathname === "/training/materi"} />
            <SubNavItem
              href="/peer-review"
              label="Peer Review"
              isActive={pathname === "/peer-review"}
            />
          </NavItem>
          <NavItem href="/jadwal" icon={<Calendar className="h-5 w-5" />} label="Jadwal" hasDropdown>
            <SubNavItem href="/jadwal/lembur" label="Lembur" isActive={pathname === "/jadwal/lembur"} />
            <SubNavItem href="/jadwal/izin-cuti" label="Izin/Cuti" isActive={pathname === "/jadwal/izin-cuti"} />
            <SubNavItem href="/jadwal/shift" label="Shift" isActive={pathname === "/jadwal/shift"} />
          </NavItem>
        </div>

        <div className="p-4 mt-auto">
          <Button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white">
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}

