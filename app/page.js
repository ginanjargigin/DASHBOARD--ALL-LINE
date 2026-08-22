"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getLines,
  getRecords,
  getPlanForDate,
} from "@/lib/storage";

import { actualProduction } from "@/lib/calc";

import ProductionPlanChart from "@/components/ProductionPlanChart";
import SalesPlanChart from "@/components/SalesPlanChart";
import LineKpiCards from "@/components/LineKpiCards";
import OvertimeAnalysis from "@/components/OvertimeAnalysis";

export default function DashboardPage() {
  const [lines, setLines] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [now, setNow] = useState(null);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    const refresh = () => {
      const nextLines = getLines();
      const nextRecords = getRecords();

      setLines(nextLines);
      setRecords(nextRecords);
      setNow(new Date());

      setSelectedLineId((old) => {
        return old || nextLines[0]?.id || "";
      });

      setSelectedMonth((old) => {
        if (old) return old;

        const dates = nextRecords
          .map((r) => r.date)
          .filter(Boolean)
          .sort();

        return dates.length
          ? dates[dates.length - 1].slice(0, 7)
          : new Date().toISOString().slice(0, 7);
      });
    };

    refresh();

    const dataTimer = setInterval(refresh, 30000);
    const clockTimer = setInterval(
      () => setNow(new Date()),
      1000
    );

    return () => {
      clearInterval(dataTimer);
      clearInterval(clockTimer);
    };
  }, []);

  // =========================================================
  // MONTHS
  // =========================================================

  const availableMonths = useMemo(() => {
    const months = new Set();

    records.forEach((record) => {
      if (record.date) {
        months.add(record.date.slice(0, 7));
      }
    });

    if (selectedMonth) {
      months.add(selectedMonth);
    }

    return [...months].sort().reverse();
  }, [records, selectedMonth]);

  // =========================================================
  // SELECTED LINE
  // =========================================================

  const selectedLine = useMemo(() => {
    return (
      lines.find(
        (line) => line.id === selectedLineId
      ) ||
      lines[0] ||
      null
    );
  }, [lines, selectedLineId]);

  // =========================================================
  // RECORDS
  // =========================================================

  const lineRecords = useMemo(() => {
    if (!selectedLine) return [];

    return records
      .filter(
        (record) =>
          record.lineId === selectedLine.id &&
          record.date?.startsWith(selectedMonth)
      )
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      );
  }, [
    records,
    selectedLine,
    selectedMonth,
  ]);

  // =========================================================
  // CHART DATA
  // =========================================================

  const chartData = useMemo(() => {
    if (!selectedLine) return [];

    return lineRecords.map((record) => ({
      date: record.date,

      // PRODUKSI AKTUAL
      actual: actualProduction(record),

      // SALES AKTUAL
      sales:
        Number(record.actualSales) || 0,

      // PLAN HARIAN
      plan:
        Number(
          getPlanForDate(
            selectedLine.id,
            record.date
          )
        ) || 0,

      // OVERTIME
      planOT:
        Number(record.planOT) || 0,

      actualOT:
        Number(record.actualOT) || 0,
    }));
  }, [
    lineRecords,
    selectedLine,
  ]);

  // =========================================================
  // DAILY PLAN
  // =========================================================

  const dailyPlan = useMemo(() => {
    const item = chartData.find(
      (item) => item.plan > 0
    );

    return item?.plan || 0;
  }, [chartData]);

  // =========================================================
  // LATEST DATA
  // =========================================================

  const latestData = useMemo(() => {
    if (!lineRecords.length) {
      return {
        plan: 0,
        actual: 0,
        sales: 0,
        planOT: 0,
        actualOT: 0,
      };
    }

    const record =
      lineRecords[lineRecords.length - 1];

    return {
      plan:
        Number(
          getPlanForDate(
            record.lineId,
            record.date
          )
        ) || 0,

      actual:
        actualProduction(record),

      sales:
        Number(record.actualSales) || 0,

      planOT:
        Number(record.planOT) || 0,

      actualOT:
        Number(record.actualOT) || 0,
    };
  }, [lineRecords]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const summary = useMemo(() => {
    let green = 0;
    let orange = 0;
    let red = 0;

    chartData.forEach((item) => {
      if (
        item.plan > 0 &&
        item.actual >= item.plan
      ) {
        green++;
      } else if (
        item.actual >= item.sales
      ) {
        orange++;
      } else {
        red++;
      }
    });

    return {
      green,
      orange,
      red,
      total: chartData.length,
    };
  }, [chartData]);

  // =========================================================
  // MONTHLY TOTAL
  // =========================================================

  const monthly = useMemo(() => {
    const totalProduction =
      chartData.reduce(
        (sum, item) =>
          sum + item.actual,
        0
      );

    const totalSales =
      chartData.reduce(
        (sum, item) =>
          sum + item.sales,
        0
      );

    const totalPlan =
      chartData.reduce(
        (sum, item) =>
          sum + item.plan,
        0
      );

    return {
      totalProduction,
      totalSales,
      totalPlan,
    };
  }, [chartData]);

  // =========================================================
  // EMPTY
  // =========================================================

  if (!lines.length) {
    return (
      <main className="max-w-[1600px] mx-auto px-5 py-16">
        <div className="border border-dashed border-base-border rounded-lg py-16 text-center">

          <p className="text-ink-muted mb-3">
            Belum ada line yang terdaftar.
          </p>

          <Link
            href="/lines"
            className="text-signal-plan font-medium hover:underline"
          >
            Tambah line pertama →
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1600px] mx-auto px-5 py-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="mb-5">

        <div className="flex flex-wrap items-end justify-between gap-4">

          <div>

            <p className="text-ink-muted text-sm font-mono">
              {now
                ? now.toLocaleDateString(
                    "id-ID",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )
                : ""}
            </p>

            <h1 className="font-display font-bold text-3xl mt-1">
              Status Line — Production vs Sales
            </h1>

            <p className="text-sm text-ink-muted mt-1">
              Monitoring pencapaian produksi terhadap
              daily plan dan actual sales.
            </p>

          </div>

          <div className="flex flex-wrap gap-2">

            <Link
              href="/tv"
              className="
                px-3 py-1.5
                rounded
                border border-signal-plan
                text-signal-plan
                text-xs
                font-bold
                hover:bg-signal-plan/10
              "
            >
              ▣ TV MODE
            </Link>

            <SummaryPill
              color="bg-signal-ok"
              label="Target"
              value={summary.green}
            />

            <SummaryPill
              color="bg-signal-warn"
              label="Di bawah plan"
              value={summary.orange}
            />

            <SummaryPill
              color="bg-signal-crit"
              label="Di bawah sales"
              value={summary.red}
            />

          </div>

        </div>

      </header>


      {/* =====================================================
          FILTER
      ===================================================== */}

      <section className="
        bg-base-panel
        border border-base-border
        rounded-lg
        p-4
        mb-5
      ">

        <div className="flex flex-wrap items-end gap-4">

          <label className="min-w-[220px]">

            <span className="block text-xs text-ink-muted mb-1">
              Line
            </span>

            <select
              value={selectedLine?.id || ""}
              onChange={(e) =>
                setSelectedLineId(
                  e.target.value
                )
              }
              className="input"
            >

              {lines.map((line) => (
                <option
                  key={line.id}
                  value={line.id}
                >
                  {line.name}
                </option>
              ))}

            </select>

          </label>


          <label className="min-w-[190px]">

            <span className="block text-xs text-ink-muted mb-1">
              Periode
            </span>

            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(
                  e.target.value
                )
              }
              className="input"
            >

              {availableMonths.map(
                (month) => (
                  <option
                    key={month}
                    value={month}
                  >
                    {formatMonth(month)}
                  </option>
                )
              )}

            </select>

          </label>


          <Metric
            label="Daily Plan"
            value={`${fmt(dailyPlan)} PCS`}
          />

          <Metric
            label="Total Plan"
            value={`${fmt(monthly.totalPlan)} PCS`}
          />

          <Metric
            label="Hari Data"
            value={`${chartData.length} hari`}
          />

        </div>

      </section>


      {/* =====================================================
          NO DATA
      ===================================================== */}

      {!chartData.length ? (

        <div className="
          border border-dashed
          border-base-border
          rounded-lg
          py-16
          text-center
        ">

          <p className="text-ink-muted">
            Belum ada data untuk{" "}
            <strong>
              {selectedLine?.name}
            </strong>
            {" "}pada{" "}
            <strong>
              {formatMonth(selectedMonth)}
            </strong>.
          </p>

        </div>

      ) : (

        <div className="space-y-5">

          {/* =================================================
              KPI
          ================================================== */}

          <LineKpiCards
            production={latestData.actual}
            plan={latestData.plan}
            sales={latestData.sales}
            otActual={latestData.actualOT}
            otPlan={latestData.planOT}
          />


          {/* =================================================
              CHART
          ================================================== */}

          <section className="
            grid
            grid-cols-1
            xl:grid-cols-2
            gap-4
          ">

            <div className="
              bg-base-panel
              border border-base-border
              rounded-lg
              p-4
            ">

              <ProductionPlanChart
                data={chartData}
                plan={dailyPlan}
              />

            </div>


            <div className="
              bg-base-panel
              border border-base-border
              rounded-lg
              p-4
            ">

              <SalesPlanChart
                data={chartData}
                plan={dailyPlan}
              />

            </div>

          </section>


          {/* =================================================
              OVERTIME
          ================================================== */}

          <OvertimeAnalysis
            data={chartData}
          />


          {/* =================================================
              TABLE
          ================================================== */}

          <DailyStatusTable
            data={chartData}
          />

        </div>

      )}

    </main>
  );
}


