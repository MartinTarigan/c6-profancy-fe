/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import Image from "next/image";
import { BookOpen, Calendar, Home, Bell, Users, Coffee } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

interface Notification {
  id: string;
  message: string;
  read: boolean;
}

const POLLING_CONFIG = {
  ACTIVE_INTERVAL: 30000,
  INACTIVE_INTERVAL: 120000,
  BACKOFF_FACTOR: 1.5,
  MAX_INTERVAL: 300000,
  INACTIVITY_THRESHOLD: 60000,
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: "",
    email: "",
    avatar: "/images/Mascott Tens@300x.png",
    role: "",
  });
  const [navItems, setNavItems] = React.useState<any[]>([]);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [userRoles, setUserRoles] = React.useState<string>("");

  const lastUserActivityRef = React.useRef(Date.now());
  const pollingIntervalRef = React.useRef(POLLING_CONFIG.ACTIVE_INTERVAL);
  const pollingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const failedAttemptsRef = React.useRef(0);

  const fetchNotifications = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    if (!token || !username) {
      setNotificationCount(0);
      return;
    }
    try {
      const res = await fetch(
        `https://rumahbaristensbe-production.up.railway.app/api/notifications/${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch");
      // Ambil array notifikasi dari field `data`
      const json = (await res.json()) as {
        status: number;
        message: string;
        timestamp: string;
        data: Notification[];
      };
      const notifications = json.data;
      const unread = notifications.filter((n) => !n.read).length;
      setNotificationCount(unread);
      failedAttemptsRef.current = 0;
      pollingIntervalRef.current = POLLING_CONFIG.ACTIVE_INTERVAL;
    } catch {
      failedAttemptsRef.current += 1;
      pollingIntervalRef.current = Math.min(
        pollingIntervalRef.current * POLLING_CONFIG.BACKOFF_FACTOR,
        POLLING_CONFIG.MAX_INTERVAL
      );
    } finally {
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = setTimeout(
        fetchNotifications,
        pollingIntervalRef.current
      );
    }
  }, []);

  const updateUserActivity = React.useCallback(() => {
    lastUserActivityRef.current = Date.now();
    if (pollingIntervalRef.current !== POLLING_CONFIG.ACTIVE_INTERVAL) {
      pollingIntervalRef.current = POLLING_CONFIG.ACTIVE_INTERVAL;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
        fetchNotifications();
      }
    }
  }, [fetchNotifications]);

  React.useEffect(() => {
    const storedName = localStorage.getItem("username") ?? "";
    const storedRoles = localStorage.getItem("roles") ?? "";
    const token = localStorage.getItem("token");
    setUser({
      name: storedName || "John Doe",
      email: storedRoles || "user@example.com",
      avatar: "/images/Mascott Tens@300x.png",
      role: storedRoles || "Barista",
    });
    setUserRoles(storedRoles);
    if (!token) {
      setNotificationCount(0);
      setNavItems([]);
    } else {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const generateNavItems = React.useCallback((roles: string, count: number) => {
    const baseItems = [
      {
        title: "Home",
        url: roles.includes("Admin")
          ? "/jadwal/shift/admin"
          : roles.includes("CLEVEL")
          ? "/jadwal/shift/dashboard"
          : roles.includes("HeadBar")
          ? "/"
          : "/",
        icon: Home,
        standalone: true,
      },
      {
        title: "Notifications",
        url: "/notification",
        icon: Bell,
        standalone: true,
        badge: count > 0 ? count : undefined,
      },
    ];
    let roleItems: any[] = [];
    if (roles.includes("Admin")) {
      roleItems = [
        {
          title: "Account Management",
          url: "/account",
          icon: Users,
          standalone: true,
        },
        {
          title: "Training Management",
          url: "#",
          icon: BookOpen,
          items: [
            { title: "Assessment", url: "/assessment" },
            { title: "Material", url: "/training-materials" },
            { title: "Peer Review", url: "/peer-review" },
          ],
        },
      ];
    } else if (roles.includes("HeadBar")) {
      roleItems = [
        {
          title: "Account Management",
          url: "/account",
          icon: Users,
          standalone: true,
        },
        {
          title: "Training Management",
          url: "#",
          icon: BookOpen,
          items: [
            { title: "Assessment", url: "/assessment" },
            { title: "Material", url: "/training-materials" },
            { title: "Peer Review", url: "/peer-review" },
          ],
        },
        {
          title: "Schedule Management",
          url: "#",
          icon: Calendar,
          items: [
            {
              title: "Overtime Management",
              url: "/jadwal/lembur/headbar",
            },
            {
              title: "Leave Management",
              url: "/jadwal/izin-cuti/headbar",
            },
            { title: "Shift Management", url: "/jadwal/shift" },
          ],
        },
      ];
    } else if (roles.includes("CLEVEL")) {
      roleItems = [
        {
          title: "Account Management",
          url: "/account",
          icon: Users,
          standalone: true,
        },
        {
          title: "Training",
          url: "#",
          icon: BookOpen,
          items: [
            {
              title: "Peer Review & Grading",
              url: "/peer-review/dashboard",
            },
            {
              title: "Performance Grading",
              url: "/assessment/dashboard-clevel",
            },
          ],
        },
      ];
    } else {
      roleItems = [
        {
          title: "Training",
          url: "#",
          icon: BookOpen,
          items: [
            { title: "Assessment", url: "/assessment" },
            { title: "Material", url: "/training-materials" },
            { title: "Peer Review", url: "/peer-review" },
          ],
        },
        {
          title: "Schedule",
          url: "#",
          icon: Calendar,
          items: [
            { title: "Request Overtime", url: "/jadwal/lembur" },
            {
              title: "Request Leave",
              url: "/jadwal/izin-cuti/barista",
            },
            { title: "Shift", url: "/jadwal/shift" },
          ],
        },
      ];
    }
    setNavItems([...baseItems, ...roleItems]);
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      generateNavItems(userRoles, notificationCount);
    } else {
      setNavItems([]);
    }
  }, [userRoles, notificationCount, generateNavItems]);

  React.useEffect(() => {
    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "mousemove",
      "touchstart",
      "click",
    ];
    events.forEach((e) => window.addEventListener(e, updateUserActivity));
    return () =>
      events.forEach((e) => window.removeEventListener(e, updateUserActivity));
  }, [updateUserActivity]);

  React.useEffect(() => {
    const checkInactivity = setInterval(() => {
      if (
        Date.now() - lastUserActivityRef.current >
        POLLING_CONFIG.INACTIVITY_THRESHOLD
      ) {
        pollingIntervalRef.current = POLLING_CONFIG.INACTIVE_INTERVAL;
      }
    }, 10000);
    return () => clearInterval(checkInactivity);
  }, []);

  React.useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener("notificationsUpdated", handler);
    return () => window.removeEventListener("notificationsUpdated", handler);
  }, [fetchNotifications]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/10 bg-primary shadow-sm"
      {...props}
    >
      <SidebarHeader className="flex items-center justify-center border-b border-border/10 px-6 py-5">
        <div className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-white" />
          <Image
            className="dark:invert"
            src="/images/login_logo.png"
            alt="Logo"
            width={100}
            height={10}
            priority
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/10 bg-muted/5">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail className="bg-muted/5" />
    </Sidebar>
  );
}
