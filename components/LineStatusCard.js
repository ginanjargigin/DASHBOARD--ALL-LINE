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
      className="
        relative
        overflow-hidden
        rounded-lg
        border
        px-3
        py-2.5
        flex
        flex-col
        min-w-0
      "
      style={{
        backgroundColor: COLORS.panel,
        borderColor: status.color,
        borderLeftWidth: "3px",
      }}
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between gap-2 min-w-0">

        <h2
          className="
            font-display
            font-bold
            text-sm
            xl:text-base
            truncate
            min-w-0
          "
          style={{ color: COLORS.text }}
        >
          {line?.name || "LINE"}
        </h2>

        <div
          className="
            flex
            items-center
            gap-1
            text-[8px]
            xl:text-[9px]
            font-mono
            font-bold
            uppercase
            shrink-0
          "
          style={{ color: status.color }}
        >

          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: status.color,
              boxShadow: `0 0 6px ${status.color}`,
            }}
          />

          {status.shortLabel}

        </div>

      </div>


      {/* =====================================================
          ACTUAL + ACHIEVEMENT
      ====================================================== */}

      <div className="flex items-end justify-between gap-2 mt-3">

        <div>

          <p
            className="
              text-[8px]
              xl:text-[9px]
              uppercase
              tracking-wide
            "
            style={{ color: COLORS.muted }}
          >
            Actual Production
          </p>

          <p
            className="
              font-display
              font-bold
              text-2xl
              xl:text-3xl
              leading-none
              mt-0.5
            "
            style={{ color: COLORS.text }}
          >
            {fmt(actual)}

            <span
              className="
                text-[9px]
                xl:text-[10px]
                font-mono
                ml-1
              "
              style={{ color: COLORS.muted }}
            >
              PCS
            </span>

          </p>

        </div>


        <div className="text-right">

          <p
            className="text-[8px] xl:text-[9px]"
            style={{ color: COLORS.muted }}
          >
            Achievement
          </p>

          <p
            className="
              font-mono
              font-bold
              text-sm
              xl:text-base
            "
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
            className="h-full rounded-full"
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

      <div className="grid grid-cols-2 gap-2 mt-2.5">

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


      {/* =====================================================
          GAP
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-2
          gap-2
          mt-2.5
          pt-2
          border-t
        "
        style={{
          borderColor: COLORS.border,
        }}
      >

        <GapMetric
          label="Gap Plan"
          value={gapPlan}
          positiveColor={COLORS.green}
          negativeColor={COLORS.orange}
        />

        <GapMetric
          label="Gap Sales"
          value={gapSales}
          positiveColor={COLORS.green}
          negativeColor={COLORS.red}
        />

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
    <div className="min-w-0">

      <p
        className="
          text-[8px]
          xl:text-[9px]
          uppercase
          tracking-wide
        "
        style={{ color: COLORS.muted }}
      >
        {label}
      </p>

      <p
        className="
          font-mono
          font-bold
          text-xs
          xl:text-sm
          mt-0.5
          truncate
        "
        style={{ color }}
      >
        {fmt(value)}

        <span
          className="text-[8px] font-normal ml-0.5"
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
}) {
  const number = Number(value) || 0;

  return (
    <div className="min-w-0">

      <p
        className="
          text-[8px]
          xl:text-[9px]
          uppercase
          tracking-wide
        "
        style={{ color: COLORS.muted }}
      >
        {label}
      </p>

      <p
        className="
          font-mono
          font-bold
          text-xs
          xl:text-sm
          mt-0.5
          truncate
        "
        style={{
          color:
            number >= 0
              ? positiveColor
              : negativeColor,
        }}
      >
        {number > 0 ? "+" : ""}
        {fmt(number)}
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

  // ORANYE
  if (actual >= sales) {
    return {
      color: COLORS.orange,
      shortLabel: "BELOW PLAN",
    };
  }

  // MERAH
  return {
    color: COLORS.red,
    shortLabel: "BELOW SALES",
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
