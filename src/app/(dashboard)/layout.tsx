import { AppSidebar } from "@/components/shell/AppSidebar";
import { CommandPalette } from "@/components/common/CommandPalette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="app-main">
        <header className="app-topbar">
          <p className="text-sm text-ink-muted">Watch Desk</p>
          <p className="hidden text-xs text-ink-faint sm:block">
            Press <kbd className="rounded border border-border px-1 py-0.5">⌘K</kbd> to jump
          </p>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
