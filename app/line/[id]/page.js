"use client";
import { useEffect, useMemo, useState } from "react";
import { getLines, recordsForLine, deleteRecord } from "@/lib/storage";
import {
  actualProduction,
  otGap,
  prodGapPct,
  lineStatus,
  statusColor,
  weekendOtRecommendation,
} from "@/lib/calc";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function LineDetailPage() {
  const { id } = useParams();
  const [line, setLine] = useState(null);
  const [records, setRecords] = useState([]);

  const refresh = () => {
    const l = getLines().find((x) => x.id === id);
    setLine(l || null);
    setRecords(recordsForLine(id));
  };
  useEffect(refresh, [id]);

  const status = useMemo(() => lineStatus(records), [records]);
  const colors = statusColor(status.level);
  const recent = useMemo(() => records.slice(-14), [records]);
  const maxProd = useMemo(
    () => Math.max(1, ...recent.map((r) => Math.max(actualProduction(r), r.planProduction))),
    [recent]
  );
  const maxOt = useMemo(
    () => Math.max(1, ...recent.map((r) => Math.max(r.actualOT, r.planOT))),
    [recent]
  );

  if (!line) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <p className="text-ink-muted">Line tidak ditemukan.</p>
        <Link href="/" className="text-signal-plan hover:underline">Kembali ke papan</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-bold text-3xl">{line.name}</h1>
        <span className={`text-xs font-mono uppercase px-2 py-1 rounded ${colors.dim} ${colors.text}`}>
          {status.level === "nodata" ? "no data" : status.level}
        </span>
      </div>
      <p className="text-ink-muted text-sm mb-1">{status.reason}</p>
      <p className={`text-sm font-medium mb-6 ${colors.text}`}>{weekendOtRecommendation(status)}</p>

      <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-ink-muted mb-2">
        Tren Produksi — 14 Hari Terakhir (batang = aktual, garis = plan)
      </h2>
      <TrendChart data={recent} max={maxProd} getValue={(r) => actualProduction(r)} getPlan={(r) => r.planProduction} />

      <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-ink-muted mt-8 mb-2">
        Tren Overtime — 14 Hari Terakhir (jam)
      </h2>
      <TrendChart data={recent} max={maxOt} getValue={(r) => r.actualOT} getPlan={(r) => r.planOT} unit=" jam" />

      <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-ink-muted mt-8 mb-2">
        Riwayat Harian
      </h2>
      <div className="overflow-x-auto rounded border border-base-border">
        <table className="w-full text-sm font-mono">
          <thead className="bg-base-panelAlt text-ink-muted text-xs uppercase">
            <tr>
              <Th>Tanggal</Th>
              <Th>Plan Prod</Th>
              <Th>Aktual Prod</Th>
              <Th>Gap Prod</Th>
              <Th>Plan OT</Th>
              <Th>Aktual OT</Th>
              <Th>Gap OT</Th>
              <Th>Sales</Th>
              <Th className="font-body text-left">Catatan</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {[...records].reverse().map((r) => {
              const gapPct = prodGapPct(r);
              const gO = otGap(r);
              return (
                <tr key={r.id} className="border-t border-base-border hover:bg-base-panel/60">
                  <Td>{r.date}</Td>
                  <Td>{r.planProduction}</Td>
                  <Td>{actualProduction(r)}</Td>
                  <Td className={gapPct < 0 ? "text-signal-crit" : "text-signal-ok"}>
                    {gapPct.toFixed(0)}%
                  </Td>
                  <Td>{r.planOT}</Td>
                  <Td>{r.actualOT}</Td>
                  <Td className={gO > 0 ? "text-signal-crit" : "text-signal-ok"}>
                    {gO > 0 ? "+" : ""}{gO.toFixed(1)}
                  </Td>
                  <Td>{r.actualSales}</Td>
                  <Td className="font-body text-left text-ink-muted">{r.note}</Td>
                  <Td>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus data ${r.date}?`)) {
                          deleteRecord(r.id);
                          refresh();
                        }
                      }}
                      className="text-ink-faint hover:text-signal-crit text-xs"
                    >
                      hapus
                    </button>
                  </Td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-ink-faint font-body">
                  Belum ada data untuk line ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendChart({ data, max, getValue, getPlan, unit = "" }) {
  if (data.length === 0) {
    return <p className="text-ink-faint text-sm">Belum ada data.</p>;
  }
  return (
    <div className="flex items-end gap-1.5 h-32 bg-base-panel border border-base-border rounded p-3">
      {data.map((r, i) => {
        const val = getValue(r);
        const plan = getPlan(r);
        const over = val > plan;
        return (
          <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">
            <div
              className="w-full absolute border-t border-dashed border-ink-primary/50"
              style={{ bottom: `${(plan / max) * 100}%` }}
            />
            <div
              className={`w-full rounded-t-sm ${over ? "bg-signal-crit" : "bg-signal-plan"}`}
              style={{ height: `${Math.max(2, (val / max) * 100)}%` }}
              title={`${r.date}: ${val}${unit} (plan ${plan}${unit})`}
            />
            <span className="text-[9px] text-ink-faint mt-1 rotate-0 font-mono">
              {r.date.slice(8, 10)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-3 py-2 text-center ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-3 py-1.5 text-center tabular ${className}`}>{children}</td>;
}
