import { useQuery } from "@tanstack/react-query";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { getDashboardSummary } from "@/features/finance/api/finance-api";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/utils/format";
import { EmptyState, SkeletonCard } from "@/components/feedback/states";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";

const metricCardStyles = [
  "border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(237,243,255,0.92),rgba(225,236,255,0.9))] shadow-[0_20px_45px_rgba(53,76,153,0.10)]",
  "border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,242,255,0.92),rgba(229,235,255,0.9))] shadow-[0_20px_45px_rgba(60,72,150,0.10)]",
  "border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(237,248,255,0.92),rgba(226,239,255,0.9))] shadow-[0_20px_45px_rgba(53,90,153,0.10)]",
  "border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,248,237,0.92),rgba(246,237,255,0.88))] shadow-[0_20px_45px_rgba(120,94,146,0.10)]",
] as const;

const surfaceCardClass =
  "border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.9))] shadow-[0_24px_48px_rgba(45,74,150,0.08)] backdrop-blur";

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  const financeState = useFinanceData();

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
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          {[
            { label: "Current month income", value: formatCurrency(data.currentMonthIncome) },
            { label: "Current month expense", value: formatCurrency(data.currentMonthExpense) },
            { label: "Net balance", value: formatCurrency(data.netBalance) },
            { label: "Goal savings", value: formatCurrency(data.totalGoalSaved) },
          ].map((item, index) => (
            <Card key={item.label} className={`min-w-0 ${metricCardStyles[index % metricCardStyles.length]}`}>
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{item.value}</h2>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className={`min-h-[23rem] min-w-0 ${surfaceCardClass}`}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Spending by category</h3>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_200px]">
              <div className="h-[18rem] min-w-0 rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(229,237,255,0.7),rgba(255,255,255,0.55))] px-2 py-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.categorySpend} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={2}>
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
          <Card className={`min-h-[23rem] min-w-0 ${surfaceCardClass}`}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Income vs expense trend</h3>
            <div className="h-[18rem] min-w-0 rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(230,238,255,0.7),rgba(255,255,255,0.55))] px-2 py-2">
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
        </div>

        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          <Card className={`min-w-0 ${surfaceCardClass}`}>
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
          <Card className={`min-w-0 ${surfaceCardClass}`}>
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
          <Card className={`min-w-0 ${surfaceCardClass}`}>
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
  );
}
