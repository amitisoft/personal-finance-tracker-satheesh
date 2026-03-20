import type { PropsWithChildren } from "react";
import { Coins, PiggyBank, ReceiptText, ShieldCheck, Target, Wallet } from "lucide-react";

const highlights = [
  { icon: Wallet, label: "Income Tracking" },
  { icon: ReceiptText, label: "Expense Tracking" },
  { icon: PiggyBank, label: "Budget Customization" },
  { icon: Target, label: "Goal Setting" },
  { icon: ShieldCheck, label: "Bill Management" },
];

export function AuthFormShell({ title, description, children }: PropsWithChildren<{ title: string; description: string }>) {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc,_#eef4ff)] p-3 sm:p-4">
      <div className="mx-auto flex w-full max-w-5xl overflow-hidden rounded-[2rem] border border-blue-100/80 bg-white shadow-[0_35px_90px_-48px_rgba(37,99,235,0.34)] md:h-[calc(100vh-2rem)] md:max-h-[820px]">
        <section className="hidden w-full max-w-[24rem] flex-col justify-between bg-[linear-gradient(160deg,_#19235f,_#3158d8_52%,_#87a9ff)] px-8 py-9 text-white md:flex">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-50 backdrop-blur">
              <Coins size={16} />
              TrackMyMoney
            </div>
            <h1 className="mt-8 text-4xl font-semibold leading-tight drop-shadow-[0_10px_18px_rgba(15,23,42,0.28)]">TrackMyMoney</h1>
            <p className="mt-4 max-w-xs text-base leading-8 text-blue-50/90">
              Keep your spending, budgets, goals, and recurring plans together in one smarter money workspace.
            </p>
          </div>

          <div className="space-y-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 text-white/95">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur">
                    <Icon size={18} />
                  </span>
                  <span className="text-lg font-medium">{item.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,_#ffffff,_#f8fbff)] px-5 py-6 sm:px-8 md:px-10">
          <div className="w-full max-w-md rounded-[2rem] border border-blue-100/70 bg-white/92 p-7 shadow-[0_25px_60px_-44px_rgba(37,99,235,0.26)] backdrop-blur sm:p-8">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.45em] text-brand-600">TrackMyMoney</p>
            <h2 className="mt-4 text-center text-4xl font-semibold tracking-tight text-brand-700 drop-shadow-[0_6px_10px_rgba(37,99,235,0.12)] sm:text-[3.2rem]">{title}</h2>
            <p className="mt-3 text-center text-sm leading-7 text-slate-500">{description}</p>
            <div className="mt-7 space-y-4">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
