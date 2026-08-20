"use client";

// Bar tunggal: track abu-abu, isian menunjukkan aktual, garis vertikal putih
// menunjukkan target/plan. Warna isian berubah sesuai apakah aktual melewati
// batas "boros" (overGood=false berarti lebih tinggi = buruk, misal OT jam).
export default function BulletBar({
  label,
  actual,
  plan,
  unit = "",
  overIsBad = true,
  fillColorClass = "bg-signal-plan",
}) {
  const max = Math.max(actual, plan, 1) * 1.15;
  const actualPct = Math.min(100, (actual / max) * 100);
  const planPct = Math.min(100, (plan / max) * 100);

  const isOver = overIsBad ? actual > plan : actual < plan;
  const barColor = isOver ? "bg-signal-crit" : fillColorClass;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-ink-muted uppercase tracking-wide">{label}</span>
        <span className="font-mono text-xs text-ink-primary tabular">
          {fmt(actual)}
          <span className="text-ink-faint"> / {fmt(plan)}{unit}</span>
        </span>
      </div>
      <div className="relative h-3 rounded-sm bg-base-panelAlt overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${barColor} transition-all`}
          style={{ width: `${actualPct}%` }}
        />
        <div
          className="absolute inset-y-0 w-[2px] bg-ink-primary/80"
          style={{ left: `${planPct}%` }}
          title={`Plan: ${plan}${unit}`}
        />
      </div>
    </div>
  );
}

function fmt(n) {
  return Number.isFinite(n) ? n.toLocaleString("id-ID") : "0";
}
