"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Papan TV" },
  { href: "/input", label: "Input Harian" },
  { href: "/lines", label: "Kelola Line" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-base-border bg-base-panel/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-[1600px] mx-auto px-5 py-3 flex items-center gap-6">
        <div className="font-display font-bold text-xl tracking-wide text-ink-primary">
          PAPAN <span className="text-signal-plan">PRODUKSI</span>
        </div>
        <nav className="flex gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  active
                    ? "bg-signal-plan/15 text-signal-plan"
                    : "text-ink-muted hover:text-ink-primary hover:bg-base-panelAlt"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
