"use client"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, LogOut, User, Globe } from "lucide-react"
import { useState, useEffect } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    role: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [language, setLanguageState] = useState("id")
  const [username, setUsername] =  useState("");

  useEffect(() => {
    // Load language preference from localStorage if available
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage) {
      setLanguageState(savedLanguage)
    }

    setUsername(localStorage.getItem("username"));
  }, [])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  // Fungsi logout
  const handleLogout = () => {
    localStorage.clear()
    router.push("/login")
  }

  // Format role for display
  const displayRole = () => {
    if (user.role.includes("Admin")) return "Admin"
    if (user.role.includes("HeadBar")) return "Headbar Barista"
    if (user.role.includes("CEO")) return "CEO"
    return "Barista"
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="m-2 rounded-lg border border-white/10 bg-primary-foreground/10 p-3 hover:bg-primary-foreground/20 transition-colors text-white"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 rounded-md border border-border/30">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="rounded-md bg-primary/5 text-primary">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <Badge
                    variant="outline"
                    className="w-fit border-white/20 bg-white/10 px-1.5 text-xs font-normal text-white"
                  >
                    {displayRole()}
                  </Badge>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-white/80" />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 p-3 text-left text-sm">
                <Avatar className="h-9 w-9 rounded-md border border-border/30">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="rounded-md bg-primary/5 text-primary">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <Badge
                    variant="outline"
                    className="w-fit border-white/20 bg-white/10 px-1.5 text-xs font-normal text-white"
                  >
                    {displayRole()}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-white/80" />
                  <span className="text-sm">{language === "id" ? "Bahasa" : "Language"}</span>
                </div>
                <div className="flex rounded-md bg-muted/80 p-0.5">
                  <button
                    onClick={() => setLanguage("id")}
                    className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${
                      language === "id" 
                        ? "bg-white text-primary shadow-sm" 
                        : "text-muted-foreground hover:bg-white/20"
                    }`}
                  >
                    ID
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${
                      language === "en" 
                        ? "bg-white text-primary shadow-sm" 
                        : "text-muted-foreground hover:bg-white/20"
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuItem
            >
              <Link href={username ? `/account/${username}` : "/login"}>
                Profile
              </Link>
                
              </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Panggil handleLogout di onClick */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600 dark:hover:bg-red-950/10 dark:focus:bg-red-950/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
