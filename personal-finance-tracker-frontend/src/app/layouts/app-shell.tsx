import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils/cn";
import { TransactionModal } from "@/features/transactions/components/transaction-modal";

export function AppShell() {
  const location = useLocation();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {sidebarOpen ? <button className="fixed inset-0 z-20 bg-slate-950/35 lg:hidden" onClick={closeSidebar} aria-label="Close navigation" /> : null}
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-72 max-w-[85vw] -translate-x-full border-r border-slate-200 bg-white p-5 transition-transform duration-200 lg:static lg:w-auto lg:max-w-none lg:translate-x-0",
            sidebarOpen && "translate-x-0",
          )}
        >
          <SidebarNav />
        </aside>
        <div className="flex min-h-screen flex-col">
          <Topbar />
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <TransactionModal />
    </div>
  );
}
