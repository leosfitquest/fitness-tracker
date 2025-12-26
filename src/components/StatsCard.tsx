import type { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: ReactNode;
}

export function StatsCard({ title, value, subtitle, trend, icon }: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return "▲";
    if (trend.value < 0) return "▼";
    return "■";
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-green-500";
    if (trend.value < 0) return "text-red-500";
    return "text-slate-400";
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{title}</span>
        {icon && <div className="text-slate-300">{icon}</div>}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
      {trend && (
        <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
          <span>{getTrendIcon()}</span>
          <span>
            {trend.value > 0 ? "+" : ""}
            {trend.value}% · {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
