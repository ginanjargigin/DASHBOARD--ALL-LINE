"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getLines,
  getRecords,
  upsertRecord,
  getPlanForDate,
  applyMonthlyPlan,
} from "@/lib/storage";

import { actualProduction } from "@/lib/calc";


/* ============================================================
   DATE HELPERS
============================================================ */

function todayStr() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(now.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(now.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(dateString, amount) {
  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  date.setDate(
    date.getDate() + amount
  );

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  return date.toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}


/* ============================================================
   EMPTY FORM
============================================================ */

const emptyForm = {
  actualSales: "",
  actualProduction: "",
  actualOT: "",
  note: "",
};


/* ============================================================
   PAGE
============================================================ */

export default function InputPage() {
  const [lines, setLines] =
    useState([]);

  const [lineId, setLineId] =
    useState("");

  const [date, setDate] =
    useState(todayStr());

  const [form, setForm] =
    useState(emptyForm);

  const [plan, setPlan] =
    useState(0);

  const [saveStatus, setSaveStatus] =
    useState("idle");


  /* ==========================================================
     MONTHLY PLAN
  ========================================================== */

  const [planMonth, setPlanMonth] =
    useState(
      todayStr().slice(0, 7)
    );

  const [monthlyPlan, setMonthlyPlan] =
    useState("");


  /* ==========================================================
     LOAD LINES
  ========================================================== */

  useEffect(() => {
    const data =
      getLines();

    setLines(data);

    if (
      data.length > 0
    ) {
      setLineId(
        data[0].id
      );
    }
  }, []);


  /* ==========================================================
     LOAD DAILY DATA
  ========================================================== */

  useEffect(() => {
    if (
      !lineId ||
      !date
    ) {
      return;
    }

    const records =
      getRecords();

    const existing =
      records.find(
        (r) =>
          r.lineId === lineId &&
          r.date === date
      );

    const currentPlan =
      getPlanForDate(
        lineId,
        date
      );

    setPlan(
      currentPlan
    );

    if (existing) {
      setForm({
        actualSales:
          existing.actualSales ?? "",

        actualProduction:
          existing.actualProduction !==
          undefined
            ? existing.actualProduction
            : actualProduction(
                existing
              ),

        actualOT:
          existing.actualOT ?? "",

        note:
          existing.note ?? "",
      });
    } else {
      setForm({
        ...emptyForm,
      });
    }

    setSaveStatus("idle");
  }, [
    lineId,
    date,
  ]);


  /* ==========================================================
     TOTAL / ACHIEVEMENT
  ========================================================== */

  const production =
    Number(
      form.actualProduction
    ) || 0;

  const sales =
    Number(
      form.actualSales
    ) || 0;

  const achievement =
    plan > 0
      ? Math.round(
          (production / plan) *
            100
        )
      : 0;


  /* ==========================================================
     UPDATE FORM
  ========================================================== */

  function update(
    key,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

    setSaveStatus(
      "pending"
    );
  }


  /* ==========================================================
     AUTO SAVE
  ========================================================== */

  useEffect(() => {
    if (
      !lineId ||
      !date ||
      saveStatus !== "pending"
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        setSaveStatus(
          "saving"
        );

        const record =
          upsertRecord({
            lineId,
            date,

            planProduction:
              plan,

            actualSales:
              form.actualSales,

            actualProduction:
              form.actualProduction,

            actualOT:
              form.actualOT,

            note:
              form.note,

            /*
             * Field lama tetap
             * dibuat 0 agar
             * kompatibel.
             */
            normalMerah: 0,
            otMerah: 0,
            normalPutih: 0,
            otPutih: 0,

            planOT: 0,

            planDelivery: 0,
            actualDelivery: 0,
          });

        if (record) {
          setSaveStatus(
            "saved"
          );
        }
      }, 600);

    return () =>
      clearTimeout(timer);

  }, [
    form,
    lineId,
    date,
    plan,
    saveStatus,
  ]);


  /* ==========================================================
     DATE NAVIGATION
  ========================================================== */

  function previousDay() {
    setDate(
      addDays(
        date,
        -1
      )
    );
  }

  function nextDay() {
    setDate(
      addDays(
        date,
        1
      )
    );
  }

  function goToday() {
    setDate(
      todayStr()
    );
  }


  /* ==========================================================
     MONTHLY PLAN
  ========================================================== */

  function handleApplyMonthlyPlan() {
    if (
      !lineId ||
      !planMonth
    ) {
      return;
    }

    const value =
      Number(
        monthlyPlan
      );

    if (
      !Number.isFinite(
        value
      ) ||
      value < 0
    ) {
      return;
    }

    applyMonthlyPlan(
      lineId,
      planMonth,
      value
    );

    /*
     * Jika tanggal aktif
     * berada di bulan yang
     * sama, refresh plan.
     */
    if (
      date.slice(0, 7) ===
      planMonth
    ) {
      setPlan(
        getPlanForDate(
          lineId,
          date
        )
      );
    }

    setSaveStatus(
      "idle"
    );
  }


  /* ==========================================================
     NO LINE
  ========================================================== */

  if (
    lines.length === 0
  ) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center">

        <p className="text-ink-muted mb-3">
          Belum ada line.
          Tambahkan line dulu.
        </p>

        <Link
          href="/lines"
          className="
            text-signal-plan
            font-medium
            hover:underline
          "
        >
          Kelola Line →
        </Link>

      </div>
    );
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">


      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="mb-6">

        <h1
          className="
            font-display
            font-bold
            text-2xl
          "
        >
          Input Data Harian
        </h1>

        <p className="text-ink-muted text-sm mt-1">
          Input aktual harian dengan
          penyimpanan otomatis.
        </p>

      </div>


      {/* ======================================================
          LINE
      ======================================================= */}

      <section className="mb-6">

        <label className="block">

          <span className="block text-xs text-ink-muted mb-1">
            LINE
          </span>

          <select
            value={lineId}
            onChange={(e) =>
              setLineId(
                e.target.value
              )
            }
            className="input"
          >

            {lines.map(
              (line) => (
                <option
                  key={line.id}
                  value={line.id}
                >
                  {line.name}
                </option>
              )
            )}

          </select>

        </label>

      </section>


      {/* ======================================================
          DATE NAVIGATION
      ======================================================= */}

      <section
        className="
          rounded-lg
          border
          border-base-border
          bg-base-panel
          p-4
          mb-6
        "
      >

        <p className="text-xs text-ink-muted mb-3">
          TANGGAL DATA
        </p>

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >

          <button
            type="button"
            onClick={
              previousDay
            }
            className="
              nav-button
            "
            title="Hari sebelumnya"
          >
            ←
          </button>


          <div className="text-center">

            <p
              className="
                font-display
                font-bold
                text-lg
              "
            >
              {formatDate(
                date
              )}
            </p>

            <button
              type="button"
              onClick={
                goToday
              }
              className="
                today-button
              "
            >
              HARI INI
            </button>

          </div>


          <button
            type="button"
            onClick={
              nextDay
            }
            className="
              nav-button
            "
            title="Hari berikutnya"
          >
            →
          </button>

        </div>

      </section>


      {/* ======================================================
          PLAN
      ======================================================= */}

      <section
        className="
          rounded-lg
          border
          border-base-border
          bg-base-panel
          p-4
          mb-6
        "
      >

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs text-ink-muted">
              PLAN PRODUKSI
            </p>

            <p
              className="
                font-mono
                font-bold
                text-2xl
                text-signal-plan
                mt-1
              "
            >
              {plan.toLocaleString(
                "id-ID"
              )}{" "}
              <span className="text-xs">
                PCS
              </span>
            </p>

          </div>

          <p className="text-xs text-ink-muted">
            Otomatis dari Plan Bulanan
          </p>

        </div>

      </section>


      {/* ======================================================
          ACTUAL SALES
      ======================================================= */}

      <section className="mb-6">

        <label className="block">

          <span className="block text-xs text-ink-muted mb-1">
            ACTUAL SALES
          </span>

          <NumInput
            value={
              form.actualSales
            }
            onChange={(value) =>
              update(
                "actualSales",
                value
              )
            }
          />

        </label>

      </section>


      {/* ======================================================
          ACTUAL PRODUCTION
      ======================================================= */}

      <section
        className="
          rounded-lg
          border
          border-base-border
          bg-base-panel
          p-4
          mb-6
        "
      >

        <p className="text-xs text-ink-muted">
          PRODUKSI AKTUAL
        </p>

        <p className="text-[11px] text-ink-muted mt-1 mb-3">
          Total produksi seluruh shift,
          termasuk overtime.
        </p>

        <NumInput
          value={
            form.actualProduction
          }
          onChange={(value) =>
            update(
              "actualProduction",
              value
            )
          }
        />

        <div
          className="
            flex
            items-center
            justify-between
            mt-3
            text-xs
          "
        >

          <span className="text-ink-muted">
            Achievement
          </span>

          <span
            className="
              font-mono
              font-bold
              text-signal-plan
            "
          >
            {achievement}%
          </span>

        </div>

      </section>


      {/* ======================================================
          AUTO SAVE
      ======================================================= */}

      <div className="mb-8">

        <SaveIndicator
          status={
            saveStatus
          }
        />

      </div>


      {/* ======================================================
          MONTHLY PLAN
      ======================================================= */}

      <section
        className="
          border-t
          border-base-border
          pt-6
        "
      >

        <div className="mb-4">

          <h2
            className="
              font-display
              font-bold
              text-lg
            "
          >
            Plan Produksi Bulanan
          </h2>

          <p className="text-xs text-ink-muted mt-1">
            Satu kali input akan diterapkan
            ke seluruh hari kerja Senin–Jumat.
          </p>

        </div>


        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-3
            gap-3
          "
        >

          <Field label="Bulan">

            <input
              type="month"
              value={
                planMonth
              }
              onChange={(e) =>
                setPlanMonth(
                  e.target.value
                )
              }
              className="input"
            />

          </Field>


          <Field label="Plan / Hari (pcs)">

            <NumInput
              value={
                monthlyPlan
              }
              onChange={
                setMonthlyPlan
              }
            />

          </Field>


          <div className="flex items-end">

            <button
              type="button"
              onClick={
                handleApplyMonthlyPlan
              }
              className="
                w-full
                py-2
                rounded
                bg-signal-plan
                text-base-bg
                font-semibold
                text-sm
                hover:brightness-110
              "
            >
              Terapkan Plan
            </button>

          </div>

        </div>

      </section>


      {/* ======================================================
          STYLE
      ======================================================= */}

      <style jsx global>{`

        .input {
          width: 100%;
          background: #1b232c;
          border: 1px solid #29323c;
          border-radius: 6px;
          padding: 9px 10px;
          font-size: 14px;
          color: #e7ecf2;
        }

        .input:focus {
          outline: none;
          border-color: #4c8dff;
          box-shadow:
            0 0 0 2px
            rgba(
              76,
              141,
              255,
              0.25
            );
        }

        .nav-button {
          width: 42px;
          height: 42px;
          border-radius: 7px;
          border: 1px solid #29323c;
          background: #1b232c;
          color: #4c8dff;
          font-size: 20px;
          font-weight: bold;
          transition: all 0.15s;
        }

        .nav-button:hover {
          border-color: #4c8dff;
          background: #202b39;
        }

        .today-button {
          margin-top: 5px;
          padding: 3px 9px;
          border-radius: 4px;
          border: 1px solid #29323c;
          color: #4c8dff;
          background: transparent;
          font-family: monospace;
          font-size: 10px;
          font-weight: bold;
        }

        .today-button:hover {
          border-color: #4c8dff;
        }

      `}</style>

    </div>
  );
}


/* ============================================================
   SAVE INDICATOR
============================================================ */

function SaveIndicator({
  status,
}) {

  if (
    status === "pending"
  ) {
    return (
      <p className="text-xs text-signal-warn">
        ● Menunggu penyimpanan...
      </p>
    );
  }

  if (
    status === "saving"
  ) {
    return (
      <p className="text-xs text-signal-warn">
        ◌ Menyimpan...
      </p>
    );
  }

  if (
    status === "saved"
  ) {
    return (
      <p className="text-xs text-signal-ok">
        ✓ Tersimpan otomatis
      </p>
    );
  }

  return (
    <p className="text-xs text-ink-faint">
      Data akan tersimpan otomatis
    </p>
  );
}


/* ============================================================
   COMPONENTS
============================================================ */

function Field({
  label,
  children,
}) {
  return (
    <label className="block">

      <span className="block text-xs text-ink-muted mb-1">
        {label}
      </span>

      {children}

    </label>
  );
}


function NumInput({
  value,
  onChange,
  step = "1",
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min="0"
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value
        )
      }
      className="
        input
        font-mono
        text-lg
      "
    />
  );
}
