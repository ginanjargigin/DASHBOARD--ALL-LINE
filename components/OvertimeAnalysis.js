"use client";

const COLORS = {
  green: "#35C979",
  orange: "#F2B033",
  red: "#EF5757",
  blue: "#4C8DFF",
  text: "#E7ECF2",
  muted: "#8B96A5",
  faint: "#5B6572",
  grid: "#29323C",
  panel: "#141A21",
};

export default function OvertimeAnalysis({
  data = [],
}) {
  if (!data.length) {
    return (
      <div className="bg-base-panel border border-base-border rounded-lg p-5">
        <p className="text-sm text-ink-muted">
          Belum ada data overtime.
        </p>
      </div>
    );
  }

  const chartData = data.map((item) => {
    const planOT = Number(item.planOT) || 0;
    const actualOT = Number(item.actualOT) || 0;
    const production = Number(item.actual) || 0;
    const sales = Number(item.sales) || 0;

    let status = "normal";

    if (actualOT > planOT && production < sales) {
      status = "critical";
    } else if (actualOT > planOT) {
      status = "warning";
    } else if (actualOT > 0) {
      status = "used";
    }

    return {
      ...item,
      planOT,
      actualOT,
      production,
      sales,
      status,
    };
  });

  const totalPlanOT = chartData.reduce(
    (sum, item) => sum + item.planOT,
    0
  );

  const totalActualOT = chartData.reduce(
    (sum, item) => sum + item.actualOT,
    0
  );

  const totalProduction = chartData.reduce(
    (sum, item) => sum + item.production,
    0
  );

  const totalSales = chartData.reduce(
    (sum, item) => sum + item.sales,
    0
  );

  const overPlanDays = chartData.filter(
    (item) => item.actualOT > item.planOT
  ).length;

  const criticalDays = chartData.filter(
    (item) =>
      item.actualOT > item.planOT &&
      item.production < item.sales
  ).length;

  const maxOT = Math.max(
    totalPlanOT,
    ...chartData.map((item) => item.actualOT),
    1
  );

  const maxValue = niceMax(maxOT * 1.2);

  return (
    <section className="bg-base-panel border border-base-border rounded-lg p-4">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">

        <div>
          <h2 className="font-display font-bold text-xl">
            Overtime Analysis
          </h2>

          <p className="text-xs text-ink-muted mt-1">
            Perbandingan plan overtime dan actual overtime
            terhadap pencapaian produksi.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-mono">

          <Legend
            color={COLORS.blue}
            label="Plan OT"
            line
          />

          <Legend
            color={COLORS.green}
            label="OT sesuai plan"
          />

          <Legend
            color={COLORS.orange}
            label="OT > plan"
          />

          <Legend
            color={COLORS.red}
            label="OT tinggi + produksi kurang"
          />

        </div>

      </div>


      {/* =====================================================
          KPI
      ====================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

        <MetricCard
          label="PLAN OT"
          value={`${fmt(totalPlanOT)} JAM`}
          color="text-signal-plan"
        />

        <MetricCard
          label="ACTUAL OT"
          value={`${fmt(totalActualOT)} JAM`}
          color={
            totalActualOT > totalPlanOT
              ? "text-signal-warn"
              : "text-signal-ok"
          }
        />

        <MetricCard
          label="PRODUKSI"
          value={`${fmt(totalProduction)} PCS`}
          color="text-ink-primary"
        />

        <MetricCard
          label="SALES"
          value={`${fmt(totalSales)} PCS`}
          color={
            totalProduction >= totalSales
              ? "text-signal-ok"
              : "text-signal-crit"
          }
        />

      </div>


      {/* =====================================================
          CHART
      ====================================================== */}

      <div className="w-full aspect-[1000/360]">

        <svg
          viewBox="0 0 1000 360"
          className="w-full h-full"
          role="img"
          aria-label="Grafik plan dan actual overtime"
        >

          <rect
            x="0"
            y="0"
            width="1000"
            height="360"
            rx="10"
            fill={COLORS.panel}
          />

          <OvertimeChart
            data={chartData}
            maxValue={maxValue}
          />

        </svg>

      </div>


      {/* =====================================================
          ANALYSIS
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">

        <AnalysisBox
          color="bg-signal-ok"
          title="OT TERKONTROL"
          value={`${fmt(
            chartData.filter(
              (item) =>
                item.actualOT <= item.planOT
            ).length
          )} hari`}
          description="Actual overtime masih berada dalam batas plan."
        />

        <AnalysisBox
          color="bg-signal-warn"
          title="OT DI ATAS PLAN"
          value={`${fmt(overPlanDays)} hari`}
          description="Actual overtime melebihi rencana overtime."
        />

        <AnalysisBox
          color="bg-signal-crit"
          title="PERLU EVALUASI"
          value={`${fmt(criticalDays)} hari`}
          description="OT tinggi tetapi produksi masih di bawah sales."
        />

      </div>

    </section>
  );
}


/* ============================================================
   CHART
============================================================ */

function OvertimeChart({
  data,
  maxValue,
}) {
  const width = 1000;
  const height = 360;

  const pad = {
    top: 25,
    right: 30,
    bottom: 58,
    left: 70,
  };

  const innerW =
    width - pad.left - pad.right;

  const innerH =
    height - pad.top - pad.bottom;

  const xStep =
    data.length > 1
      ? innerW / data.length
      : innerW;

  const barWidth = Math.min(
    42,
    Math.max(18, xStep * 0.42)
  );

  const baseline =
    pad.top + innerH;

  const y = (value) =>
    pad.top +
    innerH -
    (value / maxValue) * innerH;

  const x = (index) =>
    pad.left +
    xStep * index +
    xStep / 2;

  const ticks = makeTicks(maxValue, 5);

  return (
    <>
      {/* GRID */}

      {ticks.map((value) => (
        <g key={value}>

          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={y(value)}
            y2={y(value)}
            stroke={COLORS.grid}
            strokeWidth="1"
          />

          <text
            x={pad.left - 12}
            y={y(value) + 4}
            textAnchor="end"
            fill={COLORS.muted}
            fontSize="12"
            fontFamily="monospace"
          >
            {fmt(value)}
          </text>

        </g>
      ))}


      {/* Y LABEL */}

      <text
        x="18"
        y={pad.top - 7}
        fill={COLORS.muted}
        fontSize="11"
        fontFamily="sans-serif"
      >
        JAM
      </text>


      {/* PLAN LINE */}

      {data.length > 0 && (
        <polyline
          points={data
            .map(
              (item, index) =>
                `${x(index)},${y(item.planOT)}`
            )
            .join(" ")}
          fill="none"
          stroke={COLORS.blue}
          strokeWidth="2"
          strokeDasharray="7 5"
        />
      )}


      {/* DATA */}

      {data.map((item, index) => {

        const actualY =
          y(item.actualOT);

        const actualH =
          baseline - actualY;

        const color =
          item.status === "critical"
            ? COLORS.red
            : item.status === "warning"
            ? COLORS.orange
            : COLORS.green;

        return (
          <g
            key={`${item.date}-${index}`}
          >

            {/* ACTUAL OT */}

            <rect
              x={
                x(index) -
                barWidth / 2
              }
              y={actualY}
              width={barWidth}
              height={Math.max(
                actualH,
                1
              )}
              rx="3"
              fill={color}
              opacity="0.92"
            >

              <title>
                {`${formatDateLong(
                  item.date
                )} — Plan OT ${fmt(
                  item.planOT
                )} jam — Actual OT ${fmt(
                  item.actualOT
                )} jam`}
              </title>

            </rect>


            {/* VALUE */}

            <text
              x={x(index)}
              y={Math.max(
                actualY - 8,
                pad.top + 12
              )}
              textAnchor="middle"
              fill={COLORS.text}
              fontSize="11"
              fontWeight="700"
              fontFamily="monospace"
            >
              {fmt(item.actualOT)}
            </text>


            {/* DATE */}

            <text
              x={x(index)}
              y={baseline + 22}
              textAnchor="middle"
              fill={COLORS.muted}
              fontSize="11"
              fontFamily="monospace"
            >
              {formatDate(item.date)}
            </text>


            {/* PLAN VALUE */}

            <text
              x={x(index)}
              y={baseline + 39}
              textAnchor="middle"
              fill={COLORS.faint}
              fontSize="10"
              fontFamily="sans-serif"
            >
              Plan {fmt(item.planOT)}
            </text>

          </g>
        );
      })}
    </>
  );
}


/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  label,
  value,
  color,
}) {
  return (
    <div className="bg-base-panelAlt border border-base-border rounded-md p-3">

      <p className="text-[10px] text-ink-faint uppercase tracking-wide">
        {label}
      </p>

      <p
        className={`font-display font-bold text-lg mt-1 ${color}`}
      >
        {value}
      </p>

    </div>
  );
}


/* ============================================================
   ANALYSIS BOX
============================================================ */

function AnalysisBox({
  color,
  title,
  value,
  description,
}) {
  return (
    <div className="flex gap-3 border border-base-border rounded-md p-3 bg-base-panelAlt">

      <span
        className={`w-1 rounded-full ${color} shrink-0`}
      />

      <div className="min-w-0">

        <p className="text-[10px] font-semibold text-ink-muted">
          {title}
        </p>

        <p className="font-mono font-bold text-sm text-ink-primary mt-0.5">
          {value}
        </p>

        <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
          {description}
        </p>

      </div>

    </div>
  );
}


/* ============================================================
   LEGEND
============================================================ */

function Legend({
  color,
  label,
  line = false,
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-muted">

      <span
        className={
          line
            ? "w-5 border-t-2 border-dashed"
            : "w-2.5 h-2.5 rounded-sm"
        }
        style={{
          borderColor: color,
          backgroundColor: line
            ? "transparent"
            : color,
        }}
      />

      {label}

    </span>
  );
}


/* ============================================================
   SCALE
============================================================ */

function niceMax(value) {
  const step =
    value <= 5
      ? 1
      : value <= 20
      ? 2
      : 5;

  return Math.max(
    step,
    Math.ceil(value / step) * step
  );
}


function makeTicks(
  max,
  count
) {
  return Array.from(
    { length: count + 1 },
    (_, index) =>
      (max / count) * index
  );
}


/* ============================================================
   FORMAT
============================================================ */

function fmt(value) {
  return Number(value || 0)
    .toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    });
}


function formatDate(date) {
  if (!date) return "-";

  const [
    year,
    month,
    day,
  ] = date.split("-");

  return `${day}/${month}`;
}


function formatDateLong(date) {
  if (!date) return "-";

  const [
    year,
    month,
    day,
  ] = date.split("-");

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}