/* ============================================================
   SUMMARY
============================================================ */

function SummaryPill({
  color,
  label,
  value,
}) {
  return (
    <div className="
      flex items-center gap-2
      bg-base-panel
      border border-base-border
      rounded
      px-3 py-1.5
      font-mono text-xs
    ">

      <span
        className={`w-2.5 h-2.5 rounded-full ${color}`}
      />

      <span className="text-ink-muted">
        {label}
      </span>

      <strong className="text-ink-primary">
        {value}
      </strong>

    </div>
  );
}


/* ============================================================
   METRIC
============================================================ */

function Metric({
  label,
  value,
}) {
  return (
    <div className="ml-auto">

      <p className="
        text-[11px]
        text-ink-faint
        uppercase
      ">
        {label}
      </p>

      <p className="
        font-mono
        font-semibold
        text-ink-primary
      ">
        {value}
      </p>

    </div>
  );
}


/* ============================================================
   TABLE
============================================================ */

function DailyStatusTable({
  data,
}) {
  return (
    <section className="
      bg-base-panel
      border border-base-border
      rounded-lg
      overflow-hidden
    ">

      <div className="
        px-4 py-3
        border-b border-base-border
      ">

        <h2 className="
          font-display
          font-bold
          text-lg
        ">
          Status Harian
        </h2>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="
            bg-base-panelAlt
            text-ink-muted
            text-xs
            uppercase
          ">

            <tr>

              <th className="text-left px-4 py-3">
                Tanggal
              </th>

              <th className="text-right px-4 py-3">
                Plan
              </th>

              <th className="text-right px-4 py-3">
                Actual
              </th>

              <th className="text-right px-4 py-3">
                Sales
              </th>

              <th className="text-right px-4 py-3">
                Gap Plan
              </th>

              <th className="text-right px-4 py-3">
                Gap Sales
              </th>

              <th className="text-left px-4 py-3">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {data.map((item) => {

              const gapPlan =
                item.actual - item.plan;

              const gapSales =
                item.actual - item.sales;

              const status =
                getStatus(
                  item.actual,
                  item.plan,
                  item.sales
                );

              return (
                <tr
                  key={item.date}
                  className="
                    border-t
                    border-base-border
                    hover:bg-base-panelAlt/50
                  "
                >

                  <td className="px-4 py-3 font-mono">
                    {formatDateLong(item.date)}
                  </td>

                  <td className="
                    px-4 py-3
                    text-right
                    font-mono
                  ">
                    {fmt(item.plan)}
                  </td>

                  <td className="
                    px-4 py-3
                    text-right
                    font-mono
                    font-semibold
                  ">
                    {fmt(item.actual)}
                  </td>

                  <td className="
                    px-4 py-3
                    text-right
                    font-mono
                  ">
                    {fmt(item.sales)}
                  </td>

                  <td className={`
                    px-4 py-3
                    text-right
                    font-mono
                    ${
                      gapPlan >= 0
                        ? "text-signal-ok"
                        : "text-signal-warn"
                    }
                  `}>
                    {gapPlan > 0 ? "+" : ""}
                    {fmt(gapPlan)}
                  </td>

                  <td className={`
                    px-4 py-3
                    text-right
                    font-mono
                    ${
                      gapSales >= 0
                        ? "text-signal-ok"
                        : "text-signal-crit"
                    }
                  `}>
                    {gapSales > 0 ? "+" : ""}
                    {fmt(gapSales)}
                  </td>

                  <td className="px-4 py-3">

                    <span className={`
                      inline-flex
                      items-center
                      gap-2
                      text-xs
                      ${status.text}
                    `}>

                      <span className={`
                        w-2 h-2
                        rounded-full
                        ${status.dot}
                      `} />

                      {status.label}

                    </span>

                  </td>

                </tr>
              );

            })}

          </tbody>

        </table>

      </div>

    </section>
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
  if (
    plan > 0 &&
    actual >= plan
  ) {
    return {
      label: "Target tercapai",
      text: "text-signal-ok",
      dot: "bg-signal-ok",
    };
  }

  if (actual >= sales) {
    return {
      label: "Di bawah plan",
      text: "text-signal-warn",
      dot: "bg-signal-warn",
    };
  }

  return {
    label: "Di bawah sales",
    text: "text-signal-crit",
    dot: "bg-signal-crit",
  };
}


/* ============================================================
   DATE
============================================================ */

function formatMonth(month) {
  if (!month) return "-";

  const [year, monthNumber] =
    month.split("-");

  return new Date(
    Number(year),
    Number(monthNumber) - 1,
    1
  ).toLocaleDateString(
    "id-ID",
    {
      month: "long",
      year: "numeric",
    }
  );
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


/* ============================================================
   NUMBER
============================================================ */

function fmt(value) {
  return Math.round(
    Number(value) || 0
  ).toLocaleString("id-ID");
}


/* ============================================================
   INPUT STYLE
============================================================ */

const inputStyle = `
  w-full
  bg-base-panelAlt
  border border-base-border
  rounded
  px-3 py-2
  text-sm
  focus:outline-none
  focus:ring-2
  focus:ring-signal-plan/60
`;
