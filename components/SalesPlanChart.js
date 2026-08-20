"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";

const COLORS = {
  green: "#22c55e",
  orange: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  white: "#e5e7eb",
};

export default function SalesPlanChart({
  data = [],
  plan = 0,
}) {
  const chartData = data.map((item) => {
    const sales = Number(item.sales) || 0;
    const production = Number(item.actual) || 0;
    const dailyPlan = Number(plan) || 0;

    let status = "below-plan";

    if (dailyPlan > 0 && sales >= dailyPlan) {
      status = "target";
    }

    return {
      ...item,
      sales,
      production,
      plan: dailyPlan,
      status,
      gap: sales - dailyPlan,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-ink-muted">
          Belum ada data sales untuk ditampilkan.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">

        <div>
          <h2 className="font-display font-bold text-xl text-ink-primary">
            Actual Sales vs Production Plan
          </h2>

          <p className="text-xs text-ink-muted mt-1">
            Perbandingan kebutuhan actual sales terhadap
            daily production plan.
          </p>
        </div>

        {/* STATUS LEGEND */}
        <div className="flex flex-wrap gap-3 text-xs font-mono">

          <StatusLegend
            color="bg-signal-ok"
            label="Sales ≥ Plan"
          />

          <StatusLegend
            color="bg-signal-warn"
            label="Sales < Plan"
          />

        </div>

      </div>


      {/* =====================================================
          PLAN INFO
      ====================================================== */}
      <div className="mb-4 flex flex-wrap items-center gap-3">

        <div className="inline-flex items-center gap-2 bg-base-panelAlt border border-base-border rounded px-3 py-2">

          <span
            className="w-3 h-0.5"
            style={{
              backgroundColor: COLORS.blue,
            }}
          />

          <span className="text-xs text-ink-muted">
            Daily Production Plan
          </span>

          <span className="font-mono text-sm font-semibold text-ink-primary">
            {formatNumber(plan)} PCS
          </span>

        </div>

      </div>


      {/* =====================================================
          CHART
      ====================================================== */}
      <div className="w-full h-[360px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <ComposedChart
            data={chartData}
            margin={{
              top: 25,
              right: 30,
              left: 10,
              bottom: 10,
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />

            {/* X AXIS */}
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{
                fontSize: 11,
                fill: "#94a3b8",
              }}
              tickLine={false}
              axisLine={false}
              minTickGap={25}
            />

            {/* Y AXIS */}
            <YAxis
              tick={{
                fontSize: 11,
                fill: "#94a3b8",
              }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatNumber}
              width={65}
              domain={[0, "auto"]}
            />

            {/* TOOLTIP */}
            <Tooltip
              content={<SalesTooltip />}
              cursor={{
                fill: "rgba(100, 116, 139, 0.08)",
              }}
            />


            {/* =================================================
                DAILY PRODUCTION PLAN
            ================================================== */}

            {plan > 0 && (
              <ReferenceLine
                y={plan}
                stroke={COLORS.blue}
                strokeWidth={2}
                strokeDasharray="6 4"
                label={{
                  value: `PLAN ${formatNumber(plan)}`,
                  position: "insideTopRight",
                  fill: COLORS.blue,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}


            {/* =================================================
                ACTUAL SALES
            ================================================== */}

            <Bar
              dataKey="sales"
              name="Actual Sales"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            >

              {chartData.map((entry, index) => (
                <Cell
                  key={`sales-${index}`}
                  fill={getStatusColor(entry.status)}
                />
              ))}

            </Bar>


            {/* =================================================
                ACTUAL PRODUCTION
            ================================================== */}

            <Line
              type="monotone"
              dataKey="production"
              name="Actual Production"
              stroke={COLORS.blue}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{
                r: 3,
                fill: COLORS.blue,
                stroke: COLORS.blue,
              }}
              activeDot={{
                r: 5,
                fill: COLORS.blue,
                stroke: COLORS.blue,
              }}
            />

          </ComposedChart>

        </ResponsiveContainer>

      </div>


      {/* =====================================================
          STATUS EXPLANATION
      ====================================================== */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">

        <StatusBox
          color="bg-signal-ok"
          title="SALES ≥ PLAN"
          description="Actual sales mencapai atau melebihi daily production plan."
        />

        <StatusBox
          color="bg-signal-warn"
          title="SALES < PLAN"
          description="Actual sales masih berada di bawah daily production plan."
        />

      </div>

    </div>
  );
}


/* ============================================================
   STATUS LEGEND
============================================================ */

function StatusLegend({
  color,
  label,
}) {
  return (
    <div className="flex items-center gap-1.5">

      <span
        className={`w-2.5 h-2.5 rounded-sm ${color}`}
      />

      <span className="text-ink-muted">
        {label}
      </span>

    </div>
  );
}


/* ============================================================
   STATUS BOX
============================================================ */

function StatusBox({
  color,
  title,
  description,
}) {
  return (
    <div className="flex gap-3 border border-base-border rounded-md p-3 bg-base-panelAlt">

      <span
        className={`w-1 rounded-full ${color} shrink-0`}
      />

      <div>

        <p className="text-xs font-semibold text-ink-primary">
          {title}
        </p>

        <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
          {description}
        </p>

      </div>

    </div>
  );
}


/* ============================================================
   TOOLTIP
============================================================ */

function SalesTooltip({
  active,
  payload,
  label,
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  const sales = Number(point.sales) || 0;
  const production = Number(point.production) || 0;
  const plan = Number(point.plan) || 0;

  const gapPlan = sales - plan;
  const productionGapSales = production - sales;

  return (
    <div className="bg-base-panel border border-base-border rounded-lg shadow-lg p-4 min-w-[250px]">

      {/* DATE */}
      <p className="font-mono font-semibold text-sm text-ink-primary mb-3">
        {formatDateLong(label)}
      </p>

      <div className="space-y-2 text-xs">

        <TooltipRow
          label="Daily Plan"
          value={`${formatNumber(plan)} PCS`}
        />

        <TooltipRow
          label="Actual Sales"
          value={`${formatNumber(sales)} PCS`}
        />

        <TooltipRow
          label="Actual Production"
          value={`${formatNumber(production)} PCS`}
        />

        <div className="border-t border-base-border pt-2 mt-2">

          <TooltipRow
            label="Sales vs Plan"
            value={`${gapPlan >= 0 ? "+" : ""}${formatNumber(gapPlan)} PCS`}
            valueClass={
              gapPlan >= 0
                ? "text-signal-ok"
                : "text-signal-warn"
            }
          />

          <TooltipRow
            label="Production vs Sales"
            value={`${productionGapSales >= 0 ? "+" : ""}${formatNumber(productionGapSales)} PCS`}
            valueClass={
              productionGapSales >= 0
                ? "text-signal-ok"
                : "text-signal-crit"
            }
          />

        </div>

        {/* STATUS */}
        <div className="pt-2">

          <span
            className={`inline-flex items-center gap-2 font-semibold ${getStatusText(
              point.status
            )}`}
          >

            <span
              className={`w-2 h-2 rounded-full ${getStatusDot(
                point.status
              )}`}
            />

            {getStatusLabel(point.status)}

          </span>

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   TOOLTIP ROW
============================================================ */

function TooltipRow({
  label,
  value,
  valueClass = "text-ink-primary",
}) {
  return (
    <div className="flex justify-between gap-5">

      <span className="text-ink-muted">
        {label}
      </span>

      <span
        className={`font-mono font-semibold ${valueClass}`}
      >
        {value}
      </span>

    </div>
  );
}


/* ============================================================
   STATUS COLOR
============================================================ */

function getStatusColor(status) {
  switch (status) {

    case "target":
      return COLORS.green;

    case "below-plan":
      return COLORS.orange;

    default:
      return COLORS.orange;
  }
}


/* ============================================================
   STATUS TEXT
============================================================ */

function getStatusText(status) {
  switch (status) {

    case "target":
      return "text-signal-ok";

    case "below-plan":
      return "text-signal-warn";

    default:
      return "text-ink-muted";
  }
}


/* ============================================================
   STATUS DOT
============================================================ */

function getStatusDot(status) {
  switch (status) {

    case "target":
      return "bg-signal-ok";

    case "below-plan":
      return "bg-signal-warn";

    default:
      return "bg-ink-muted";
  }
}


/* ============================================================
   STATUS LABEL
============================================================ */

function getStatusLabel(status) {
  switch (status) {

    case "target":
      return "SALES ≥ PLAN";

    case "below-plan":
      return "SALES < PLAN";

    default:
      return "TIDAK DIKETAHUI";
  }
}


/* ============================================================
   DATE FORMAT
============================================================ */

function formatDate(value) {
  if (!value) return "";

  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  const [, month, day] = parts;

  return `${day}/${month}`;
}


function formatDateLong(value) {
  if (!value) return "-";

  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  const [year, month, day] = parts;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


/* ============================================================
   NUMBER FORMAT
============================================================ */

function formatNumber(value) {
  return Math.round(
    Number(value) || 0
  ).toLocaleString("id-ID");
}
