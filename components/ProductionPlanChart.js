"use client";

const COLORS = {
  green: "#35C979",
  orange: "#F2B033",
  red: "#EF5757",
  plan: "#4C8DFF",
  text: "#E7ECF2",
  muted: "#8B96A5",
  faint: "#5B6572",
  grid: "#29323C",
  panel: "#141A21",
};

export default function ProductionPlanChart({ data, plan }) {
  const width = 1000;
  const height = 390;
  const pad = { top: 28, right: 28, bottom: 58, left: 70 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxValue = Math.max(
    plan || 0,
    ...data.map((d) => d.actual || 0),
    ...data.map((d) => d.sales || 0),
    1
  );
  const yMax = niceMax(maxValue * 1.12);
  const xStep = data.length > 1 ? innerW / data.length : innerW;
  const barWidth = Math.min(42, Math.max(18, xStep * 0.55));

  const y = (value) => pad.top + innerH - (value / yMax) * innerH;
  const x = (index) => pad.left + xStep * index + xStep / 2;

  const planY = y(plan || 0);
  const gridValues = makeTicks(yMax, 5);

  if (!data.length) {
    return <EmptyChart message="Belum ada data produksi untuk periode ini." />;
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-display font-bold text-xl">Actual Production vs Daily Plan</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Warna aktual: hijau ≥ plan, oranye ≥ sales tetapi &lt; plan, merah &lt; sales.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-mono">
          <Legend color={COLORS.plan} label={`Plan ${fmt(plan)} pcs`} line />
          <Legend color={COLORS.green} label="Target tercapai" />
          <Legend color={COLORS.orange} label="Di bawah plan" />
          <Legend color={COLORS.red} label="Di bawah sales" />
        </div>
      </div>

      <div className="w-full aspect-[1000/390]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" role="img" aria-label="Grafik produksi aktual dibandingkan plan harian">
          <rect x="0" y="0" width={width} height={height} rx="10" fill={COLORS.panel} />

          {gridValues.map((value) => (
            <g key={value}>
              <line x1={pad.left} x2={width - pad.right} y1={y(value)} y2={y(value)} stroke={COLORS.grid} strokeWidth="1" />
              <text x={pad.left - 12} y={y(value) + 4} textAnchor="end" fill={COLORS.muted} fontSize="12" fontFamily="monospace">
                {fmt(value)}
              </text>
            </g>
          ))}

          <text x="18" y={pad.top - 8} fill={COLORS.muted} fontSize="11" fontFamily="sans-serif">PCS</text>

          <line x1={pad.left} x2={width - pad.right} y1={planY} y2={planY} stroke={COLORS.plan} strokeWidth="3" strokeDasharray="10 7" />
          <text x={width - pad.right} y={planY - 9} textAnchor="end" fill={COLORS.plan} fontSize="12" fontWeight="700" fontFamily="monospace">
            PLAN {fmt(plan)}
          </text>

          {data.map((d, i) => {
            const value = d.actual || 0;
            const sales = d.sales || 0;
            const color = value >= (plan || 0)
              ? COLORS.green
              : value >= sales
                ? COLORS.orange
                : COLORS.red;
            const barX = x(i) - barWidth / 2;
            const barY = y(value);
            const barH = Math.max(0, pad.top + innerH - barY);
            const baseline = pad.top + innerH;

            return (
              <g key={`${d.date}-${i}`}>
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  rx="3"
                  fill={color}
                  opacity="0.92"
                >
                  <title>{`${formatDate(d.date)} — Actual ${fmt(value)} pcs, Sales ${fmt(sales)} pcs`}</title>
                </rect>
                <text x={x(i)} y={Math.max(barY - 8, pad.top + 12)} textAnchor="middle" fill={COLORS.text} fontSize="11" fontWeight="700" fontFamily="monospace">
                  {fmt(value)}
                </text>
                <text x={x(i)} y={baseline + 22} textAnchor="middle" fill={COLORS.muted} fontSize="11" fontFamily="monospace">
                  {formatDate(d.date)}
                </text>
                <text x={x(i)} y={baseline + 39} textAnchor="middle" fill={COLORS.faint} fontSize="10" fontFamily="sans-serif">
                  Sales {fmt(sales)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function Legend({ color, label, line = false }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-muted">
      <span className={line ? "w-5 border-t-2 border-dashed" : "w-2.5 h-2.5 rounded-sm"} style={{ borderColor: color, backgroundColor: line ? "transparent" : color }} />
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
