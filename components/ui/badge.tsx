import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Badge({ className, ...props }: BadgeProps) {
  return <div className={cn("inline-flex items-center px-2 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-700", className)} {...props} />
}
