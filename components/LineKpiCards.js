"use client";

const COLORS = {
  green: "#22c55e",
  orange: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  white: "#e5e7eb",
};

export default function LineKpiCards({
  production = 0,
  plan = 0,
  sales = 0,
  otActual = 0,
  otPlan = 0,
}) {
  const productionValue = Number(production) || 0;
  const planValue = Number(plan) || 0;
  const salesValue = Number(sales) || 0;
  const otActualValue = Number(otActual) || 0;
  const otPlanValue = Number(otPlan) || 0;

  const productionPercent =
    planValue > 0
      ? (productionValue / planValue) * 100
      : 0;

  const salesPercent =
    planValue > 0
      ? (salesValue / planValue) * 100
      : 0;

  /*
   * STATUS PRODUCTION
   *
   * Hijau  : Production >= Plan
   * Oranye : Production < Plan tetapi >= Sales
   * Merah   : Production < Sales
   */
  let productionStatus = "orange";

  if (productionValue >= planValue && planValue > 0) {
    productionStatus = "green";
  } else if (productionValue < salesValue) {
    productionStatus = "red";
  }

  /*
   * STATUS SALES
   *
   * Hijau  : Sales >= Plan
   * Oranye : Sales < Plan
   */
  const salesStatus =
    salesValue >= planValue && planValue > 0
      ? "green"
      : "orange";

  /*
   * STATUS OVERTIME
   *
   * Hijau  : Actual OT <= Plan OT
   * Merah  : Actual OT > Plan OT
   */
  const otStatus =
    otActualValue > otPlanValue && otPlanValue > 0
      ? "red"
      : "green";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* =====================================================
          PRODUCTION
      ====================================================== */}

      <KpiCard
        title="PRODUCTION"
        value={formatNumber(productionValue)}
        unit="PCS"
        percentage={productionPercent}
        status={productionStatus}
        statusLabel={getProductionStatusLabel(
          productionStatus
        )}
      />


      {/* =====================================================
          SALES
      ====================================================== */}

      <KpiCard
        title="SALES"
        value={formatNumber(salesValue)}
        unit="PCS"
        percentage={salesPercent}
        status={salesStatus}
        statusLabel={
          salesStatus === "green"
            ? "TARGET TERCAPAI"
            : "BELOW PLAN"
        }
      />


      {/* =====================================================
          OVERTIME
      ====================================================== */}

      <KpiCard
        title="OVERTIME"
        value={formatNumberDecimal(otActualValue)}
        unit="H"
        secondary={`PLAN ${formatNumberDecimal(otPlanValue)} H`}
        status={otStatus}
        statusLabel={
          otStatus === "red"
            ? `OT OVER PLAN +${formatNumberDecimal(
                otActualValue - otPlanValue
              )} H`
            : "WITHIN PLAN"
        }
      />

    </div>
  );
}


/* ============================================================
   KPI CARD
============================================================ */

function KpiCard({
  title,
  value,
  unit,
  percentage,
  secondary,
  status,
  statusLabel,
}) {
  const color = getStatusColor(status);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-base-border bg-base-panel p-5"
      style={{
        boxShadow: `inset 3px 0 0 ${color}`,
      }}
    >

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <span className="text-xs font-mono font-semibold tracking-wider text-ink-muted">
          {title}
        </span>

        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />

      </div>


      {/* VALUE */}

      <div className="mt-5 flex items-end gap-2">

        <span className="font-display text-3xl font-bold text-ink-primary">
          {value}
        </span>

        <span className="mb-1 text-xs font-mono text-ink-muted">
          {unit}
        </span>

      </div>


      {/* PERCENTAGE */}

      {percentage !== undefined && (
        <div className="mt-2">

          <span
            className="font-mono text-sm font-semibold"
            style={{
              color,
            }}
          >
            {percentage.toFixed(0)}%
          </span>

          <span className="ml-2 text-xs text-ink-muted">
            vs plan
          </span>

        </div>
      )}


      {/* SECONDARY */}

      {secondary && (
        <div className="mt-2 text-xs font-mono text-ink-muted">
          {secondary}
        </div>
      )}


      {/* STATUS */}

      <div className="mt-4 flex items-center gap-2">

        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: color,
          }}
        />

        <span
          className="text-[11px] font-mono font-semibold"
          style={{
            color,
          }}
        >
          {statusLabel}
        </span>

      </div>

    </div>
  );
}


/* ============================================================
   PRODUCTION STATUS
============================================================ */

function getProductionStatusLabel(status) {
  switch (status) {
    case "green":
      return "TARGET TERCAPAI";

    case "red":
      return "DI BAWAH SALES";

    default:
      return "BELOW PLAN";
  }
}


/* ============================================================
   COLOR
============================================================ */

function getStatusColor(status) {
  switch (status) {
    case "green":
      return COLORS.green;

    case "red":
      return COLORS.red;

    default:
      return COLORS.orange;
  }
}


/* ============================================================
   FORMAT
============================================================ */

function formatNumber(value) {
  return Math.round(
    Number(value) || 0
  ).toLocaleString("id-ID");
}


function formatNumberDecimal(value) {
  return Number(value || 0).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
