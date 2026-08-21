"use client";

const COLORS = {
  green: "#35C979",
  orange: "#F2B033",
  red: "#EF5757",
  gray: "#66717F",
  blue: "#4C8DFF",
  text: "#E7ECF2",
  muted: "#8B96A5",
  panel: "#141A21",
  border: "#29323C",
};

export default function LineStatusCard({
  line,
  production = 0,
  plan = 0,
  sales = 0,
  hasData = true,
}) {
  const actual = Number(production) || 0;
  const dailyPlan = Number(plan) || 0;
  const actualSales = Number(sales) || 0;

  /*
   * STATUS
   *
   * NO DATA       : belum ada data
   * TARGET        : actual >= plan
   * BELOW PLAN    : actual < plan tetapi actual >= sales
   * BELOW SALES   : actual < sales
   */

  const status = getStatus(
    actual,
    dailyPlan,
    actualSales,
    hasData
  );

  const planPercent =
    dailyPlan > 0
      ? Math.min((actual / dailyPlan) * 100, 100)
      : 0;

  return (
    <article
      className="relative overflow-hidden rounded-lg border p-3"
      style={{
        backgroundColor: COLORS.panel,
        borderColor: status.color,
        borderLeftWidth: "4px",
      }}
    >

      {/* HEADER */}

      <div className="flex items-center justify-between gap-2">

        <h2
          className="font-display font-bold text-base truncate"
          style={{ color: COLORS.text }}
        >
          {line?.name || "LINE"}
        </h2>

        <div
          className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase shrink-0"
          style={{ color: status.color }}
        >

          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: status.color,
              boxShadow:
                status.glow
                  ? `0 0 7px ${status.color}`
                  : "none",
            }}
          />

          {status.shortLabel}

        </div>

      </div>


      {/* ACTUAL PRODUCTION */}

      <div className="mt-3">

        <div className="flex items-end justify-between gap-2">

          <div>

            <p
              className="text-[9px] uppercase tracking-wide"
              style={{ color: COLORS.muted }}
            >
              Actual Production
            </p>

            <p
              className="font-display font-bold text-2xl leading-none mt-1"
              style={{ color: COLORS.text }}
            >
              {fmt(actual)}

              <span
                className="text-[10px] font-mono ml-1"
                style={{ color: COLORS.muted }}
              >
                PCS
              </span>

            </p>

          </div>


          {/* ACHIEVEMENT */}

          <div className="text-right">

            <p
              className="text-[9px]"
              style={{ color: COLORS.muted }}
            >
              Achievement
            </p>

            <p
              className="font-mono font-bold text-sm"
              style={{ color: status.color }}
            >
              {dailyPlan > 0
                ? Math.round(
                    (actual / dailyPlan) * 100
                  )
                : 0}
              %
            </p>

          </div>

        </div>

      </div>


      {/* PROGRESS BAR */}

      <div className="mt-3">

        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{
            backgroundColor: "#202832",
          }}
        >

          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${planPercent}%`,
              backgroundColor: status.color,
            }}
          />

        </div>

      </div>


      {/* PLAN / SALES */}

      <div className="grid grid-cols-2 gap-3 mt-3">

        <Metric
          label="Plan"
          value={dailyPlan}
          color={COLORS.blue}
        />

        <Metric
          label="Sales"
          value={actualSales}
          color={COLORS.text}
        />

      </div>


      {/* GAP */}

      <div
        className="mt-3 pt-2 border-t"
        style={{
          borderColor: COLORS.border,
        }}
      >

        <div className="grid grid-cols-2 gap-3">

          <GapMetric
            label="Gap Plan"
            value={actual - dailyPlan}
            positiveColor={COLORS.green}
            negativeColor={COLORS.orange}
            hasData={hasData}
          />

          <GapMetric
            label="Gap Sales"
            value={actual - actualSales}
            positiveColor={COLORS.green}
            negativeColor={COLORS.red}
            hasData={hasData}
          />

        </div>

      </div>


      {/* STATUS MESSAGE */}

      <div
        className="mt-2 text-[9px] font-medium truncate"
        style={{ color: status.color }}
      >
        {status.message}
      </div>

    </article>
  );
}


/* ============================================================
   METRIC
============================================================ */

function Metric({
  label,
  value,
  color,
}) {
  return (
    <div>

      <p
        className="text-[9px] uppercase tracking-wide"
        style={{ color: COLORS.muted }}
      >
        {label}
      </p>

      <p
        className="font-mono font-bold text-xs mt-0.5"
        style={{ color }}
      >
        {fmt(value)}

        <span
          className="text-[8px] font-normal ml-1"
          style={{ color: COLORS.muted }}
        >
          PCS
        </span>

      </p>

    </div>
  );
}


/* ============================================================
   GAP METRIC
============================================================ */

function GapMetric({
  label,
  value,
  positiveColor,
  negativeColor,
  hasData,
}) {
  const number = Number(value) || 0;

  return (
    <div>

      <p
        className="text-[9px] uppercase tracking-wide"
        style={{ color: COLORS.muted }}
      >
        {label}
      </p>

      <p
        className="font-mono font-bold text-xs mt-0.5"
        style={{
          color: !hasData
            ? COLORS.gray
            : number >= 0
              ? positiveColor
              : negativeColor,
        }}
      >
        {!hasData
          ? "-"
          : `${number > 0 ? "+" : ""}${fmt(number)}`}

      </p>

    </div>
  );
}


/* ============================================================
   STATUS
============================================================ */

function getStatus(
  actual,
  plan,
  sales,
  hasData
) {

  // NO DATA
  if (!hasData) {
    return {
      color: COLORS.gray,
      shortLabel: "NO DATA",
      message: "Belum ada data produksi",
      glow: false,
    };
  }


  // TARGET
  if (plan > 0 && actual >= plan) {
    return {
      color: COLORS.green,
      shortLabel: "TARGET",
      message: "Production target tercapai",
      glow: true,
    };
  }


  // BELOW PLAN
  if (actual >= sales) {
    return {
      color: COLORS.orange,
      shortLabel: "BELOW PLAN",
      message: "Production masih di bawah daily plan",
      glow: true,
    };
  }


  // BELOW SALES
  return {
    color: COLORS.red,
    shortLabel: "BELOW SALES",
    message: "Production di bawah kebutuhan sales",
    glow: true,
  };
}


/* ============================================================
   NUMBER FORMAT
============================================================ */

function fmt(value) {
  return Math.round(
    Number(value) || 0
  ).toLocaleString("id-ID");
}
