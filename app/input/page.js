"use client";
import { useEffect, useMemo, useState } from "react";
import { getLines, getRecords, upsertRecord } from "@/lib/storage";
import { actualProduction } from "@/lib/calc";
import Link from "next/link";

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  planProduction: "",
  actualSales: "",
  normalMerah: "",
  otMerah: "",
  normalPutih: "",
  otPutih: "",
  planOT: "",
  actualOT: "",
  planDelivery: "",
  actualDelivery: "",
  note: "",
};

export default function InputPage() {
  const [lines, setLines] = useState([]);
  const [lineId, setLineId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const l = getLines();
    setLines(l);
    if (l.length > 0) setLineId(l[0].id);
  }, []);

  useEffect(() => {
    if (!lineId || !date) return;
    const existing = getRecords().find((r) => r.lineId === lineId && r.date === date);
    setForm(
      existing
        ? {
            planProduction: existing.planProduction,
            actualSales: existing.actualSales,
            normalMerah: existing.normalMerah,
            otMerah: existing.otMerah,
            normalPutih: existing.normalPutih,
            otPutih: existing.otPutih,
            planOT: existing.planOT,
            actualOT: existing.actualOT,
            planDelivery: existing.planDelivery,
            actualDelivery: existing.actualDelivery,
            note: existing.note,
          }
        : emptyForm
    );
    setSaved(false);
  }, [lineId, date]);

  const totalProd = useMemo(() => actualProduction(numForm(form)), [form]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    upsertRecord({ lineId, date, ...form });
    setSaved(true);
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center">
        <p className="text-ink-muted mb-3">Belum ada line. Tambahkan line dulu.</p>
        <Link href="/lines" className="text-signal-plan font-medium hover:underline">
          Kelola Line →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <h1 className="font-display font-bold text-2xl mb-1">Input Data Harian</h1>
      <p className="text-ink-muted text-sm mb-6">
        Isi ulang tanggal yang sama akan menimpa data sebelumnya (bukan duplikat).
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Field label="Line">
          <select
            value={lineId}
            onChange={(e) => setLineId(e.target.value)}
            className="input"
          >
            {lines.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </Field>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Target vs Sales">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan Produksi (pcs)">
              <NumInput value={form.planProduction} onChange={(v) => update("planProduction", v)} />
            </Field>
            <Field label="Actual Sales (pcs)">
              <NumInput value={form.actualSales} onChange={(v) => update("actualSales", v)} />
            </Field>
          </div>
        </Section>

        <Section title="Produksi Aktual per Shift">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Normal Shift Merah (pcs)">
              <NumInput value={form.normalMerah} onChange={(v) => update("normalMerah", v)} />
            </Field>
            <Field label="OT Shift Merah (pcs)">
              <NumInput value={form.otMerah} onChange={(v) => update("otMerah", v)} />
            </Field>
            <Field label="Normal Shift Putih (pcs)">
              <NumInput value={form.normalPutih} onChange={(v) => update("normalPutih", v)} />
            </Field>
            <Field label="OT Shift Putih (pcs)">
              <NumInput value={form.otPutih} onChange={(v) => update("otPutih", v)} />
            </Field>
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            Total produksi aktual: <span className="font-mono text-ink-primary">{totalProd.toLocaleString("id-ID")} pcs</span>
          </p>
        </Section>

        <Section title="Overtime (jam)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan OT (jam)">
              <NumInput step="0.5" value={form.planOT} onChange={(v) => update("planOT", v)} />
            </Field>
            <Field label="Actual OT (jam)">
              <NumInput step="0.5" value={form.actualOT} onChange={(v) => update("actualOT", v)} />
            </Field>
          </div>
        </Section>

        <Section title="Delivery">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan Delivery (pcs)">
              <NumInput value={form.planDelivery} onChange={(v) => update("planDelivery", v)} />
            </Field>
            <Field label="Actual Delivery (pcs)">
              <NumInput value={form.actualDelivery} onChange={(v) => update("actualDelivery", v)} />
            </Field>
          </div>
        </Section>

        <Field label="Catatan (mis. kendala mesin, NG, dll)">
          <textarea
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            rows={2}
            className="input resize-none"
          />
        </Field>

        <button
          type="submit"
          className="w-full py-2.5 rounded bg-signal-plan text-base-bg font-semibold text-sm hover:brightness-110"
        >
          Simpan Data
        </button>
        {saved && (
          <p className="text-signal-ok text-sm text-center">Tersimpan.</p>
        )}
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          background: #1b232c;
          border: 1px solid #29323c;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 14px;
          color: #e7ecf2;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(76, 141, 255, 0.5);
        }
      `}</style>
    </div>
  );
}

function numForm(form) {
  const out = {};
  Object.entries(form).forEach(([k, v]) => (out[k] = Number(v) || 0));
  return out;
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-ink-muted mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

function NumInput({ value, onChange, step = "1" }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input font-mono"
    />
  );
}
