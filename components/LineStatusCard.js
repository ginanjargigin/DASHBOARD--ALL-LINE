"use client";

const COLORS = {
  green: "#35C979",
  orange: "#F2B033",
  red: "#EF5757",
  blue: "#4C8DFF",
  text: "#E7ECF2",
  muted: "#8B96A5",
  faint: "#5B6572",
  panel: "#141A21",
  border: "#29323C",
};

export default function LineStatusCard({
  line,
  production = 0,
  plan = 0,
  sales = 0,
}) {
  const actual = Number(production) || 0;
  const dailyPlan = Number(plan) || 0;
  const actualSales = Number(sales) || 0;

  const status = getStatus(
    actual,
    dailyPlan,
    actualSales
  );

  const achievement =
    dailyPlan > 0
      ? Math.round((actual / dailyPlan) * 100)
      : 0;

  const planPercent =
    dailyPlan > 0
      ? Math.min((actual / dailyPlan) * 100, 100)
      : 0;

  const gapPlan = actual - dailyPlan;
  const gapSales = actual - actualSales;

  return (
    <article
      className="relative overflow-hidden rounded-lg border px-3 py-3"
      style={{
        backgroundColor: COLORS.panel,
        borderColor: status.color,
        borderLeftWidth: "4px",
      }}
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between gap-2">

        <h2
          className="font-display font-bold text-base truncate"
          style={{ color: COLORS.text }}
          title={line?.name || "LINE"}
        >
          {line?.name || "LINE"}
        </h2>

        <div
          className="flex items-center gap-1.5 shrink-0 font-mono font-bold text-[9px]"
          style={{ color: status.color }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: status.color,
              boxShadow: `0 0 7px ${status.color}`,
            }}
          />

          {status.shortLabel}
        </div>

      </div>


      {/* =====================================================
          ACTUAL PRODUCTION
      ====================================================== */}

      <div className="mt-3 flex items-end justify-between">

        <div>

          <p
            className="text-[9px] uppercase tracking-wide"
            style={{ color: COLORS.muted }}
          >
            Actual Production
          </p>

          <div className="flex items-baseline gap-1 mt-0.5">

            <span
              className="font-display font-bold text-2xl leading-none"
              style={{ color: COLORS.text }}
            >
              {fmt(actual)}
            </span>

            <span
              className="font-mono text-[9px]"
              style={{ color: COLORS.muted }}
            >
              PCS
            </span>

          </div>

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
            {achievement}%
          </p>

        </div>

      </div>


      {/* =====================================================
          PROGRESS
      ====================================================== */}

      <div className="mt-2">

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


      {/* =====================================================
          PLAN / SALES
      ====================================================== */}

      <div className="grid grid-cols-2 gap-2 mt-3">

        <CompactMetric
          label="PLAN"
          value={dailyPlan}
          color={COLORS.blue}
        />

        <CompactMetric
          label="SALES"
          value={actualSales}
          color={COLORS.text}
        />

      </div>


      {/* =====================================================
          GAP
      ====================================================== */}

      <div
        className="mt-3 pt-2 border-t"
        style={{
          borderColor: COLORS.border,
        }}
      >

        <div className="grid grid-cols-2 gap-2">

          <GapMetric
            label="GAP PLAN"
            value={gapPlan}
            color={
              gapPlan >= 0
                ? COLORS.green
                : COLORS.orange
            }
          />

          <GapMetric
            label="GAP SALES"
            value={gapSales}
            color={
              gapSales >= 0
                ? COLORS.green
                : COLORS.red
            }
          />

        </div>

      </div>

    </article>
  );
}


/* ============================================================
   COMPACT METRIC
============================================================ */

function CompactMetric({
  label,
  value,
  color,
}) {
  return (
    <div>

      <p
        className="text-[8px] uppercase tracking-wide"
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
          className="font-normal text-[8px] ml-0.5"
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
  color,
}) {
  return (
    <div>

      <p
        className="text-[8px] uppercase tracking-wide"
        style={{ color: COLORS.muted }}
      >
        {label}
      </p>

      <p
        className="font-mono font-bold text-xs mt-0.5"
        style={{ color }}
      >
        {value > 0 ? "+" : ""}
        {fmt(value)}

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
  sales
) {

  // HIJAU
  if (plan > 0 && actual >= plan) {
    return {
      color: COLORS.green,
      shortLabel: "TARGET",
    };
  }

  // MERAH
  if (actual < sales) {
    return {
      color: COLORS.red,
      shortLabel: "BELOW SALES",
    };
  }

  // ORANYE
  return {
    color: COLORS.orange,
    shortLabel: "BELOW PLAN",
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
