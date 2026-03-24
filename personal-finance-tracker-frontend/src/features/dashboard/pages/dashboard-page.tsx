import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, PiggyBank, ShieldAlert, Wallet } from "lucide-react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { getDashboardSummary, getForecastDaily, getForecastMonth, getHealthScore } from "@/features/finance/api/finance-api";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/utils/format";
import { EmptyState, SkeletonCard } from "@/components/feedback/states";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";

const metricCardStyles = [
  "border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(235,243,255,0.92),rgba(221,233,255,0.88))] shadow-[0_18px_40px_rgba(53,76,153,0.10)]",
  "border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(244,244,255,0.92),rgba(231,236,255,0.88))] shadow-[0_18px_40px_rgba(60,72,150,0.10)]",
  "border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,248,255,0.92),rgba(223,238,248,0.88))] shadow-[0_18px_40px_rgba(53,90,153,0.10)]",
  "border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,247,236,0.94),rgba(248,238,255,0.88))] shadow-[0_18px_40px_rgba(120,94,146,0.10)]",
] as const;

const surfaceCardClass =
  "border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.9))] shadow-[0_24px_48px_rgba(45,74,150,0.08)] backdrop-blur";

const chartSurfaceClass =
  "rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(230,238,255,0.7),rgba(255,255,255,0.55))] px-2 py-2";

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  const { data: forecastMonth } = useQuery({ queryKey: ["forecast-month"], queryFn: getForecastMonth });
  const { data: forecastDaily } = useQuery({ queryKey: ["forecast-daily"], queryFn: getForecastDaily });
  const { data: healthScore } = useQuery({ queryKey: ["health-score"], queryFn: getHealthScore });
  const financeState = useFinanceData();
  const riskTone =
    forecastMonth?.riskLevel === "high"
      ? "bg-rose-100 text-rose-700"
      : forecastMonth?.riskLevel === "medium"
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

  if (isLoading) {
    return <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">{Array.from({ length: 4 }, (_, index) => <SkeletonCard key={index} />)}</div>;
  }

  if (!data) {
    return <EmptyState title="Dashboard unavailable" description="Try reloading after your data connection is restored." />;
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(194,214,255,0.42),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,236,211,0.34),transparent_26%),linear-gradient(180deg,#f9fbff_0%,#eef4ff_54%,#f8fbff_100%)] px-1 py-1 sm:px-2 sm:py-2">
      <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[radial-gradient(circle,rgba(125,157,255,0.16),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,215,163,0.14),transparent_70%)] blur-3xl" />

      <div className="relative space-y-6">
        <Card className="overflow-hidden border border-white/75 bg-[linear-gradient(120deg,rgba(17,33,82,0.95),rgba(42,76,190,0.92),rgba(125,161,255,0.62))] px-6 py-6 text-white shadow-[0_28px_60px_rgba(26,44,110,0.22)]">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100/80">Financial cockpit</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your money picture for this month</h1>
              <p className="mt-3 text-sm text-blue-100/85 sm:text-base">
                See current momentum, projected month-end balance, and the signals that need attention without jumping between pages.
              </p>
            </div>
            <div className="grid gap-3 rounded-[1.75rem] border border-white/20 bg-[linear-gradient(145deg,rgba(21,36,92,0.26),rgba(89,122,234,0.24))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/80">Net worth snapshot</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(data.netBalance)}</p>
                <p className="mt-2 text-sm text-white/90">
                  {forecastMonth ? `Month-end could land at ${formatCurrency(forecastMonth.forecastedEndOfMonthBalance)}.` : "Forecast is still loading."}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`rounded-full px-3 py-1 text-center text-xs font-semibold uppercase tracking-[0.16em] ${riskTone}`}>
                  {forecastMonth?.riskLevel ?? "--"} risk
                </span>
                <div className="rounded-2xl border border-white/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.07))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/80">Health score</p>
                  <p className="mt-2 text-2xl font-semibold">{healthScore ? `${healthScore.score}/100` : "--"}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-12">
          <Card className={`rounded-[1.8rem] xl:col-span-5 ${surfaceCardClass}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Available now</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">{formatCurrency(data.netBalance)}</h2>
                <p className="mt-2 text-sm text-slate-500">Your current balance across connected accounts.</p>
              </div>
              <span className="rounded-2xl bg-blue-600/10 p-3 text-blue-700">
                <Wallet className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Income</p>
                <div className="mt-2 flex items-center gap-2 text-emerald-700">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-lg font-semibold">{formatCurrency(data.currentMonthIncome)}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Expense</p>
                <div className="mt-2 flex items-center gap-2 text-rose-700">
                  <ArrowDownRight className="h-4 w-4" />
                  <span className="text-lg font-semibold">{formatCurrency(data.currentMonthExpense)}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Goal savings</p>
                <span className="mt-2 block text-lg font-semibold text-slate-900">{formatCurrency(data.totalGoalSaved)}</span>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Spendable now</p>
                <span className="mt-2 block text-lg font-semibold text-slate-900">{forecastMonth ? formatCurrency(forecastMonth.safeToSpend) : "--"}</span>
                <p className="mt-1 text-xs text-slate-500">
                  {forecastMonth?.safeToSpend === 0
                    ? "No extra spending room is left after protecting your month-end cushion."
                    : "Money you can still spend this month."}
                </p>
              </div>
            </div>
          </Card>

          <Card className={`min-w-0 rounded-[1.6rem] px-5 py-5 xl:col-span-3 ${metricCardStyles[0]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Projected month-end</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{forecastMonth ? formatCurrency(forecastMonth.forecastedEndOfMonthBalance) : "--"}</h2>
                <p className="mt-2 text-sm text-slate-500">Expected closing balance.</p>
              </div>
              <span className="rounded-2xl bg-blue-100/80 p-3 text-blue-700">
                <Wallet className="h-5 w-5" />
              </span>
            </div>
          </Card>

          <Card className={`min-w-0 rounded-[1.6rem] px-5 py-5 xl:col-span-2 ${metricCardStyles[1]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Safety buffer</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  {forecastMonth ? formatCurrency(Math.max(forecastMonth.forecastedEndOfMonthBalance - forecastMonth.safeToSpend, 0)) : "--"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">Held back from spending.</p>
              </div>
              <span className="rounded-2xl bg-amber-100/80 p-3 text-amber-700">
                <ShieldAlert className="h-5 w-5" />
              </span>
            </div>
          </Card>

          <Card className={`min-w-0 rounded-[1.6rem] px-5 py-5 xl:col-span-2 ${metricCardStyles[2]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risk outlook</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 capitalize">{forecastMonth?.riskLevel ?? "--"}</h2>
                <p className="mt-2 text-sm text-slate-500">Based on balance trajectory and expected month-end cushion.</p>
              </div>
              <span className="rounded-2xl bg-fuchsia-100/80 p-3 text-fuchsia-700">
                <PiggyBank className="h-5 w-5" />
              </span>
            </div>
          </Card>

          <Card className={`rounded-[1.6rem] px-5 py-5 xl:col-span-12 ${surfaceCardClass}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risk outlook</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 capitalize">{forecastMonth?.riskLevel ?? "--"} risk</h2>
                <p className="mt-2 text-sm text-slate-500">Based on balance trajectory and expected month-end cushion.</p>
              </div>
              {forecastMonth ? <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${riskTone}`}>{forecastMonth.riskLevel}</span> : null}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 2xl:grid-cols-12">
          <Card className={`min-h-[23rem] min-w-0 rounded-[1.8rem] 2xl:col-span-7 ${surfaceCardClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Projected balance</h3>
                <p className="mt-1 text-sm text-slate-500">{forecastMonth?.explanation}</p>
              </div>
              {forecastMonth ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${riskTone}`}>
                  {forecastMonth.riskLevel} risk
                </span>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Current</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{forecastMonth ? formatCurrency(forecastMonth.currentBalance) : "--"}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">End of month</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{forecastMonth ? formatCurrency(forecastMonth.forecastedEndOfMonthBalance) : "--"}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Spendable now</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{forecastMonth ? formatCurrency(forecastMonth.safeToSpend) : "--"}</p>
                <p className="mt-1 text-xs text-slate-500">Spending room left after keeping your safety buffer intact.</p>
              </div>
            </div>
            {forecastMonth?.riskMessages.length ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {forecastMonth.riskMessages.join(" ")}
              </div>
            ) : null}
            <div className={`mt-4 h-[14rem] min-w-0 ${chartSurfaceClass}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastDaily?.points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e3f6" />
                  <XAxis dataKey="date" stroke="#5b678a" />
                  <YAxis stroke="#5b678a" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="projectedBalance" stroke="#335cff" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <div className="grid gap-6 2xl:col-span-5">
            <Card className={`min-w-0 rounded-[1.8rem] ${surfaceCardClass}`}>
              <h3 className="text-lg font-semibold text-slate-900">Spending by category</h3>
              <p className="mt-1 text-sm text-slate-500">Where most of this month&apos;s money is going.</p>
              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className={`h-[15rem] min-w-0 ${chartSurfaceClass}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.categorySpend} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={2}>
                        {data.categorySpend.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {data.categorySpend.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(242,246,255,0.9))] px-3 py-2 text-sm shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="truncate text-slate-700">{entry.name}</span>
                      </div>
                      <span className="shrink-0 font-medium text-slate-800">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card className={`min-w-0 rounded-[1.8rem] ${surfaceCardClass}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Risk outlook</h3>
                  <p className="mt-1 text-sm text-slate-500">Your current forecast signal for the rest of the month.</p>
                </div>
                {forecastMonth ? (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${riskTone}`}>
                    {forecastMonth.riskLevel} risk
                  </span>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(243,247,255,0.88))] px-4 py-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Forecast confidence</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {forecastMonth ? (forecastMonth.lowConfidence ? "Limited" : "Strong") : "--"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {forecastMonth?.lowConfidence
                      ? "The forecast uses limited recent history, so month-end estimates may move more than usual."
                      : "The app has enough recent history to estimate month-end behavior more reliably."}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(243,247,255,0.88))] px-4 py-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Protected cushion</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {forecastMonth ? formatCurrency(Math.max(forecastMonth.forecastedEndOfMonthBalance - forecastMonth.safeToSpend, 0)) : "--"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">This is the amount the app tries not to let you spend through by month-end.</p>
                </div>
              </div>
            </Card>
            <Card className={`min-w-0 rounded-[1.8rem] ${surfaceCardClass}`}>
              <h3 className="text-lg font-semibold text-slate-900">Health score breakdown</h3>
              <div className="mt-4 space-y-3">
                {healthScore?.factors.map((factor) => (
                  <div key={factor.name} className="rounded-2xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(243,247,255,0.88))] px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-800">{factor.name}</p>
                      <span className="text-sm text-slate-500">{factor.score}/100</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{factor.explanation}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <Card className={`min-h-[23rem] min-w-0 rounded-[1.8rem] ${surfaceCardClass}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Income vs expense trend</h3>
              <p className="mt-1 text-sm text-slate-500">Monthly movement so you can spot when spending outpaces income.</p>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                <span className="h-2.5 w-2.5 rounded-full bg-[#335cff]" />
                Income
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-rose-700">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                Expense
              </span>
            </div>
          </div>
          <div className={`mt-4 h-[18rem] min-w-0 ${chartSurfaceClass}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.incomeExpenseTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e3f6" />
                <XAxis dataKey="month" stroke="#5b678a" />
                <YAxis stroke="#5b678a" />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#335cff" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className={`min-w-0 rounded-[1.8rem] ${surfaceCardClass}`}>
            <h3 className="text-lg font-semibold text-slate-900">Budget progress</h3>
            <div className="mt-4 space-y-4">
              {data.budgets.map((budget) => {
                const percent = Math.round((budget.spent / budget.amount) * 100);
                const categoryName = financeState.data?.categories.find((category) => category.id === budget.categoryId)?.name ?? budget.categoryId;
                return (
                  <div key={budget.id}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-700">
                      <span className="truncate">{categoryName}</span>
                      <span className="shrink-0 font-medium">{percent}%</span>
                    </div>
                    <Progress value={percent} />
                  </div>
                );
              })}
            </div>
          </Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className={`min-w-0 rounded-[1.8rem] ${surfaceCardClass}`}>
              <h3 className="text-lg font-semibold text-slate-900">Recent transactions</h3>
              <div className="mt-4 space-y-3">
                {data.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(243,247,255,0.88))] px-4 py-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{transaction.merchant ?? transaction.note ?? "Transaction"}</p>
                      <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                    </div>
                    <span className={`shrink-0 ${transaction.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className={`min-w-0 rounded-[1.8rem] ${surfaceCardClass}`}>
              <h3 className="text-lg font-semibold text-slate-900">Upcoming recurring</h3>
              <div className="mt-4 space-y-3">
                {data.upcomingRecurring.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(243,247,255,0.88))] px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-medium text-slate-800">{item.title}</p>
                      <span className="shrink-0 text-sm text-slate-500">{formatDate(item.nextRunDate)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
