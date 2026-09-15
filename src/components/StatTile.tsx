import type { ReactNode } from "react";

export function StatTile({ icon, value, label }: { icon: ReactNode; value: number | string; label: string }) {
  return (
    <div className="stat-tile">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
        {icon}
      </div>
      <span className="stat-tile-value">{value}</span>
      <span className="stat-tile-label">{label}</span>
    </div>
  );
}
