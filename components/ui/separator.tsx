import * as React from "react"
import { cn } from "@/lib/utils"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Separator({ className, ...props }: SeparatorProps) {
  return <div className={cn("w-full border-t border-gray-300", className)} {...props} />
}
