"use client";

/*
============================================================
STORAGE
============================================================

Data disimpan di localStorage browser.

MODEL DATA BARU:

LINE
- id
- name

MONTHLY PLAN
- lineId
- month        -> YYYY-MM
- planProduction

DAILY RECORD
- id
- lineId
- date
- actualSales
- actualProduction
- planOT
- actualOT
- planDelivery
- actualDelivery
- note

Plan bulanan tidak perlu disimpan ulang di setiap record.
Saat mengambil record, plan akan dicari berdasarkan
line + bulan.
============================================================
*/

const LINES_KEY = "pml_lines_v1";
const RECORDS_KEY = "pml_records_v2";
const MONTHLY_PLAN_KEY = "pml_monthly_plan_v1";

/*
============================================================
SAFE PARSE
============================================================
*/

function safeParse(raw, fallback) {
  try {
    const value = JSON.parse(raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}


/*
============================================================
LINES
============================================================
*/

export function getLines() {
  if (typeof window === "undefined") return [];

  return safeParse(
    localStorage.getItem(LINES_KEY),
    []
  );
}


export function saveLines(lines) {
  localStorage.setItem(
    LINES_KEY,
    JSON.stringify(lines)
  );
}


export function addLine(name) {
  const lines = getLines();

  const newLine = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  saveLines([
    ...lines,
    newLine,
  ]);

  return newLine;
}


export function deleteLine(id) {
  saveLines(
    getLines().filter(
      (line) => line.id !== id
    )
  );

  saveRecords(
    getRecords().filter(
      (record) => record.lineId !== id
    )
  );

  saveMonthlyPlans(
    getMonthlyPlans().filter(
      (plan) => plan.lineId !== id
    )
  );
}


export function renameLine(id, name) {
  saveLines(
    getLines().map((line) =>
      line.id === id
        ? {
            ...line,
            name: name.trim(),
          }
        : line
    )
  );
}


/*
============================================================
MONTHLY PLAN
============================================================

month format:

2026-08
2026-09
2026-10

Satu input plan berlaku untuk seluruh
hari kerja Senin-Jumat pada bulan tersebut.
============================================================
*/

export function getMonthlyPlans() {
  if (typeof window === "undefined") {
    return [];
  }

  return safeParse(
    localStorage.getItem(MONTHLY_PLAN_KEY),
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
------------------------------------------------------------
Simpan plan bulanan
------------------------------------------------------------
*/

export function saveMonthlyPlan(
  lineId,
  month,
  planProduction
) {
  const plans = getMonthlyPlans();

  const clean = {
    id: crypto.randomUUID(),
    lineId,
    month,
    planProduction: num(planProduction),
  };

  const index = plans.findIndex(
    (plan) =>
      plan.lineId === lineId &&
      plan.month === month
  );

  if (index >= 0) {
    clean.id = plans[index].id;
    plans[index] = clean;
  } else {
    plans.push(clean);
  }

  saveMonthlyPlans(plans);

  /*
   * Sinkronkan plan ke record harian
   * yang sudah pernah dibuat pada bulan tersebut.
   */
  const records = getRecords();

  const updatedRecords = records.map(
    (record) => {

      if (
        record.lineId === lineId &&
        record.date.startsWith(month)
      ) {
        return {
          ...record,
          planProduction:
            clean.planProduction,
        };
      }

      return record;
    }
  );

  saveRecords(updatedRecords);

  return clean;
}


/*
------------------------------------------------------------
Ambil plan berdasarkan line + bulan
------------------------------------------------------------
*/

export function getMonthlyPlan(
  lineId,
  month
) {
  const plan = getMonthlyPlans().find(
    (item) =>
      item.lineId === lineId &&
      item.month === month
  );

  return plan || null;
}


/*
------------------------------------------------------------
Ambil plan berdasarkan tanggal
------------------------------------------------------------
*/

export function getPlanForDate(
  lineId,
  date
) {
  if (!lineId || !date) return 0;

  const month = date.slice(0, 7);

  const plan = getMonthlyPlan(
    lineId,
    month
  );

  if (!plan) return 0;

  /*
   * Cek apakah tanggal adalah weekend.
   *
   * 0 = Minggu
   * 6 = Sabtu
   */

  const [year, monthNumber, day] =
    date.split("-").map(Number);

  const dayOfWeek = new Date(
    year,
    monthNumber - 1,
    day
  ).getDay();

  if (
    dayOfWeek === 0 ||
    dayOfWeek === 6
  ) {
    return 0;
  }

  return num(
    plan.planProduction
  );
}


/*
============================================================
DAILY RECORDS
============================================================
*/

export function getRecords() {
  if (typeof window === "undefined") {
    return [];
  }

  const records = safeParse(
    localStorage.getItem(RECORDS_KEY),
    []
  );

  /*
   * Tambahkan plan otomatis ketika data dibaca.
   *
   * Ini penting agar dashboard lama yang membaca
   * record.planProduction tetap bisa bekerja.
   */

  return records.map((record) => {

    const monthlyPlan =
      getPlanForDate(
        record.lineId,
        record.date
      );

    return {
      ...record,

      planProduction:
        monthlyPlan > 0
          ? monthlyPlan
          : num(record.planProduction),

      /*
       * Compatibility dengan model lama.
       *
       * Kalau record baru punya actualProduction,
       * gunakan itu.
       *
       * Kalau record lama masih memakai 4 kolom shift,
       * hitung dari kolom lama.
       */

      actualProduction:
        record.actualProduction !== undefined
          ? num(record.actualProduction)
          : (
              num(record.normalMerah) +
              num(record.otMerah) +
              num(record.normalPutih) +
              num(record.otPutih)
            ),
    };
  });
}


export function saveRecords(records) {
  localStorage.setItem(
    RECORDS_KEY,
    JSON.stringify(records)
  );
}


/*
============================================================
UPSERT DAILY RECORD
============================================================

Satu record =
1 line + 1 tanggal

Jika tanggal sama:
data lama ditimpa.

Tidak membuat duplikat.
============================================================
*/

export function upsertRecord(record) {

  const records = getRecords();

  const index = records.findIndex(
    (item) =>
      item.lineId === record.lineId &&
      item.date === record.date
  );


  /*
   * Cari plan otomatis dari bulan.
   */

  const monthlyPlan =
    getPlanForDate(
      record.lineId,
      record.date
    );


  /*
   * Jika plan bulanan belum ada,
   * gunakan plan yang dikirim record.
   */

  const plan =
    monthlyPlan > 0
      ? monthlyPlan
      : num(record.planProduction);


  /*
   * Model data baru.
   */

  const clean = {

    id:
      index >= 0
        ? records[index].id
        : crypto.randomUUID(),

    lineId:
      record.lineId,

    date:
      record.date,

    planProduction:
      plan,

    actualSales:
      num(record.actualSales),

    actualProduction:
      num(record.actualProduction),

    planOT:
      num(record.planOT),

    actualOT:
      num(record.actualOT),

    planDelivery:
      num(record.planDelivery),

    actualDelivery:
      num(record.actualDelivery),

    note:
      record.note || "",
  };


  /*
   * Simpan.
   */

  if (index >= 0) {
    records[index] = clean;
  } else {
    records.push(clean);
  }

  saveRecords(records);

  return clean;
}


/*
============================================================
DELETE RECORD
============================================================
*/

export function deleteRecord(id) {
  saveRecords(
    getRecords().filter(
      (record) => record.id !== id
    )
  );
}


/*
============================================================
RECORDS PER LINE
============================================================
*/

export function recordsForLine(lineId) {
  return getRecords()
    .filter(
      (record) =>
        record.lineId === lineId
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    );
}


/*
============================================================
RECORD PER TANGGAL
============================================================
*/

export function getRecord(
  lineId,
  date
) {
  return getRecords().find(
    (record) =>
      record.lineId === lineId &&
      record.date === date
  ) || null;
}


/*
============================================================
EXPORT
============================================================
*/

export function exportAll() {

  return JSON.stringify(
    {
      lines:
        getLines(),

      records:
        getRecords(),

      monthlyPlans:
        getMonthlyPlans(),

      exportedAt:
        new Date().toISOString(),
    },
    null,
    2
  );
}


/*
============================================================
IMPORT
============================================================
*/

export function importAll(
  jsonString
) {

  const data =
    JSON.parse(jsonString);


  if (
    Array.isArray(
      data.lines
    )
  ) {
    saveLines(
      data.lines
    );
  }


  if (
    Array.isArray(
      data.records
    )
  ) {
    saveRecords(
      data.records
    );
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


/*
============================================================
UTILITY
============================================================
*/

function num(value) {

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}
