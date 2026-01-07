"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

// Mock data for the chart - in production, this would come from the API
const mockData = [
  { month: "Jul", income: 12500, expenses: 8200 },
  { month: "Aug", income: 15800, expenses: 9100 },
  { month: "Sep", income: 14200, expenses: 10500 },
  { month: "Oct", income: 18900, expenses: 11200 },
  { month: "Nov", income: 16400, expenses: 9800 },
  { month: "Dec", income: 21000, expenses: 12500 },
];

export function CashFlowChart() {
  const chartData = useMemo(() => mockData, []);

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis
            dataKey="month"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar
            dataKey="income"
            name="Income"
            fill="hsl(142.1 76.2% 36.3%)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="hsl(0 84.2% 60.2%)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
