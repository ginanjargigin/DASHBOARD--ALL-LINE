"use client";

// Semua data disimpan di localStorage milik browser/perangkat yang membuka
// aplikasi ini. Tidak ada server/database eksternal — sesuai kebutuhan privasi
// data internal perusahaan. Artinya data di laptop A tidak otomatis muncul di
// HP B kecuali diekspor/diimpor manual (lihat fungsi export/import di bawah).

const LINES_KEY = "pml_lines_v1";
const RECORDS_KEY = "pml_records_v1";

function safeParse(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function getLines() {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(LINES_KEY), []);
}

export function saveLines(lines) {
  localStorage.setItem(LINES_KEY, JSON.stringify(lines));
}

export function addLine(name) {
  const lines = getLines();
  const newLine = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  saveLines([...lines, newLine]);
  return newLine;
}

export function deleteLine(id) {
  saveLines(getLines().filter((l) => l.id !== id));
  saveRecords(getRecords().filter((r) => r.lineId !== id));
}

export function renameLine(id, name) {
  saveLines(getLines().map((l) => (l.id === id ? { ...l, name: name.trim() } : l)));
}

export function getRecords() {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(RECORDS_KEY), []);
}

export function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

// Satu record = satu line pada satu tanggal. Menyimpan ulang tanggal yang
// sama untuk line yang sama akan menimpa (upsert), bukan menduplikasi.
export function upsertRecord(record) {
  const records = getRecords();
  const idx = records.findIndex(
    (r) => r.lineId === record.lineId && r.date === record.date
  );
  const clean = {
    id: idx >= 0 ? records[idx].id : crypto.randomUUID(),
    lineId: record.lineId,
    date: record.date,
    planProduction: num(record.planProduction),
    actualSales: num(record.actualSales),
    normalMerah: num(record.normalMerah),
    otMerah: num(record.otMerah),
    normalPutih: num(record.normalPutih),
    otPutih: num(record.otPutih),
    planOT: num(record.planOT),
    actualOT: num(record.actualOT),
    planDelivery: num(record.planDelivery),
    actualDelivery: num(record.actualDelivery),
    note: record.note || "",
  };
  if (idx >= 0) records[idx] = clean;
  else records.push(clean);
  saveRecords(records);
  return clean;
}

export function deleteRecord(id) {
  saveRecords(getRecords().filter((r) => r.id !== id));
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function recordsForLine(lineId) {
  return getRecords()
    .filter((r) => r.lineId === lineId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function exportAll() {
  return JSON.stringify(
    { lines: getLines(), records: getRecords(), exportedAt: new Date().toISOString() },
    null,
    2
  );
}

export function importAll(jsonString) {
  const data = JSON.parse(jsonString);
  if (Array.isArray(data.lines)) saveLines(data.lines);
  if (Array.isArray(data.records)) saveRecords(data.records);
}
