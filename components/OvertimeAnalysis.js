"use client";

import { useMemo } from "react";

export default function OvertimeAnalysis({
  records = [],
}) {
  const data = useMemo(() => {
    return records
      .map((record) => {
        const planOT = Number(record.planOT) || 0;
        const actualOT = Number(record.actualOT) || 0;
        const production =
          Number(record.actualProduction) || 0;
        const plan =
          Number(record.planProduction) || 0;

        const otGap = actualOT - planOT;

        let status = "ok";

        if (actualOT > planOT) {
          status = "warn";
        }

        if (
          actualOT > planOT &&
          production < plan
        ) {
          status = "crit";
        }

        return {
          ...record,
          planOT,
          actualOT,
          production,
          plan,
          otGap,
          status,
        };
      })
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      );
  }, [records]);

  const summary = useMemo(() => {
    let plan = 0;
    let actual = 0;
    let daysOT = 0;
    let daysHighOT = 0;

    data.forEach((item) => {
      plan += item.planOT;
      actual += item.actualOT;

      if (item.actualOT > 0) {
        daysOT++;
      }

      if (item.actualOT > item.planOT) {
        daysHighOT++;
      }
    });

    return {
      plan,
      actual,
      gap: actual - plan,
      daysOT,
      daysHighOT,
    };
  }, [data]);

  return (
    <section className="panel">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-4 mb-5">

        <div>
          <h2 className="font-display font-bold text-lg">
            Overtime Analysis
          </h2>

          <p className="text-xs text-ink-muted mt-1">
            Perbandingan plan overtime dan actual overtime.
          </p>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono">

          <Legend
            color="bg-signal-ok"
            label="OT sesuai plan"
          />

          <Legend
            color="bg-signal-warn"
            label="OT > plan"
          />

          <Legend
            color="bg-signal-crit"
            label="OT tinggi + produksi kurang"
          />

        </div>

      </div>


      {/* SUMMARY */}

      <div className="grid grid-cols-4 gap-3 mb-5">

        <SummaryCard
          label="PLAN OT"
          value={summary.plan}
          suffix="JAM"
        />

        <SummaryCard
          label="ACTUAL OT"
          value={summary.actual}
          suffix="JAM"
        />

        <SummaryCard
          label="GAP OT"
          value={summary.gap}
          suffix="JAM"
          status={
            summary.gap > 0
              ? "warn"
              : "ok"
          }
        />

        <SummaryCard
          label="HARI OT"
          value={summary.daysOT}
          suffix="HARI"
        />

      </div>


      {/* EMPTY */}

      {data.length === 0 ? (

        <div className="py-10 text-center text-xs text-ink-faint">
          Belum ada data overtime.
        </div>

      ) : (

        <div className="space-y-3">

          {data.map((item) => (

            <OTRow
              key={`${item.lineId}-${item.date}`}
              item={item}
            />

          ))}

        </div>

      )}

    </section>
  );
}


/* ============================================================
   OT ROW
============================================================ */

function OTRow({ item }) {

  const percent =
    item.planOT > 0
      ? Math.min(
          (item.actualOT / item.planOT) * 100,
          100
        )
      : item.actualOT > 0
        ? 100
        : 0;

  let color = "var(--signal-ok)";

  if (item.status === "warn") {
    color = "var(--signal-warn)";
  }

  if (item.status === "crit") {
    color = "var(--signal-crit)";
  }

  return (
    <div
      className="
        border
        border-base-border
        rounded-lg
        p-3
        bg-base-panelAlt
      "
    >

      {/* TOP */}

      <div className="flex items-center justify-between gap-3">

        <div className="min-w-0">

          <p className="font-display font-semibold text-sm truncate">
            {formatDate(item.date)}
          </p>

          <p className="text-[10px] text-ink-faint font-mono mt-0.5">
            {item.note || "Tidak ada catatan"}
          </p>

        </div>


        <Status
          status={item.status}
        />

      </div>


      {/* OT VALUES */}

      <div className="grid grid-cols-3 gap-4 mt-3">

        <Metric
          label="PLAN OT"
          value={item.planOT}
        />

        <Metric
          label="ACTUAL OT"
          value={item.actualOT}
        />

        <Metric
          label="GAP"
          value={item.otGap}
          color={
            item.otGap > 0
              ? "text-signal-warn"
              : "text-signal-ok"
          }
        />

      </div>


      {/* PRODUCTION */}

      <div className="mt-3">

        <div className="flex justify-between text-[9px] font-mono">

          <span className="text-ink-muted">
            Produksi
          </span>

          <span className="text-ink-primary">
            {fmt(item.production)} / {fmt(item.plan)} PCS
          </span>

        </div>


        <div className="h-1.5 bg-base-border rounded-full overflow-hidden mt-1">

          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${percent}%`,
              backgroundColor: color,
            }}
          />

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  label,
  value,
  suffix,
  status,
}) {

  let color = "text-ink-primary";

  if (status === "warn") {
    color = "text-signal-warn";
  }

  if (status === "ok") {
    color = "text-signal-ok";
  }

  return (
    <div className="border border-base-border rounded-lg p-3 bg-base-panelAlt">

      <p className="text-[9px] text-ink-muted uppercase">
        {label}
      </p>

      <p
        className={`
          font-mono
          font-bold
          text-xl
          mt-1
          ${color}
        `}
      >
        {fmt(value)}

        <span className="text-[9px] ml-1 text-ink-faint">
          {suffix}
        </span>

      </p>

    </div>
  );
}


/* ============================================================
   METRIC
============================================================ */

function Metric({
  label,
  value,
  color = "text-ink-primary",
}) {

  return (
    <div>

      <p className="text-[9px] text-ink-muted uppercase">
        {label}
      </p>

      <p
        className={`
          font-mono
          font-bold
          text-sm
          mt-0.5
          ${color}
        `}
      >
        {value > 0 ? "+" : ""}
        {fmt(value)}

        <span className="text-[8px] text-ink-faint ml-1">
          JAM
        </span>

      </p>

    </div>
  );
}


/* ============================================================
   STATUS
============================================================ */

function Status({ status }) {

  if (status === "crit") {
    return (
      <span className="text-[9px] font-mono font-bold text-signal-crit">
        ● OT TINGGI
      </span>
    );
  }

  if (status === "warn") {
    return (
      <span className="text-[9px] font-mono font-bold text-signal-warn">
        ● OT DI ATAS PLAN
      </span>
    );
  }

  return (
    <span className="text-[9px] font-mono font-bold text-signal-ok">
      ● OT SESUAI PLAN
    </span>
  );
}


/* ============================================================
   LEGEND
============================================================ */

function Legend({
  color,
  label,
}) {

  return (
    <div className="flex items-center gap-1.5">

      <span
        className={`
          w-2
          h-2
          rounded-sm
          ${color}
        `}
      />

      <span className="text-ink-muted">
        {label}
      </span>

    </div>
  );
}


/* ============================================================
   DATE
============================================================ */

function formatDate(date) {

  if (!date) return "-";

  const d = new Date(
    `${date}T00:00:00`
  );

  return d.toLocaleDateString(
    "id-ID",
    {
      weekday: "short",
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
