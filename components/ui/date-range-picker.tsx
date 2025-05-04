"use client"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

interface DatePickerWithRangeProps {
  className?: string
  dateRange: DateRange | undefined
  setDateRange: (date: DateRange | undefined) => void
  disabled?: boolean
}

export function DatePickerWithRange({ className, dateRange, setDateRange, disabled }: DatePickerWithRangeProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            aria-label="Select date range"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal transition-all",
              !dateRange && "text-muted-foreground",
              "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  <span className="font-medium">{format(dateRange.from, "dd MMM yyyy")}</span>
                  <span className="mx-1">-</span>
                  <span className="font-medium">{format(dateRange.to, "dd MMM yyyy")}</span>
                </>
              ) : (
                <span className="font-medium">{format(dateRange.from, "dd MMM yyyy")}</span>
              )
            ) : (
              <span>Pilih tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-gray-200 shadow-lg rounded-lg" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={{
              from: dateRange?.from,
              to: dateRange?.to,
            }}
            onSelect={setDateRange}
            numberOfMonths={2}
            className="rounded-lg border-0"
          />
          <div className="flex items-center justify-end p-2 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange(undefined)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
