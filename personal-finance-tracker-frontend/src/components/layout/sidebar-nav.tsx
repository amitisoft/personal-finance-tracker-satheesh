import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, PiggyBank, Target, ChartColumn, Repeat, Wallet, Settings } from "lucide-react";
import { routes } from "@/utils/routes";
import { cn } from "@/utils/cn";
import { useUiStore } from "@/store/ui-store";

const items = [
  { to: routes.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { to: routes.transactions, label: "Transactions", icon: ArrowLeftRight },
  { to: routes.budgets, label: "Budgets", icon: PiggyBank },
  { to: routes.goals, label: "Goals", icon: Target },
  { to: routes.reports, label: "Reports", icon: ChartColumn },
  { to: routes.recurring, label: "Recurring", icon: Repeat },
  { to: routes.accounts, label: "Accounts", icon: Wallet },
  { to: routes.settings, label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const closeSidebar = useUiStore((state) => state.closeSidebar);

  return (
    <nav className="flex h-full flex-col gap-2">
      <div className="mb-6 rounded-2xl bg-brand-900 p-4 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-100">Finance</p>
        <h1 className="mt-2 text-xl font-semibold">TrackMyMoney</h1>
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={closeSidebar}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100",
                isActive && "bg-brand-50 text-brand-700",
              )
            }
          >
            <Icon size={18} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
