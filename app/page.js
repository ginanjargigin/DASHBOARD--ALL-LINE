"use client";
import { useEffect, useMemo, useState } from "react";
import { getLines, getRecords } from "@/lib/storage";
import { lineStatus } from "@/lib/calc";
import LineCard from "@/components/LineCard";
import Link from "next/link";

export default function DashboardPage() {
  const [lines, setLines] = useState([]);
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(null);

  useEffect(() => {
    setLines(getLines());
    setRecords(getRecords());
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(
    () => lines.filter((l) => l.name.toLowerCase().includes(query.toLowerCase())),
    [lines, query]
  );

  const counts = useMemo(() => {
    const c = { crit: 0, warn: 0, ok: 0, nodata: 0 };
    lines.forEach((l) => {
      const st = lineStatus(records.filter((r) => r.lineId === l.id));
      c[st.level]++;
    });
    return c;
  }, [lines, records]);

  return (
    <div className="max-w-[1600px] mx-auto px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-ink-muted text-sm font-mono">
            {now ? now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "\u00A0"}
          </p>
          <h1 className="font-display font-bold text-3xl mt-1">Status Line — Realtime</h1>
        </div>
        <div className="flex gap-3 font-mono text-sm">
          <Pill color="bg-signal-crit" label="Kritis" value={counts.crit} />
          <Pill color="bg-signal-warn" label="Perlu evaluasi" value={counts.warn} />
          <Pill color="bg-signal-ok" label="Aman" value={counts.ok} />
        </div>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari line..."
        className="mb-5 w-full max-w-xs bg-base-panel border border-base-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-plan/60"
      />

      {lines.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((line) => (
            <LineCard
              key={line.id}
              line={line}
              records={records.filter((r) => r.lineId === line.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({ color, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-base-panel border border-base-border rounded px-3 py-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink-primary font-semibold tabular">{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-base-border rounded-lg py-16 text-center">
      <p className="text-ink-muted mb-3">Belum ada line yang terdaftar.</p>
      <Link href="/lines" className="text-signal-plan font-medium hover:underline">
        Tambah line pertama →
      </Link>
    </div>
  );
}
