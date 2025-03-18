"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Bell, User } from "lucide-react"

export function Header() {
  const [role, setRole] = useState("User")

  useEffect(() => {
    const storedRole = localStorage.getItem("role")
    if (storedRole) {
      setRole(storedRole)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 p-2 z-20">
      <header className="bg-primary h-[80px] flex items-center justify-between px-8 rounded-2xl shadow-sm">
        <div className="hidden md:flex md:w-1/2 items-center">
          <Image
            className="dark:invert mt-3 mb-3"
            src="/images/login_logo.png"
            alt="Logo"
            width={90}
            height={90}
            priority
          />
        </div>
        <div className="flex items-center gap-5">
          <button className="text-white">
            <Bell className="h-7 w-7" />
          </button>
          <div className="flex items-center gap-3 text-white">
            <User className="h-7 w-7" />
            <span className="font-medium text-lg">{role}</span>
          </div>
        </div>
      </header>
    </div>
  )
}

