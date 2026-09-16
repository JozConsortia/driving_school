import type { ReactNode } from "react";

const COLOR_MAP = {
  violet: "bg-violet-50 text-violet-600",
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
} as const;

export type StatTileColor = keyof typeof COLOR_MAP;

export function StatTile({
  icon,
  value,
  label,
  color = "violet",
}: {
  icon: ReactNode;
  value: number | string;
  label: string;
  color?: StatTileColor;
}) {
  return (
    <div className="stat-tile">
      <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${COLOR_MAP[color]}`}>{icon}</div>
      <span className="stat-tile-value">{value}</span>
      <span className="stat-tile-label">{label}</span>
    </div>
  );
}
