"use client";

import Link from "next/link";
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

    // Refresh data setiap 30 detik
    const dataTimer = setInterval(() => {
      refreshData();
    }, 30000);

    // Update jam setiap 1 detik
    const clockTimer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(dataTimer);
      clearInterval(clockTimer);
    };
  }, []);

  // =========================================================
  // DATA 10 LINE
  // =========================================================

  const lineData = useMemo(() => {
    return lines.slice(0, 10).map((line) => {
      const lineRecords = records
        .filter((record) => record.lineId === line.id)
        .sort((a, b) =>
          a.date.localeCompare(b.date)
        );

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
    let noData = 0;

    lineData.forEach((item) => {
      const actual = Number(item.production) || 0;
      const plan = Number(item.plan) || 0;
      const sales = Number(item.sales) || 0;

      if (!item.hasData) {
        noData++;
        return;
      }

      // TARGET
      if (plan > 0 && actual >= plan) {
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
      noData,
      total: lineData.length,
    };
  }, [lineData]);
  

  // =========================================================
  // EMPTY STATE
  // =========================================================

  if (lines.length === 0) {
    return (
      <main className="fixed inset-0 bg-base-bg flex items-center justify-center">

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
    <main
      className="
        fixed
        inset-0
        z-[9999]
        bg-base-bg
        overflow-hidden
        px-5
        py-4
      "
    >

      {/* =====================================================
          TV HEADER
      ====================================================== */}

      <header
        className="
          flex
          items-center
          justify-between
          gap-6
          pb-3
          border-b
          border-base-border
        "
      >

        {/* TITLE */}

        <div className="min-w-0">

          <div className="flex items-center gap-3">

            <h1
              className="
                font-display
                font-bold
                text-2xl
                xl:text-3xl
                tracking-tight
              "
           > 
             
             <div className="flex items-center gap-3">
        
          <Link
            href="/"
            className="
              flex items-center justify-center
              w-8 h-8
              rounded
              border border-base-border
              text-ink-muted
              hover:text-ink-primary
              hover:border-signal-plan
              transition
            "
            title="Kembali ke Dashboard"
          >
          </Link>
        
          <div>
        <h1 className="font-display font-bold text-2xl tracking-tight">
          PAPAN PRODUKSI{" "}
          <span className="text-signal-plan font-display font-bold">
            TV
          </span>
        </h1>
      
        <p className="text-xs text-ink-muted mt-1">
          Monitoring realtime seluruh line produksi
        </p>
      </div>

        {/* RIGHT HEADER */}

        <div className="flex items-center gap-6 shrink-0">

          {/* SUMMARY */}
         
          <div
            className="
              flex
              items-center
              gap-4
              font-mono
              text-xs
              xl:text-sm
            "
          />

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
           <StatusSummary
              color="bg-base-border"
              value={summary.noData}
              label="NO DATA"
            />

          </div>
       </div>
 </h>

          {/* CLOCK */}

          <div className="text-right">

            <p
              className="
                font-mono
                font-bold
                text-xl
                xl:text-2xl
                text-ink-primary
                leading-none
              "
            >
              {now
                ? now.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "--:--:--"}
            </p>

            <p
              className="
                text-[10px]
                xl:text-xs
                text-ink-muted
                font-mono
                mt-1
              "
            >
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
          grid-cols-5
          grid-rows-2
          gap-3
          mt-3
          items-start
        "
      >

        {lineData.map((item) => (

          <LineStatusCard
            key={item.line.id}
            line={item.line}
            production={item.production}
            plan={item.plan}
            sales={item.sales}
            hasData={item.hasData}
          />

        ))}

      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer
        className="
          flex
          items-center
          justify-between
          mt-3
          pt-2
          border-t
          border-base-border
        "
      >

        <p
          className="
            text-[9px]
            xl:text-[10px]
            text-ink-faint
            font-mono
          "
        >
          {summary.total} LINE AKTIF
        </p>

        <p
          className="
            text-[9px]
            xl:text-[10px]
            text-ink-faint
            font-mono
          "
        >
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
        className={`
          w-2
          h-2
          xl:w-2.5
          xl:h-2.5
          rounded-full
          ${color}
        `}
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
