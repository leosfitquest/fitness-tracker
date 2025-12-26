import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  value: number;
}

interface ProgressChartProps {
  title: string;
  data: DataPoint[];
  valueLabel?: string;
  color?: string;
}

export function ProgressChart({
  title,
  data,
  valueLabel = "Weight (kg)",
  color = "#22c55e",
}: ProgressChartProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-col gap-4">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                borderColor: "#1e293b",
                borderRadius: 8,
              }}
              labelStyle={{ color: "#e5e7eb" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-slate-500">{valueLabel}</div>
    </div>
  );
}
