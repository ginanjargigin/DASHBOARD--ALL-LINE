"use client";
import { useEffect, useRef, useState } from "react";
import {
  getLines,
  addLine,
  deleteLine,
  renameLine,
  exportAll,
  importAll,
} from "@/lib/storage";

export default function LinesPage() {
  const [lines, setLines] = useState([]);
  const [newName, setNewName] = useState("");
  const fileRef = useRef(null);

  const refresh = () => setLines(getLines());
  useEffect(refresh, []);

  function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    addLine(newName);
    setNewName("");
    refresh();
  }

  function handleDelete(id, name) {
    if (confirm(`Hapus line "${name}"? Semua data historis line ini juga akan terhapus.`)) {
      deleteLine(id);
      refresh();
    }
  }

  function handleExport() {
    const blob = new Blob([exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-papan-produksi-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importAll(reader.result);
        refresh();
        alert("Data berhasil diimpor.");
      } catch {
        alert("File tidak valid.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <h1 className="font-display font-bold text-2xl mb-1">Kelola Line</h1>
      <p className="text-ink-muted text-sm mb-6">
        Data tersimpan lokal di perangkat ini saja (localStorage browser) — tidak
        dikirim ke server manapun.
      </p>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama line, mis. PSV Line"
          className="flex-1 bg-base-panel border border-base-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-plan/60"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-signal-plan text-base-bg font-semibold text-sm hover:brightness-110"
        >
          Tambah
        </button>
      </form>

      <div className="space-y-2 mb-10">
        {lines.length === 0 && (
          <p className="text-ink-faint text-sm">Belum ada line terdaftar.</p>
        )}
        {lines.map((l) => (
          <LineRow key={l.id} line={l} onDelete={handleDelete} onRenamed={refresh} />
        ))}
      </div>

      <div className="border-t border-base-border pt-6">
        <h2 className="font-display font-bold text-lg mb-2">Backup / Pindah Perangkat</h2>
        <p className="text-ink-muted text-sm mb-3">
          Karena data hanya tersimpan lokal, gunakan ini untuk memindahkan data
          dari laptop ke HP (atau sebaliknya), atau sebagai cadangan.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded bg-base-panelAlt border border-base-border text-sm hover:border-signal-plan/50"
          >
            Ekspor data (.json)
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded bg-base-panelAlt border border-base-border text-sm hover:border-signal-plan/50"
          >
            Impor data (.json)
          </button>
          <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
        </div>
      </div>
    </div>
  );
}

function LineRow({ line, onDelete, onRenamed }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(line.name);

  return (
    <div className="flex items-center justify-between bg-base-panel border border-base-border rounded px-3 py-2">
      {editing ? (
        <input
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            renameLine(line.id, name);
            setEditing(false);
            onRenamed();
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="bg-transparent border-b border-signal-plan text-sm flex-1 focus:outline-none"
        />
      ) : (
        <span className="text-sm">{line.name}</span>
      )}
      <div className="flex gap-3 text-xs">
        <button onClick={() => setEditing(true)} className="text-ink-muted hover:text-ink-primary">
          Ubah nama
        </button>
        <button onClick={() => onDelete(line.id, line.name)} className="text-signal-crit hover:brightness-110">
          Hapus
        </button>
      </div>
    </div>
  );
}
