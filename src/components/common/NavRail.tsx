"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, LayoutGrid, ScrollText, FlaskConical } from "lucide-react";
import clsx from "clsx";

const ITEMS = [
  { href: "/alerts", label: "Alert queue", icon: ShieldAlert },
  { href: "/cases", label: "Cases", icon: LayoutGrid },
  { href: "/audit", label: "Audit log", icon: ScrollText },
  { href: "/test", label: "Test", icon: FlaskConical },
];

export function NavRail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface py-3"
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            title={label}
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded transition-colors",
              active
                ? "bg-risk-info/15 text-risk-info"
                : "text-ink-muted hover:bg-surface-raised hover:text-ink"
            )}
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        );
      })}
    </nav>
  );
}
