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

export default function SalesPlanChart({
  data = [],
  plan = 0,
}) {
  if (!data.length) {
    return (
      <EmptyChart message="Belum ada data sales untuk periode ini." />
    );
  }

  const width = 1000;
  const height = 390;

  const pad = {
    top: 28,
    right: 28,
    bottom: 62,
    left: 70,
  };

  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  /*
   * =========================================================
   * DATA
   * =========================================================
   */

  const chartData = data.map((item) => {
    const sales = Number(item.sales) || 0;
    const production = Number(item.actual) || 0;
    const dailyPlan = Number(plan) || 0;

    let status = "red";

    if (dailyPlan > 0 && production >= dailyPlan) {
      status = "green";
    } else if (production >= sales) {
      status = "orange";
    }

    return {
      ...item,
      sales,
      production,
      plan: dailyPlan,
      status,
    };
  });

  /*
   * =========================================================
   * SCALE
   * =========================================================
   */

  const maxValue = Math.max(
    plan || 0,
    ...chartData.map((d) => d.production),
    ...chartData.map((d) => d.sales),
    1
  );

  const yMax = niceMax(maxValue * 1.12);

  const xStep =
    chartData.length > 1
      ? innerW / chartData.length
      : innerW;

  const barWidth = Math.min(
    42,
    Math.max(18, xStep * 0.42)
  );

  const y = (value) =>
    pad.top +
    innerH -
    (value / yMax) * innerH;

  const x = (index) =>
    pad.left +
    xStep * index +
    xStep / 2;

  const baseline = pad.top + innerH;

  const planY = y(plan || 0);

  const gridValues = makeTicks(yMax, 5);

  /*
   * =========================================================
   * STATUS SUMMARY
   * =========================================================
   */

  const greenCount = chartData.filter(
    (item) => item.status === "green"
  ).length;

  const orangeCount = chartData.filter(
    (item) => item.status === "orange"
  ).length;

  const redCount = chartData.filter(
    (item) => item.status === "red"
  ).length;

  return (
    <div className="w-full">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">

        <div>
          <h2 className="font-display font-bold text-xl">
            Actual Sales vs Production Plan
          </h2>

          <p className="text-xs text-ink-muted mt-0.5">
            Perbandingan actual sales, actual production,
            dan daily production plan.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-mono">

          {/* PLAN */}

          <Legend
            color={COLORS.blue}
            label={`Plan ${fmt(plan)} PCS`}
            line
          />

          {/* ACTUAL SALES */}

          <Legend
            color={COLORS.orange}
            label="Actual Sales"
            line
          />

          {/* ACTUAL PRODUCTION */}

          <Legend
            color={COLORS.green}
            label="Actual Production"
          />

        </div>

      </div>


      {/* =====================================================
          PLAN INFO
      ====================================================== */}

      <div className="mb-3">

        <div className="
          inline-flex
          items-center
          gap-2
          bg-base-panelAlt
          border
          border-base-border
          rounded
          px-3
          py-2
        ">

          <span
            className="w-5 border-t-2 border-dashed"
            style={{
              borderColor: COLORS.blue,
            }}
          />

          <span className="text-xs text-ink-muted">
            Daily Production Plan
          </span>

          <span className="
            font-mono
            text-sm
            font-semibold
            text-ink-primary
          ">
            {fmt(plan)} PCS
          </span>

        </div>

      </div>


      {/* =====================================================
          SVG CHART
      ====================================================== */}

      <div className="w-full aspect-[1000/390]">

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          role="img"
          aria-label="Grafik actual sales, actual production dan production plan"
        >

          {/* PANEL */}

          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx="10"
            fill={COLORS.panel}
          />


          {/* =================================================
              GRID
          ================================================== */}

          {gridValues.map((value) => (
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
            y={pad.top - 8}
            fill={COLORS.muted}
            fontSize="11"
            fontFamily="sans-serif"
          >
            PCS
          </text>


          {/* =================================================
              PRODUCTION PLAN
          ================================================== */}

          {plan > 0 && (
            <>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={planY}
                y2={planY}
                stroke={COLORS.blue}
                strokeWidth="3"
                strokeDasharray="10 7"
              />

              <text
                x={width - pad.right}
                y={planY - 9}
                textAnchor="end"
                fill={COLORS.blue}
                fontSize="12"
                fontWeight="700"
                fontFamily="monospace"
              >
                PLAN {fmt(plan)}
              </text>
            </>
          )}


          {/* =================================================
              ACTUAL PRODUCTION - BAR
          ================================================== */}

          {chartData.map((item, index) => {

            const production =
              item.production;

            const barX =
              x(index) -
              barWidth / 2;

            const barY =
              y(production);

            const barH =
              baseline - barY;

            const color =
              item.status === "green"
                ? COLORS.green
                : item.status === "orange"
                ? COLORS.orange
                : COLORS.red;

            return (
              <g
                key={`production-bar-${item.date}-${index}`}
              >

                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={Math.max(barH, 1)}
                  rx="3"
                  fill={color}
                  opacity="0.92"
                >

                  <title>
                    {`${formatDateLong(item.date)}
                    — Production ${fmt(production)} PCS
                    — Sales ${fmt(item.sales)} PCS`}
                  </title>

                </rect>


                {/* PRODUCTION VALUE */}

                <text
                  x={x(index)}
                  y={Math.max(
                    barY - 8,
                    pad.top + 12
                  )}
                  textAnchor="middle"
                  fill={COLORS.text}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {fmt(production)}
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


                {/* SALES VALUE */}

                <text
                  x={x(index)}
                  y={baseline + 39}
                  textAnchor="middle"
                  fill={COLORS.faint}
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  Sales {fmt(item.sales)}
                </text>

              </g>
            );
          })}


          {/* =================================================
              ACTUAL SALES - ORANGE DASHED LINE
          ================================================== */}

          {chartData.length > 1 && (
            <polyline
              points={chartData
                .map(
                  (item, index) =>
                    `${x(index)},${y(item.sales)}`
                )
                .join(" ")}
              fill="none"
              stroke={COLORS.orange}
              strokeWidth="3"
              strokeDasharray="7 5"
            />
          )}


          {/* =================================================
              ACTUAL SALES POINTS
          ================================================== */}

          {chartData.map((item, index) => (
            <circle
              key={`sales-point-${item.date}-${index}`}
              cx={x(index)}
              cy={y(item.sales)}
              r="4"
              fill={COLORS.orange}
              stroke={COLORS.panel}
              strokeWidth="2"
            >
              <title>
                {`${formatDateLong(item.date)}
                — Actual Sales ${fmt(item.sales)} PCS`}
              </title>
            </circle>
          ))}

        </svg>

      </div>


      {/* =====================================================
          STATUS SUMMARY
      ====================================================== */}

      <div className="
        grid
        grid-cols-1
        md:grid-cols-3
        gap-3
        mt-3
      ">

        <StatusBox
          color="bg-signal-ok"
          title={`${greenCount} HARI TARGET`}
          description="Produksi mencapai daily production plan."
        />

        <StatusBox
          color="bg-signal-warn"
          title={`${orangeCount} HARI DI BAWAH PLAN`}
          description="Produksi belum mencapai plan tetapi masih memenuhi sales."
        />

        <StatusBox
          color="bg-signal-crit"
          title={`${redCount} HARI DI BAWAH SALES`}
          description="Produksi belum memenuhi kebutuhan actual sales."
        />

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
    <span className="
      inline-flex
      items-center
      gap-1.5
      text-ink-muted
    ">

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
   STATUS BOX
============================================================ */

function StatusBox({
  color,
  title,
  description,
}) {
  return (
    <div className="
      flex
      gap-3
      border
      border-base-border
      rounded-md
      p-3
      bg-base-panelAlt
    ">

      <span
        className={`
          w-1
          rounded-full
          ${color}
          shrink-0
        `}
      />

      <div>

        <p className="
          text-xs
          font-semibold
          text-ink-primary
        ">
          {title}
        </p>

        <p className="
          text-[11px]
          text-ink-muted
          mt-1
          leading-relaxed
        ">
          {description}
        </p>

      </div>

    </div>
  );
}


/* ============================================================
   EMPTY
============================================================ */

function EmptyChart({
  message,
}) {
  return (
    <div className="
      h-72
      rounded-lg
      bg-base-panel
      border
      border-base-border
      flex
      items-center
      justify-center
      text-sm
      text-ink-muted
    ">
      {message}
    </div>
  );
}


/* ============================================================
   SCALE
============================================================ */

function niceMax(value) {
  const step =
    value <= 500
      ? 50
      : value <= 2000
      ? 250
      : 500;

  return Math.ceil(
    value / step
  ) * step;
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
   NUMBER
============================================================ */

function fmt(value) {
  return Math.round(
    Number(value) || 0
  ).toLocaleString("id-ID");
}


/* ============================================================
   DATE
============================================================ */

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
