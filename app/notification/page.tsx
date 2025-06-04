/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Filter,
  RefreshCw,
  Search,
  SortDesc,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Notification type definition
interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  resourceType: string;
  resourceId: number;
  actionUrl: string;
  read: boolean;
}

// Smart polling configuration
const POLLING_CONFIG = {
  ACTIVE_INTERVAL: 30000, // 30 seconds when user is active
  INACTIVE_INTERVAL: 120000, // 2 minutes when user is inactive
  BACKOFF_FACTOR: 1.5, // Exponential backoff factor
  MAX_INTERVAL: 300000, // 5 minutes maximum interval
  INACTIVITY_THRESHOLD: 60000, // 1 minute of inactivity
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [activeTab, setActiveTab] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());
  const [currentPollingInterval, setCurrentPollingInterval] = useState(
    POLLING_CONFIG.ACTIVE_INTERVAL
  );
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const failedAttemptsRef = useRef(0);

  // Track user activity
  const updateUserActivity = useCallback(() => {
    setLastUserActivity(Date.now());
    // Reset to active polling interval when user is active
    if (currentPollingInterval !== POLLING_CONFIG.ACTIVE_INTERVAL) {
      setCurrentPollingInterval(POLLING_CONFIG.ACTIVE_INTERVAL);
      // Restart polling with new interval
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
        fetchNotifications();
      }
    }
  }, [currentPollingInterval]);

  // Add event listeners for user activity
  useEffect(() => {
    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "mousemove",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      window.addEventListener(event, updateUserActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateUserActivity);
      });
    };
  }, [updateUserActivity]);

  // Check for user inactivity
  useEffect(() => {
    const inactivityCheck = setInterval(() => {
      const now = Date.now();
      if (now - lastUserActivity > POLLING_CONFIG.INACTIVITY_THRESHOLD) {
        // User is inactive, slow down polling
        setCurrentPollingInterval(POLLING_CONFIG.INACTIVE_INTERVAL);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(inactivityCheck);
  }, [lastUserActivity]);

  // Fetch notifications with smart polling
  const fetchNotifications = useCallback(async () => {
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token");

    if (!username || !token) {
      setError("Sesi Anda telah berakhir. Silakan login kembali.");
      router.push("/login");
      return;
    }

    try {
      setIsRefreshing(true);
      const response = await fetch(
        `http://localhost:8080/api/notifications/${username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const result = await response.json();
      setNotifications(result.data || []);
      // Reset failed attempts on success
      failedAttemptsRef.current = 0;
      // Use active interval on successful fetch
      setCurrentPollingInterval(POLLING_CONFIG.ACTIVE_INTERVAL);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Gagal memuat notifikasi. Silakan coba lagi nanti.");
      // Increment failed attempts for backoff
      failedAttemptsRef.current += 1;
      // Apply exponential backoff
      const backoffInterval = Math.min(
        currentPollingInterval *
          Math.pow(POLLING_CONFIG.BACKOFF_FACTOR, failedAttemptsRef.current),
        POLLING_CONFIG.MAX_INTERVAL
      );
      setCurrentPollingInterval(backoffInterval);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);

      // Schedule next poll
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
      pollingTimeoutRef.current = setTimeout(
        fetchNotifications,
        currentPollingInterval
      );
    }
  }, [router, currentPollingInterval]);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchNotifications();

    return () => {
      // Clean up timeout on unmount
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [fetchNotifications]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...notifications];

    // Filter by read status
    if (activeTab === "unread") {
      filtered = filtered.filter((notification) => !notification.read);
    } else if (activeTab === "read") {
      filtered = filtered.filter((notification) => notification.read);
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(
        (notification) => notification.type === filterType
      );
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredNotifications(filtered);
  }, [notifications, activeTab, filterType, searchQuery, sortOrder]);

  // Handle manual refresh
  const handleRefresh = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    fetchNotifications();
  };

  // Mark notification as read
  const markAsRead = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );

      await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`Marked notification ${id} as read`);
    } catch (err) {
      console.error("Error marking notification as read:", err);
      // Revert optimistic update on error
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: false }
            : notification
        )
      );
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );

      // This is a placeholder for the actual API call
      // In a real implementation, you would call your API to mark all as read
      // await fetch(`http://localhost:8080/api/notifications/mark-all-read`, {
      //   method: 'PUT',
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });

      // For now, we'll simulate a successful API call
      console.log("Marked all notifications as read");
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      // Revert optimistic update on error
      fetchNotifications();
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to the action URL if provided
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // Get notification type badge
  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case "ASSESSMENT_ASSIGNED":
      case "ESSAY_REVIEW_REQUIRED":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">Assessment</Badge>
        );
      case "PEER_REVIEW_ASSIGNED":
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600">
            Peer Review
          </Badge>
        );
      case "TRAINING_MATERIAL_ASSIGNED":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            Training Material
          </Badge>
        );
      case "OVERTIME":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">Lembur</Badge>
        );
      case "LEAVE_REQUEST":
        return <Badge className="bg-green-500 hover:bg-green-600">Cuti</Badge>;
      case "SHIFT":
        return <Badge className="bg-pink-500 hover:bg-green-600">Shift</Badge>;
      default:
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600">
            {type.replace(/_/g, " ")}
          </Badge>
        );
    }
  };

  // Render notification item
  const renderNotificationItem = (notification: Notification) => {
    const createdAt = new Date(notification.createdAt);
    const timeAgo = formatDistanceToNow(createdAt, {
      addSuffix: true,
      locale: id,
    });
    const formattedDate = format(createdAt, "dd MMM yyyy, HH:mm", {
      locale: id,
    });

    return (
      <div
        key={notification.id}
        className={`flex items-start p-4 border-b border-gray-100 cursor-pointer transition-colors ${
          !notification.read
            ? "bg-blue-50 hover:bg-blue-100"
            : "hover:bg-gray-50"
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex-shrink-0 mr-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Bell
              className={`h-5 w-5 ${
                notification.read ? "text-gray-500" : "text-blue-500"
              }`}
            />
          </div>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4
              className={`text-sm font-medium ${
                notification.read ? "text-gray-700" : "text-blue-700"
              }`}
            >
              {notification.title}
            </h4>
            <div className="flex items-center space-x-2">
              {getNotificationTypeBadge(notification.type)}
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
          <div className="flex items-center justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{timeAgo}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formattedDate}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex space-x-2">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  <span>Tandai dibaca</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render loading skeleton
  const renderSkeletons = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <div
          key={index}
          className="flex items-start p-4 border-b border-gray-100"
        >
          <Skeleton className="h-10 w-10 rounded-full mr-4" />
          <div className="space-y-2 flex-grow">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ));
  };

  // Get notification type options for filter
  const getNotificationTypeOptions = () => {
    const types = new Set(notifications.map((n) => n.type));
    return Array.from(types).map((type) => (
      <SelectItem key={type} value={type}>
        {type.replace(/_/g, " ")}
      </SelectItem>
    ));
  };

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center mb-4 sm:mb-0">
                  <Bell className="h-6 w-6 text-blue-500 mr-2" />
                  <h1 className="text-2xl font-bold text-gray-900">
                    Notifikasi
                  </h1>
                  {unreadCount > 0 && (
                    <Badge className="ml-2 bg-blue-500">
                      {unreadCount} baru
                    </Badge>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Tandai Semua Dibaca
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari notifikasi..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      {getNotificationTypeOptions()}
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <SortDesc className="h-4 w-4 mr-2" />
                        {sortOrder === "newest" ? "Terbaru" : "Terlama"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                        Terbaru Dulu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
                        Terlama Dulu
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="px-4 border-b border-gray-200">
                <TabsList className="h-12">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-blue-50"
                  >
                    Semua
                  </TabsTrigger>
                  <TabsTrigger
                    value="unread"
                    className="data-[state=active]:bg-blue-50"
                  >
                    Belum Dibaca {unreadCount > 0 && `(${unreadCount})`}
                  </TabsTrigger>
                  <TabsTrigger
                    value="read"
                    className="data-[state=active]:bg-blue-50"
                  >
                    Sudah Dibaca
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0">
                <NotificationsContent
                  notifications={filteredNotifications}
                  isLoading={isLoading}
                  error={error}
                  renderNotificationItem={renderNotificationItem}
                  renderSkeletons={renderSkeletons}
                />
              </TabsContent>

              <TabsContent value="unread" className="mt-0">
                <NotificationsContent
                  notifications={filteredNotifications}
                  isLoading={isLoading}
                  error={error}
                  renderNotificationItem={renderNotificationItem}
                  renderSkeletons={renderSkeletons}
                />
              </TabsContent>

              <TabsContent value="read" className="mt-0">
                <NotificationsContent
                  notifications={filteredNotifications}
                  isLoading={isLoading}
                  error={error}
                  renderNotificationItem={renderNotificationItem}
                  renderSkeletons={renderSkeletons}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

// Notifications content component
function NotificationsContent({
  notifications,
  isLoading,
  error,
  renderNotificationItem,
  renderSkeletons,
}: {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  renderNotificationItem: (notification: Notification) => React.ReactNode;
  renderSkeletons: () => React.ReactNode;
}) {
  if (error) {
    return (
      <div className="p-6 text-center">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return <div className="divide-y divide-gray-100">{renderSkeletons()}</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="p-12 text-center">
        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Tidak ada notifikasi
        </h3>
        <p className="text-gray-500">
          Anda akan melihat notifikasi di sini ketika ada pembaruan.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
      <div className="divide-y divide-gray-100">
        {notifications.map(renderNotificationItem)}
      </div>
    </ScrollArea>
  );
}
