"use client";

import { useEffect, useMemo, useState } from "react";
import { getLines, getRecords } from "@/lib/storage";
import { actualProduction } from "@/lib/calc";
import LineStatusCard from "@/components/LineStatusCard";

export default function TVPage() {
  const [lines, setLines] = useState([]);
  const [records, setRecords] = useState([]);
  const [now, setNow] = useState(null);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    const refreshData = () => {
      setLines(getLines());
      setRecords(getRecords());
      setNow(new Date());
    };

    refreshData();

    // Refresh setiap 30 detik
    const timer = setInterval(refreshData, 30000);

    return () => clearInterval(timer);
  }, []);

  // =========================================================
  // DATA LINE
  // =========================================================

  const lineData = useMemo(() => {
    return lines.slice(0, 10).map((line) => {
      const lineRecords = records
        .filter((record) => record.lineId === line.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      const latestRecord =
        lineRecords[lineRecords.length - 1];

      if (!latestRecord) {
        return {
          line,
          production: 0,
          plan: 0,
          sales: 0,
          hasData: false,
        };
      }

      return {
        line,

        production:
          actualProduction(latestRecord),

        plan:
          Number(latestRecord.planProduction) || 0,

        sales:
          Number(latestRecord.actualSales) || 0,

        hasData: true,
      };
    });
  }, [lines, records]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const summary = useMemo(() => {
    let green = 0;
    let orange = 0;
    let red = 0;

    lineData.forEach((item) => {
      const actual = item.production;
      const plan = item.plan;
      const sales = item.sales;

      if (!item.hasData) {
        return;
      }

      if (plan > 0 && actual >= plan) {
        green++;
      } else if (actual >= sales) {
        orange++;
      } else {
        red++;
      }
    });

    return {
      green,
      orange,
      red,
      total: lineData.length,
    };
  }, [lineData]);

  // =========================================================
  // EMPTY STATE
  // =========================================================

  if (lines.length === 0) {
    return (
      <main className="min-h-screen bg-base-bg flex items-center justify-center">

        <div className="text-center">

          <h1 className="font-display font-bold text-2xl">
            Belum ada line
          </h1>

          <p className="text-ink-muted text-sm mt-2">
            Tambahkan line terlebih dahulu melalui menu
            Kelola Line.
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-bg px-5 py-4">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="flex items-center justify-between mb-4">

        {/* TITLE */}

        <div>

          <div className="flex items-center gap-3">

            <h1 className="font-display font-bold text-2xl tracking-tight">
              PAPAN PRODUKSI
            </h1>

            <span className="text-signal-plan font-display font-bold">
              TV
            </span>

          </div>

          <p className="text-xs text-ink-muted mt-1">
            Monitoring realtime seluruh line produksi
          </p>

        </div>


        {/* RIGHT SIDE */}

        <div className="flex items-center gap-5">

          {/* SUMMARY */}

          <div className="flex items-center gap-3 font-mono text-xs">

            <StatusSummary
              color="bg-signal-ok"
              value={summary.green}
              label="TARGET"
            />

            <StatusSummary
              color="bg-signal-warn"
              value={summary.orange}
              label="BELOW PLAN"
            />

            <StatusSummary
              color="bg-signal-crit"
              value={summary.red}
              label="BELOW SALES"
            />

          </div>


          {/* CLOCK */}

          <div className="text-right">

            <p className="font-mono font-bold text-lg text-ink-primary">
              {now
                ? now.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "--:--:--"}
            </p>

            <p className="text-[10px] text-ink-muted font-mono">
              {now
                ? now.toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : ""}
            </p>

          </div>

        </div>

      </header>


      {/* =====================================================
          LINE GRID
      ====================================================== */}

      <section
        className="
          grid
          grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          xl:grid-cols-5
          gap-3
        "
      >

        {lineData.map((item) => (

          <LineStatusCard
            key={item.line.id}
            line={item.line}
            production={item.production}
            plan={item.plan}
            sales={item.sales}
          />

        ))}

      </section>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="flex items-center justify-between mt-4 pt-3 border-t border-base-border">

        <p className="text-[10px] text-ink-faint font-mono">
          {summary.total} LINE AKTIF
        </p>

        <p className="text-[10px] text-ink-faint font-mono">
          AUTO REFRESH 30s
        </p>

      </footer>

    </main>
  );
}


/* ============================================================
   STATUS SUMMARY
============================================================ */

function StatusSummary({
  color,
  value,
  label,
}) {
  return (
    <div className="flex items-center gap-1.5">

      <span
        className={`w-2 h-2 rounded-full ${color}`}
      />

      <span className="text-ink-muted">
        {label}
      </span>

      <span className="font-bold text-ink-primary">
        {value}
      </span>

    </div>
  );
}
