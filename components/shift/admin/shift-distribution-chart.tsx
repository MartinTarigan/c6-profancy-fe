"use client"

import { useEffect, useState } from "react"
import { TooltipProps } from "recharts"
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Perbaiki interface HistogramData untuk mendukung properti dinamis
interface HistogramData {
  range: string
  count: number
  [key: string]: number | string // Ini memungkinkan properti dinamis seperti outlet1, outlet2, dll
}

// Sesuaikan dengan interface Outlet di admin-dashboard.tsx
interface Outlet {
  outletId: number | null
  name: string
  location?: string
  headBarName?: string
  headBarId?: string
}

interface ShiftDistributionChartProps {
  data: HistogramData[]
  outlets: Outlet[]
}

const COLORS = [
  "#0d9488", // teal-600
  "#0891b2", // cyan-600
  "#0284c7", // sky-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#ea580c", // orange-600
  "#16a34a", // green-600
  "#ca8a04", // yellow-600
]

export function ShiftDistributionChart({ data, outlets }: ShiftDistributionChartProps) {
  const [activeOutlet, setActiveOutlet] = useState<number | null>(null)
  const [chartData, setChartData] = useState<HistogramData[]>([])
  const [availableOutletIds, setAvailableOutletIds] = useState<number[]>([])

  useEffect(() => {
    console.log("ShiftDistributionChart received data:", data)
    console.log("ShiftDistributionChart received outlets:", outlets)

    // Ekstrak outletIds dari data yang diterima
    const outletIds = new Set<number>()
    
    // Ekstrak semua outlet IDs dari data
    if (data && data.length > 0) {
      data.forEach((item) => {
        Object.keys(item).forEach((key) => {
          if (key.startsWith("outlet") && key !== "outletName") {
            const outletId = Number.parseInt(key.replace("outlet", ""))
            if (!isNaN(outletId)) {
              outletIds.add(outletId)
            }
          }
        })
      })
    }
    
    // Jika tidak ada outlet IDs dari data, gunakan dari props outlets
    if (outletIds.size === 0 && outlets && outlets.length > 0) {
      outlets.forEach((outlet) => {
        if (outlet.outletId !== null && outlet.outletId !== undefined) {
          outletIds.add(outlet.outletId)
        }
      })
    }
    
    setAvailableOutletIds(Array.from(outletIds))
    console.log("Available outlet IDs for chart:", Array.from(outletIds))

    // Periksa apakah kita memiliki data dengan count > 0
    const hasData = data && data.length > 0 && (
      data.some((item) => item.count > 0) || 
      data.some((item) => 
        Object.keys(item).some(key => 
          key.startsWith("outlet") && typeof item[key] === "number" && item[key] > 0
        )
      )
    )
    
    console.log("Chart has valid data:", hasData)

    if (hasData && data.length > 0) {
      // Gunakan data yang diterima dari backend
      setChartData(data)
    } else {
      console.warn("ShiftDistributionChart received empty or zero-count data, using minimal placeholder")
      
      // Buat data minimal untuk menghindari chart kosong
      const minimalData: HistogramData[] = [
        { range: "0-9", count: 0 },
        { range: "10-14", count: 0 },
        { range: "15-19", count: 0 },
        { range: "20-24", count: 0 },
        { range: "25+", count: 0 },
      ]
      
      // Tambahkan properti outlet kosong untuk setiap outlet yang tersedia
      if (outletIds.size > 0) {
        minimalData.forEach(item => {
          outletIds.forEach(outletId => {
            const outletKey = `outlet${outletId}`
            item[outletKey] = 0
          })
        })
      } else {
        // Jika tidak ada outlet sama sekali, tambahkan placeholder
        minimalData.forEach(item => {
          item["outlet0"] = 0
        })
      }
      
      setChartData(minimalData)
    }
  }, [data, outlets])

  // Gunakan outlet yang valid dari data atau props
  const displayOutlets = outlets.filter(outlet => 
    outlet && 
    outlet.outletId !== null && 
    outlet.outletId !== undefined &&
    availableOutletIds.includes(outlet.outletId)
  )

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800 mb-2">{`Rentang Hari: ${label}`}</p>
          <div className="space-y-1.5">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-700 font-medium">
                {entry.name === "count"
                    ? "Total Barista"
                    : typeof entry.name === "string"
                      ? entry.name.replace("outlet", "Outlet ")
                      : `Outlet ${entry.name}`}
                  <span className="font-semibold">{entry.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }
  

  const handleLegendClick = (outlet: { outletId: number; name: string }) => {
    if (activeOutlet === outlet.outletId) {
      setActiveOutlet(null)
    } else {
      setActiveOutlet(outlet.outletId)
    }
  }

  // Jika tidak ada data atau outlet, tampilkan pesan
  if (chartData.length === 0 || displayOutlets.length === 0) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-500">Tidak ada data untuk ditampilkan</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 10,
          }}
          barGap={4}
          barCategoryGap={16}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="range"
            label={{
              value: "Rentang Hari Kerja",
              position: "insideBottom",
              offset: -5,
              style: { fontWeight: 500, fill: "#64748b" },
            }}
            tick={{ fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            label={{
              value: "Jumlah Barista",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fontWeight: 500, fill: "#64748b" },
            }}
            tick={{ fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={{ stroke: "#cbd5e1" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            onClick={(e) => {
              if (e && e.dataKey && typeof e.dataKey === "string") {
                if (e.dataKey === "count") return

                try {
                  const outletId = Number.parseInt(e.dataKey.replace("outlet", ""))
                  if (!isNaN(outletId)) {
                    handleLegendClick({ outletId: outletId, name: e.value || `Outlet ${outletId}` })
                  }
                } catch (error) {
                  console.error("Error parsing outlet ID:", error)
                }
              }
            }}
            formatter={(value) => {
              if (value === "count") return "Total"
              if (value.startsWith("outlet")) {
                const outletId = Number.parseInt(value.replace("outlet", ""))
                const outlet = displayOutlets.find((o) => o.outletId === outletId) || { name: `Outlet ${outletId}` }
                return outlet.name
              }
              return value
            }}
            wrapperStyle={{ paddingTop: 10 }}
            iconSize={10}
            iconType="circle"
          />

          <Bar
            dataKey="count"
            name="count"
            fill="#94a3b8"
            opacity={activeOutlet ? 0.3 : 0.7}
            radius={[4, 4, 0, 0]}
            animationDuration={750}
            animationEasing="ease-in-out"
          />

          {availableOutletIds.map((outletId, index) => (
            <Bar
              key={outletId}
              dataKey={`outlet${outletId}`}
              name={`outlet${outletId}`}
              stackId={activeOutlet === outletId ? "active" : "stack"}
              fill={COLORS[index % COLORS.length]}
              opacity={activeOutlet === null || activeOutlet === outletId ? 1 : 0.3}
              radius={[4, 4, 0, 0]}
              animationDuration={750 + index * 100}
              animationEasing="ease-in-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-slate-500 text-center bg-slate-50 py-3 px-4 rounded-md border border-slate-200">
        <span className="font-medium text-teal-600">Tip:</span> Klik pada legenda untuk melihat detail per outlet
      </div>
    </div>
  )
}