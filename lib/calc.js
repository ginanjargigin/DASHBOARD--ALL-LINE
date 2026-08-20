// Semua ambang batas (threshold) di bawah ini bisa disesuaikan dengan
// kebiasaan/aturan pabrik. Ini titik awal yang masuk akal untuk deteksi
// masalah pada line.

export const THRESHOLDS = {
  // Selisih OT aktual vs OT standar (jam) dalam 7 hari terakhir, rata-rata per hari
  otGapWarnJam: 1,
  otGapCritJam: 2,
  // Selisih produksi aktual vs plan, dalam persen (negatif = kurang dari plan)
  prodGapWarnPct: -5,
  prodGapCritPct: -12,
};

export function actualProduction(r) {
  return (r.normalMerah || 0) + (r.otMerah || 0) + (r.normalPutih || 0) + (r.otPutih || 0);
}

export function otGap(r) {
  return (r.actualOT || 0) - (r.planOT || 0);
}

export function prodGapPct(r) {
  const plan = r.planProduction || 0;
  if (plan === 0) return 0;
  return ((actualProduction(r) - plan) / plan) * 100;
}

export function salesGapPct(r) {
  const sales = r.actualSales || 0;
  const prod = actualProduction(r);
  if (sales === 0) return 0;
  return ((prod - sales) / sales) * 100;
}

export function lastNDays(records, n = 7) {
  return records.slice(-n);
}

// Menghitung status andon (ok / warn / crit) untuk sebuah line berdasarkan
// rata-rata gap OT dan gap produksi dalam 7 hari data terakhir yang tersedia.
export function lineStatus(records) {
  const recent = lastNDays(records, 7);
  if (recent.length === 0) {
    return { level: "nodata", avgOtGap: 0, avgProdGapPct: 0, reason: "Belum ada data" };
  }

  const avgOtGap =
    recent.reduce((s, r) => s + otGap(r), 0) / recent.length;
  const avgProdGapPct =
    recent.reduce((s, r) => s + prodGapPct(r), 0) / recent.length;

  const otCrit = avgOtGap >= THRESHOLDS.otGapCritJam;
  const otWarn = avgOtGap >= THRESHOLDS.otGapWarnJam;
  const prodCrit = avgProdGapPct <= THRESHOLDS.prodGapCritPct;
  const prodWarn = avgProdGapPct <= THRESHOLDS.prodGapWarnPct;

  let level = "ok";
  const reasons = [];
  if (otCrit) reasons.push(`OT aktual rata-rata ${avgOtGap.toFixed(1)} jam di atas standar`);
  else if (otWarn) reasons.push(`OT aktual sedikit di atas standar (+${avgOtGap.toFixed(1)} jam)`);
  if (prodCrit) reasons.push(`produksi aktual ${Math.abs(avgProdGapPct).toFixed(0)}% di bawah plan`);
  else if (prodWarn) reasons.push(`produksi sedikit di bawah plan (${avgProdGapPct.toFixed(0)}%)`);

  if (otCrit || prodCrit) level = "crit";
  else if (otWarn || prodWarn) level = "warn";

  return { level, avgOtGap, avgProdGapPct, reason: reasons.join(", ") || "Sesuai target" };
}

export function weekendOtRecommendation(status) {
  if (status.level === "nodata") return "Belum ada data cukup";
  if (status.level === "crit") return "Tidak disarankan lembur weekend — evaluasi dulu";
  if (status.level === "warn") return "Boleh, tapi evaluasi penyebab gap dulu";
  return "Layak lembur weekend";
}

export function statusColor(level) {
  switch (level) {
    case "crit":
      return { bar: "bg-signal-crit", text: "text-signal-crit", dim: "bg-signal-critDim" };
    case "warn":
      return { bar: "bg-signal-warn", text: "text-signal-warn", dim: "bg-signal-warnDim" };
    case "ok":
      return { bar: "bg-signal-ok", text: "text-signal-ok", dim: "bg-signal-okDim" };
    default:
      return { bar: "bg-base-border", text: "text-ink-faint", dim: "bg-base-panelAlt" };
  }
}
