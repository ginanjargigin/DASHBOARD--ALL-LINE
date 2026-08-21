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

  /*
   * STATUS
   *
   * Hijau  : actual >= plan
   * Oranye : actual < plan tetapi actual >= sales
   * Merah  : actual < sales
   */
  const status = getStatus(
    actual,
    dailyPlan,
    actualSales
  );

  const planPercent =
    dailyPlan > 0
      ? Math.min((actual / dailyPlan) * 100, 100)
      : 0;

  const salesPercent =
    actualSales > 0
      ? Math.min((actual / actualSales) * 100, 100)
      : 0;

  return (
    <article
      className="relative overflow-hidden rounded-lg border p-4"
      style={{
        backgroundColor: COLORS.panel,
        borderColor: status.color,
        borderLeftWidth: "4px",
      }}
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between gap-3">

        <div className="min-w-0">

          <h2
            className="font-display font-bold text-lg truncate"
            style={{ color: COLORS.text }}
          >
            {line?.name || "LINE"}
          </h2>

          <p
            className="text-[10px] uppercase tracking-wider mt-0.5"
            style={{ color: COLORS.muted }}
          >
            Production Status
          </p>

        </div>

        {/* STATUS DOT */}

        <div
          className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase shrink-0"
          style={{ color: status.color }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: status.color,
              boxShadow: `0 0 8px ${status.color}`,
            }}
          />

          {status.shortLabel}
        </div>

      </div>


      {/* =====================================================
          ACTUAL PRODUCTION
      ====================================================== */}

      <div className="mt-5">

        <div className="flex items-end justify-between gap-2">

          <div>

            <p
              className="text-[10px] uppercase tracking-wide"
              style={{ color: COLORS.muted }}
            >
              Actual Production
            </p>

            <p
              className="font-display font-bold text-3xl leading-none mt-1"
              style={{ color: COLORS.text }}
            >
              {fmt(actual)}
              <span
                className="text-xs font-mono ml-1"
                style={{ color: COLORS.muted }}
              >
                PCS
              </span>
            </p>

          </div>

          {/* PERCENT */}

          <div className="text-right">

            <p
              className="text-[10px]"
              style={{ color: COLORS.muted }}
            >
              Achievement
            </p>

            <p
              className="font-mono font-bold text-sm"
              style={{ color: status.color }}
            >
              {Math.round(
                dailyPlan > 0
                  ? (actual / dailyPlan) * 100
                  : 0
              )}
              %
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          PROGRESS BAR
      ====================================================== */}

      <div className="mt-4">

        <div
          className="h-2 rounded-full overflow-hidden"
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

      <div className="grid grid-cols-2 gap-3 mt-4">

        {/* PLAN */}

        <Metric
          label="Daily Plan"
          value={dailyPlan}
          color={COLORS.blue}
        />

        {/* SALES */}

        <Metric
          label="Actual Sales"
          value={actualSales}
          color={COLORS.text}
        />

      </div>


      {/* =====================================================
          GAP
      ====================================================== */}

      <div
        className="mt-4 pt-3 border-t"
        style={{
          borderColor: COLORS.border,
        }}
      >

        <div className="flex items-center justify-between">

          <span
            className="text-[10px] uppercase"
            style={{ color: COLORS.muted }}
          >
            Gap Plan
          </span>

          <span
            className="font-mono font-bold text-xs"
            style={{
              color:
                actual - dailyPlan >= 0
                  ? COLORS.green
                  : COLORS.orange,
            }}
          >
            {actual - dailyPlan > 0 ? "+" : ""}
            {fmt(actual - dailyPlan)} PCS
          </span>

        </div>

        <div className="flex items-center justify-between mt-1">

          <span
            className="text-[10px] uppercase"
            style={{ color: COLORS.muted }}
          >
            Gap Sales
          </span>

          <span
            className="font-mono font-bold text-xs"
            style={{
              color:
                actual - actualSales >= 0
                  ? COLORS.green
                  : COLORS.red,
            }}
          >
            {actual - actualSales > 0 ? "+" : ""}
            {fmt(actual - actualSales)} PCS
          </span>

        </div>

      </div>


      {/* =====================================================
          STATUS MESSAGE
      ====================================================== */}

      <div
        className="mt-3 text-[10px] font-medium"
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
        className="text-[10px] uppercase tracking-wide"
        style={{ color: COLORS.muted }}
      >
        {label}
      </p>

      <p
        className="font-mono font-bold text-sm mt-1"
        style={{ color }}
      >
        {fmt(value)}
        <span
          className="text-[9px] font-normal ml-1"
          style={{ color: COLORS.muted }}
        >
          PCS
        </span>
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
      message: "Production target tercapai",
    };
  }

  // ORANYE
  if (actual >= sales) {
    return {
      color: COLORS.orange,
      shortLabel: "BELOW PLAN",
      message: "Production masih di bawah daily plan",
    };
  }

  // MERAH
  return {
    color: COLORS.red,
    shortLabel: "BELOW SALES",
    message: "Production di bawah kebutuhan sales",
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
