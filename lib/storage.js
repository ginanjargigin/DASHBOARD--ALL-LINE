"use client";

// Semua data disimpan di localStorage browser/perangkat.
// Data antar perangkat tidak otomatis tersinkron.

const LINES_KEY = "pml_lines_v1";
const RECORDS_KEY = "pml_records_v1";
const MONTHLY_PLAN_KEY = "pml_monthly_plan_v1";

function safeParse(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

/* ============================================================
   LINES
============================================================ */

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
  saveLines(
    getLines().map((l) =>
      l.id === id
        ? { ...l, name: name.trim() }
        : l
    )
  );
}


/* ============================================================
   DAILY RECORDS
============================================================ */

export function getRecords() {
  if (typeof window === "undefined") return [];

  return safeParse(
    localStorage.getItem(RECORDS_KEY),
    []
  );
}

export function saveRecords(records) {
  localStorage.setItem(
    RECORDS_KEY,
    JSON.stringify(records)
  );
}


/*
 * Satu record = satu line + satu tanggal.
 *
 * Data baru:
 * actualProduction = total produksi
 *
 * Data lama:
 * normalMerah
 * otMerah
 * normalPutih
 * otPutih
 *
 * Data lama tetap disimpan agar kompatibel.
 */

export function upsertRecord(record) {
  const records = getRecords();

  const idx = records.findIndex(
    (r) =>
      r.lineId === record.lineId &&
      r.date === record.date
  );

  const old = idx >= 0 ? records[idx] : {};

  const clean = {
    id:
      idx >= 0
        ? records[idx].id
        : crypto.randomUUID(),

    lineId: record.lineId,
    date: record.date,

    planProduction: num(
      record.planProduction
    ),

    actualSales: num(
      record.actualSales
    ),

    /*
     * FIELD BARU
     */
    actualProduction:
      record.actualProduction !== undefined
        ? num(record.actualProduction)
        : num(old.actualProduction),

    /*
     * FIELD LAMA — tetap dipertahankan
     */
    normalMerah: num(record.normalMerah),
    otMerah: num(record.otMerah),
    normalPutih: num(record.normalPutih),
    otPutih: num(record.otPutih),

    /*
     * OVERTIME
     */
    planOT: num(record.planOT),
    actualOT: num(record.actualOT),

    /*
     * DELIVERY
     */
    planDelivery: num(record.planDelivery),
    actualDelivery: num(record.actualDelivery),

    note: record.note || "",
  };

  if (idx >= 0) {
    records[idx] = clean;
  } else {
    records.push(clean);
  }

  saveRecords(records);

  return clean;
}

export function deleteRecord(id) {
  saveRecords(
    getRecords().filter(
      (r) => r.id !== id
    )
  );
}

function num(v) {
  const n = Number(v);

  return Number.isFinite(n)
    ? n
    : 0;
}

export function recordsForLine(lineId) {
  return getRecords()
    .filter(
      (r) => r.lineId === lineId
    )
    .sort((a, b) =>
      a.date.localeCompare(b.date)
    );
}


/* ============================================================
   MONTHLY PLAN
============================================================ */

/*
 * Struktur:
 *
 * {
 *   lineId: "...",
 *   month: "2026-08",
 *   plan: 323,
 *   days: {
 *      "2026-08-03": 323,
 *      "2026-08-04": 323,
 *      ...
 *   }
 * }
 */

export function getMonthlyPlans() {
  if (typeof window === "undefined") {
    return [];
  }

  return safeParse(
    localStorage.getItem(
      MONTHLY_PLAN_KEY
    ),
    []
  );
}

export function saveMonthlyPlans(plans) {
  localStorage.setItem(
    MONTHLY_PLAN_KEY,
    JSON.stringify(plans)
  );
}


/*
 * Membuat plan hanya untuk Senin-Jumat.
 */
export function applyMonthlyPlan(
  lineId,
  month,
  plan
) {
  const plans = getMonthlyPlans();

  const numericPlan = num(plan);

  const days = {};

  const [year, monthNumber] =
    month.split("-").map(Number);

  const lastDay = new Date(
    year,
    monthNumber,
    0
  ).getDate();

  for (
    let day = 1;
    day <= lastDay;
    day++
  ) {
    const date = new Date(
      year,
      monthNumber - 1,
      day
    );

    const weekday = date.getDay();

    // 0 = Minggu
    // 6 = Sabtu
    if (
      weekday !== 0 &&
      weekday !== 6
    ) {
      const dateString =
        `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      days[dateString] =
        numericPlan;
    }
  }

  const newPlan = {
    lineId,
    month,
    plan: numericPlan,
    days,
    updatedAt:
      new Date().toISOString(),
  };

  const idx = plans.findIndex(
    (p) =>
      p.lineId === lineId &&
      p.month === month
  );

  if (idx >= 0) {
    plans[idx] = newPlan;
  } else {
    plans.push(newPlan);
  }

  saveMonthlyPlans(plans);

  return newPlan;
}


/*
 * Mengambil plan berdasarkan line + tanggal.
 */
export function getPlanForDate(
  lineId,
  date
) {
  const month =
    date.slice(0, 7);

  const plan = getMonthlyPlans().find(
    (p) =>
      p.lineId === lineId &&
      p.month === month
  );

  if (!plan) return 0;

  return num(
    plan.days?.[date]
  );
}


/* ============================================================
   EXPORT / IMPORT
============================================================ */

export function exportAll() {
  return JSON.stringify(
    {
      lines: getLines(),
      records: getRecords(),
      monthlyPlans:
        getMonthlyPlans(),
      exportedAt:
        new Date().toISOString(),
    },
    null,
    2
  );
}

export function importAll(jsonString) {
  const data =
    JSON.parse(jsonString);

  if (Array.isArray(data.lines)) {
    saveLines(data.lines);
  }

  if (Array.isArray(data.records)) {
    saveRecords(data.records);
  }

  if (
    Array.isArray(
      data.monthlyPlans
    )
  ) {
    saveMonthlyPlans(
      data.monthlyPlans
    );
  }
}
