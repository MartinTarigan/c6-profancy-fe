import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <select
        className={cn("w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500", className)}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    </div>
  )
})

Select.displayName = "Select"

export function SelectTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm" {...props}>{children}</button>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">{children}</div>
}

export function SelectItem({ children, ...props }: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return <option className="px-3 py-2 text-sm" {...props}>{children}</option>
}

export function SelectValue({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>
}
