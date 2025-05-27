"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  standalone?: boolean;
  badge?: number;
  items?: {
    title: string;
    url: string;
  }[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          // MODIFIED: Adjust isActive logic for the root path "/"
          let isActive;
          if (item.url === "/") {
            isActive = pathname === item.url;
          } else {
            isActive = pathname === item.url || pathname.startsWith(item.url);
          }

          if (item.standalone) {
            return (
              <SidebarMenuItem key={item.title} className="mb-1">
                <Link href={item.url} passHref>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                    className={`group relative flex items-center justify-between px-4 py-2 rounded-md transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    {/* Left part: Icon and Title */}
                    <div className="flex items-center">
                      {item.icon && (
                        <item.icon className="mr-2 text-white/80 group-hover:text-white" />
                      )}
                      <span>{item.title}</span>
                    </div>

                    {/* Right part: Badge (conditionally rendered) */}
                    {/* This will be pushed to the far right by justify-between */}
                    {item.badge && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {item.badge}
                      </span>
                    )}

                    {/* Active indicator bar - absolutely positioned to the button's far right */}
                    {isActive && (
                      <div className="absolute right-0 top-0 h-full w-1 rounded-r-md bg-blue-500" />
                    )}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              // MODIFIED: Use the same adjusted isActive logic for defaultOpen
              defaultOpen={
                (item.url === "/"
                  ? pathname === item.url
                  : pathname === item.url || pathname.startsWith(item.url)) ||
                item.isActive
              }
              className="group/collapsible mb-1"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="group rounded-md transition-all duration-200 hover:bg-muted/60"
                  >
                    {item.icon && (
                      <item.icon className="text-white/80 group-hover:text-white" />
                    )}
                    <span className="ml-2">{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 text-white/80 group-hover:text-white group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((sub) => {
                      const isSubActive =
                        pathname === sub.url || pathname.startsWith(sub.url); // This logic is usually fine for sub-items
                      return (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubActive}
                            className={`relative transition-all duration-200 ${
                              isSubActive
                                ? "text-primary font-medium"
                                : "hover:text-foreground"
                            }`}
                          >
                            <Link href={sub.url}>
                              <span>{sub.title}</span>
                              {isSubActive && (
                                <div className="absolute left-0 top-0 h-full w-0.5 rounded-r-md bg-primary" />
                              )}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
