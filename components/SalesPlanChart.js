"use client";

const COLORS = {
  green: "#35C979",
  orange: "#F2B033",
  plan: "#4C8DFF",
  text: "#E7ECF2",
  muted: "#8B96A5",
  grid: "#29323C",
  panel: "#141A21",
};

export default function SalesPlanChart({ data, plan }) {
  const width = 1000;
  const height = 390;
  const pad = { top: 28, right: 28, bottom: 58, left: 70 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxValue = Math.max(plan || 0, ...data.map((d) => d.sales || 0), 1);
  const yMax = niceMax(maxValue * 1.12);
  const xStep = data.length > 1 ? innerW / data.length : innerW;
  const groupWidth = Math.min(70, Math.max(30, xStep * 0.72));
  const gap = 6;
  const barWidth = Math.max(10, (groupWidth - gap) / 2);
  const y = (value) => pad.top + innerH - (value / yMax) * innerH;
  const x = (index) => pad.left + xStep * index + xStep / 2;
  const ticks = makeTicks(yMax, 5);

  if (!data.length) {
    return <EmptyChart message="Belum ada data sales untuk periode ini." />;
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-display font-bold text-xl">Actual Sales vs Production Plan</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Sales dibandingkan dengan target produksi harian.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-mono">
          <Legend color={COLORS.plan} label="Plan Production" />
          <Legend color={COLORS.green} label="Sales ≥ Plan" />
          <Legend color={COLORS.orange} label="Sales &lt; Plan" />
        </div>
      </div>

      <div className="w-full aspect-[1000/390]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" role="img" aria-label="Grafik actual sales dibandingkan plan produksi">
          <rect x="0" y="0" width={width} height={height} rx="10" fill={COLORS.panel} />

          {ticks.map((value) => (
            <g key={value}>
              <line x1={pad.left} x2={width - pad.right} y1={y(value)} y2={y(value)} stroke={COLORS.grid} strokeWidth="1" />
              <text x={pad.left - 12} y={y(value) + 4} textAnchor="end" fill={COLORS.muted} fontSize="12" fontFamily="monospace">
                {fmt(value)}
              </text>
            </g>
          ))}

          <text x="18" y={pad.top - 8} fill={COLORS.muted} fontSize="11" fontFamily="sans-serif">PCS</text>

          {data.map((d, i) => {
            const sales = d.sales || 0;
            const planValue = plan || 0;
            const salesColor = sales >= planValue ? COLORS.green : COLORS.orange;
            const center = x(i);
            const salesX = center - groupWidth / 2;
            const planX = center + gap / 2;
            const salesY = y(sales);
            const planY = y(planValue);
            const baseline = pad.top + innerH;

            return (
              <g key={`${d.date}-${i}`}>
                <rect x={salesX} y={salesY} width={barWidth} height={Math.max(0, baseline - salesY)} rx="3" fill={salesColor}>
                  <title>{`${formatDate(d.date)} — Actual Sales ${fmt(sales)} pcs`}</title>
                </rect>
                <rect x={planX} y={planY} width={barWidth} height={Math.max(0, baseline - planY)} rx="3" fill={COLORS.plan} opacity="0.8">
                  <title>{`${formatDate(d.date)} — Plan ${fmt(planValue)} pcs`}</title>
                </rect>
                <text x={salesX + barWidth / 2} y={Math.max(salesY - 8, pad.top + 12)} textAnchor="middle" fill={COLORS.text} fontSize="10" fontWeight="700" fontFamily="monospace">
                  {fmt(sales)}
                </text>
                <text x={planX + barWidth / 2} y={Math.max(planY - 8, pad.top + 12)} textAnchor="middle" fill={COLORS.muted} fontSize="10" fontFamily="monospace">
                  {fmt(planValue)}
                </text>
                <text x={center} y={baseline + 22} textAnchor="middle" fill={COLORS.muted} fontSize="11" fontFamily="monospace">
                  {formatDate(d.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-muted">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-72 rounded-lg bg-base-panel border border-base-border flex items-center justify-center text-sm text-ink-muted">
      {message}
    </div>
  );
}

function niceMax(value) {
  const step = value <= 500 ? 50 : value <= 2000 ? 250 : 500;
  return Math.ceil(value / step) * step;
}

function makeTicks(max, count) {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

function fmt(value) {
  return Math.round(Number(value) || 0).toLocaleString("id-ID");
}

function formatDate(date) {
  if (!date) return "-";
  const [y, m, d] = date.split("-");
  return `${d}/${m}`;
}
