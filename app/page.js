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
    const refreshData = () => {
      const nextLines = getLines();
      const nextRecords = getRecords();

      setLines(nextLines);
      setRecords(nextRecords);

      // Pilih line pertama secara otomatis
      setSelectedLineId((current) => {
        if (current) return current;
        return nextLines.length > 0 ? nextLines[0].id : "";
      });

      // Pilih bulan terbaru secara otomatis
      setSelectedMonth((current) => {
        if (current) return current;

        if (nextRecords.length === 0) {
          return new Date().toISOString().slice(0, 7);
        }

        const sorted = [...nextRecords].sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        const latestRecord = sorted[sorted.length - 1];

        return latestRecord?.date
          ? latestRecord.date.slice(0, 7)
          : new Date().toISOString().slice(0, 7);
      });

      setNow(new Date());
    };

    refreshData();

    // Refresh setiap 30 detik
    const timer = setInterval(() => {
      refreshData();
    }, 30000);

    // Jam tetap update setiap detik
    const clockTimer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(clockTimer);
    };
  }, []);

  // =========================================================
  // AVAILABLE MONTHS
  // =========================================================

  const availableMonths = useMemo(() => {
    const months = new Set();

    records.forEach((record) => {
      if (record.date) {
        months.add(record.date.slice(0, 7));
      }
    });

    // Pastikan bulan sekarang tetap tersedia
    months.add(new Date().toISOString().slice(0, 7));

    return [...months].sort().reverse();
  }, [records]);

  // =========================================================
  // SELECTED LINE
  // =========================================================

  const selectedLine = useMemo(() => {
    return (
      lines.find((line) => line.id === selectedLineId) ||
      lines[0] ||
      null
    );
  }, [lines, selectedLineId]);

  // =========================================================
  // RECORDS FOR SELECTED LINE + MONTH
  // =========================================================

  const lineRecords = useMemo(() => {
    if (!selectedLine) return [];

    return records
      .filter((record) => {
        const sameLine =
          record.lineId === selectedLine.id;

        const sameMonth =
          !selectedMonth ||
          record.date?.startsWith(selectedMonth);

        return sameLine && sameMonth;
      })
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
  //
  // PLAN SEKARANG DIAMBIL DARI MASTER PLAN BULANAN
  // BERDASARKAN TANGGAL.
  // =========================================================

  const chartData = useMemo(() => {
    if (!selectedLine) return [];

    return lineRecords.map((record) => {
      const plan =
        Number(
          getPlanForDate(
            selectedLine.id,
            record.date
          )
        ) || 0;

      return {
        date: record.date,

        actual:
          actualProduction(record),

        sales:
          Number(record.actualSales) || 0,

        plan,

        planOT:
          Number(record.planOT) || 0,

        actualOT:
          Number(record.actualOT) || 0,
      };
    });
  }, [
    lineRecords,
    selectedLine,
  ]);

  // =========================================================
  // DAILY PLAN
  //
  // Mengambil plan dari hari kerja pertama
  // yang mempunyai plan pada bulan tersebut.
  // =========================================================

  const dailyPlan = useMemo(() => {
    const itemWithPlan = chartData.find(
      (item) => Number(item.plan) > 0
    );

    return itemWithPlan
      ? Number(itemWithPlan.plan)
      : 0;
  }, [chartData]);

  // =========================================================
  // CURRENT DAY PLAN
  //
  // Plan untuk record terakhir.
  // Digunakan oleh KPI.
  // =========================================================

  const latestRecord = useMemo(() => {
    if (!lineRecords.length) return null;

    return lineRecords[lineRecords.length - 1];
  }, [lineRecords]);

  const latestData = useMemo(() => {
    if (!latestRecord) {
      return {
        plan: 0,
        actual: 0,
        sales: 0,
        actualOT: 0,
        planOT: 0,
      };
    }

    const plan =
      Number(
        getPlanForDate(
          latestRecord.lineId,
          latestRecord.date
        )
      ) || 0;

    return {
      plan,

      actual:
        actualProduction(latestRecord),

      sales:
        Number(latestRecord.actualSales) || 0,

      actualOT:
        Number(latestRecord.actualOT) || 0,

      planOT:
        Number(latestRecord.planOT) || 0,
    };
  }, [latestRecord]);

  // =========================================================
  // DAILY STATUS SUMMARY
  // =========================================================

  const summary = useMemo(() => {
    let green = 0;
    let orange = 0;
    let red = 0;

    chartData.forEach((item) => {
      const actual =
        Number(item.actual) || 0;

      const plan =
        Number(item.plan) || 0;

      const sales =
        Number(item.sales) || 0;

      // TARGET
      if (
        plan > 0 &&
        actual >= plan
      ) {
        green++;
        return;
      }

      // BELOW PLAN
      if (actual >= sales) {
        orange++;
        return;
      }

      // BELOW SALES
      red++;
    });

    return {
      green,
      orange,
      red,
      total: chartData.length,
    };
  }, [chartData]);

  // =========================================================
  // MONTHLY SUMMARY
  // =========================================================

  const monthlySummary = useMemo(() => {
    if (!chartData.length) {
      return {
        totalProduction: 0,
        totalSales: 0,
        totalPlan: 0,
        averageProduction: 0,
        averageSales: 0,
      };
    }

    const totalProduction =
      chartData.reduce(
        (sum, item) =>
          sum + Number(item.actual || 0),
        0
      );

    const totalSales =
      chartData.reduce(
        (sum, item) =>
          sum + Number(item.sales || 0),
        0
      );

    const totalPlan =
      chartData.reduce(
        (sum, item) =>
          sum + Number(item.plan || 0),
        0
      );

    return {
      totalProduction,
      totalSales,
      totalPlan,

      averageProduction:
        totalProduction /
        chartData.length,

      averageSales:
        totalSales /
        chartData.length,
    };
  }, [chartData]);

  // =========================================================
  // EMPTY LINE
  // =========================================================

  if (lines.length === 0) {
    return <EmptyState />;
  }

  return (
    <main className="max-w-[1600px] mx-auto px-5 py-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

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
              Monitoring pencapaian produksi terhadap daily plan
              dan kebutuhan actual sales.
            </p>

          </div>

          {/* RIGHT HEADER */}

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">

            <Link
              href="/tv"
              className="
                flex items-center gap-2
                px-3 py-1.5
                rounded
                border border-signal-plan
                text-signal-plan
                font-bold
                hover:bg-signal-plan/10
                transition
              "
            >
              <span>▣</span>
              TV MODE
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
          FILTER BAR
      ====================================================== */}

      <section className="bg-base-panel border border-base-border rounded-lg p-4 mb-5">

        <div className="flex flex-wrap items-end gap-4">

          {/* LINE */}

          <label className="block min-w-[220px]">

            <span className="block text-xs text-ink-muted mb-1">
              Line
            </span>

            <select
              value={selectedLine?.id || ""}
              onChange={(event) =>
                setSelectedLineId(
                  event.target.value
                )
              }
              className="
                w-full
                bg-base-panelAlt
                border border-base-border
                rounded
                px-3 py-2
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-signal-plan/60
              "
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


          {/* MONTH */}

          <label className="block min-w-[190px]">

            <span className="block text-xs text-ink-muted mb-1">
              Periode
            </span>

            <select
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(
                  event.target.value
                )
              }
              className="
                w-full
                bg-base-panelAlt
                border border-base-border
                rounded
                px-3 py-2
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-signal-plan/60
              "
            >

              {availableMonths.map((month) => (

                <option
                  key={month}
                  value={month}
                >
                  {formatMonth(month)}
                </option>

              ))}

            </select>

          </label>


          {/* DAILY PLAN */}

          <Metric
            label="Daily Plan"
            value={`${fmt(dailyPlan)} PCS`}
          />


          {/* MONTHLY PLAN */}

          <Metric
            label="Total Plan"
            value={`${fmt(
              monthlySummary.totalPlan
            )} PCS`}
          />


          {/* DAYS */}

          <Metric
            label="Hari Data"
            value={`${chartData.length} hari`}
          />

        </div>

      </section>


      {/* =====================================================
          NO DATA
      ====================================================== */}

      {chartData.length === 0 ? (

        <section className="
          border
          border-dashed
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

            {" "}pada periode{" "}

            <strong>
              {formatMonth(selectedMonth)}
            </strong>.

          </p>

          <p className="text-xs text-ink-faint mt-2">
            Masukkan data melalui menu Input Harian terlebih dahulu.
          </p>

        </section>

      ) : (

        <div className="space-y-5">

          {/* =================================================
              CURRENT LINE KPI
          ================================================== */}

          <LineKpiCards

            production={
              latestData.actual
            }

            plan={
              latestData.plan
            }

            sales={
              latestData.sales
            }

            otActual={
              latestData.actualOT
            }

            otPlan={
              latestData.planOT
            }

          />


          {/* =================================================
              CHART GRID
          ================================================== */}

          <section className="
            grid
            grid-cols-1
            xl:grid-cols-2
            gap-4
          ">

            {/* PRODUCTION VS PLAN */}

            <div className="
              bg-base-panel
              border border-base-border
              rounded-lg
              p-4
              min-w-0
            ">

              <ProductionPlanChart
                data={chartData}
                plan={dailyPlan}
              />

            </div>


            {/* SALES VS PRODUCTION PLAN */}

            <div className="
              bg-base-panel
              border border-base-border
              rounded-lg
              p-4
              min-w-0
            ">

              <SalesPlanChart
                data={chartData}
                plan={dailyPlan}
              />

            </div>

          </section>


          {/* =================================================
              OVERTIME ANALYSIS
          ================================================== */}

          <OvertimeAnalysis
            data={chartData}
          />


          {/* =================================================
              STATUS TABLE
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
   SUMMARY PILL
============================================================ */

function SummaryPill({
  color,
  label,
  value,
}) {
  return (
    <div className="
      flex
      items-center
      gap-2
      bg-base-panel
      border border-base-border
      rounded
      px-3
      py-1.5
    ">

      <span
        className={`
          w-2.5
          h-2.5
          rounded-full
          ${color}
        `}
      />

      <span className="text-ink-muted">
        {label}
      </span>

      <span className="
        text-ink-primary
        font-semibold
        tabular
      ">
        {value}
      </span>

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
        tracking-wide
      ">
        {label}
      </p>

      <p className="
        font-mono
        font-semibold
        text-ink-primary
        mt-0.5
      ">
        {value}
      </p>

    </div>
  );
}


/* ============================================================
   DAILY STATUS TABLE
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
        px-4
        py-3
        border-b
        border-base-border
      ">

        <h2 className="
          font-display
          font-bold
          text-lg
        ">
          Status Harian
        </h2>

        <p className="
          text-xs
          text-ink-muted
          mt-0.5
        ">
          Warna menunjukkan hubungan actual production,
          daily plan, dan actual sales.
        </p>

      </div>


      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="
            bg-base-panelAlt
            text-ink-muted
            text-xs
            uppercase
            tracking-wide
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

              const actual =
                Number(item.actual) || 0;

              const plan =
                Number(item.plan) || 0;

              const sales =
                Number(item.sales) || 0;

              const gapPlan =
                actual - plan;

              const gapSales =
                actual - sales;

              const status =
                getProductionStatus(
                  actual,
                  plan,
                  sales
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

                  <td className="
                    px-4
                    py-3
                    font-mono
                  ">
                    {formatDateLong(
                      item.date
                    )}
                  </td>


                  <td className="
                    px-4
                    py-3
                    text-right
                    font-mono
                  ">
                    {fmt(plan)}
                  </td>


                  <td className="
                    px-4
                    py-3
                    text-right
                    font-mono
                    font-semibold
                  ">
                    {fmt(actual)}
                  </td>


                  <td className="
                    px-4
                    py-3
                    text-right
                    font-mono
                  ">
                    {fmt(sales)}
                  </td>


                  <td
                    className={`
                      px-4
                      py-3
                      text-right
                      font-mono
                      ${
                        gapPlan >= 0
                          ? "text-signal-ok"
                          : "text-signal-warn"
                      }
                    `}
                  >

                    {gapPlan > 0
                      ? "+"
                      : ""}

                    {fmt(gapPlan)}

                  </td>


                  <td
                    className={`
                      px-4
                      py-3
                      text-right
                      font-mono
                      ${
                        gapSales >= 0
                          ? "text-signal-ok"
                          : "text-signal-crit"
                      }
                    `}
                  >

                    {gapSales > 0
                      ? "+"
                      : ""}

                    {fmt(gapSales)}

                  </td>


                  <td className="px-4 py-3">

                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-2
                        text-xs
                        font-medium
                        ${status.text}
                      `}
                    >

                      <span
                        className={`
                          w-2
                          h-2
                          rounded-full
                          ${status.dot}
                        `}
                      />

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
   PRODUCTION STATUS
============================================================ */

function getProductionStatus(
  actual,
  plan,
  sales
) {

  // TARGET
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

  // BELOW PLAN
  if (actual >= sales) {
    return {
      label: "Di bawah plan",
      text: "text-signal-warn",
      dot: "bg-signal-warn",
    };
  }

  // BELOW SALES
  return {
    label: "Di bawah sales",
    text: "text-signal-crit",
    dot: "bg-signal-crit",
  };
}


/* ============================================================
   DATE FORMAT
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
   NUMBER FORMAT
============================================================ */

function fmt(value) {
  return Math.round(
    Number(value) || 0
  ).toLocaleString("id-ID");
}


/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState() {
  return (
    <main className="
      max-w-[1600px]
      mx-auto
      px-5
      py-16
    ">

      <div className="
        border
        border-dashed
        border-base-border
        rounded-lg
        py-16
        text-center
      ">

        <p className="
          text-ink-muted
          mb-3
        ">
          Belum ada line yang terdaftar.
        </p>

        <Link
          href="/lines"
          className="
            text-signal-plan
            font-medium
            hover:underline
          "
        >
          Tambah line pertama →
        </Link>

      </div>

    </main>
  );
}
