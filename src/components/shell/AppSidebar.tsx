"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/content/nav";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <Link href="/" className="app-sidebar__brand">
        <span className="app-sidebar__mark" aria-hidden="true" />
        <span>
          <strong>Watch Desk</strong>
          <em>by Swati Keshari</em>
        </span>
      </Link>
      <p className="app-sidebar__hint">
        Bank payments look strange. This desk helps a person decide: safe, block, or investigate.
      </p>
      <nav aria-label="Pages">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="app-sidebar__group">
            <p className="app-sidebar__group-title">{group.title}</p>
            {group.items.map((item) => {
              const nested = item.href === "/cases" || item.href === "/alerts";
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : nested
                    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                    : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "app-sidebar__link is-active" : "app-sidebar__link"}
                  title={item.plain}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
