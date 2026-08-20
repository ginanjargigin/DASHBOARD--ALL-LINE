"use client";
import Link from "next/link";
import BulletBar from "./BulletBar";
import { actualProduction, lineStatus, statusColor, weekendOtRecommendation } from "@/lib/calc";

export default function LineCard({ line, records }) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const today = sorted[sorted.length - 1];
  const status = lineStatus(sorted);
  const colors = statusColor(status.level);

  return (
    <Link
      href={`/line/${line.id}`}
      className="block rounded-md bg-base-panel border border-base-border overflow-hidden hover:border-signal-plan/50 transition-colors"
    >
      <div className="flex">
        <div className={`w-1.5 ${colors.bar}`} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg tracking-wide">{line.name}</h3>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${colors.dim} ${colors.text}`}
            >
              {status.level === "nodata" ? "no data" : status.level}
            </span>
          </div>

          {!today ? (
            <p className="text-sm text-ink-faint">Belum ada data hari ini.</p>
          ) : (
            <div className="space-y-2.5">
              <BulletBar
                label="Produksi (pcs)"
                actual={actualProduction(today)}
                plan={today.planProduction}
              />
              <BulletBar
                label="Overtime (jam)"
                actual={today.actualOT}
                plan={today.planOT}
                unit=" jam"
              />
            </div>
          )}

          <p className="mt-3 text-xs text-ink-muted leading-snug">{status.reason}</p>
          <p className={`mt-1 text-xs font-medium ${colors.text}`}>
            {weekendOtRecommendation(status)}
          </p>
        </div>
      </div>
    </Link>
  );
}
