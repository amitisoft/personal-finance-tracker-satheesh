import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAdvancedReports, getReports } from "@/features/finance/api/finance-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";
import { formatCurrency } from "@/utils/format";

const pageShellClass =
  "relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(194,214,255,0.42),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,236,211,0.34),transparent_26%),linear-gradient(180deg,#f9fbff_0%,#eef4ff_54%,#f8fbff_100%)] px-4 py-5 sm:px-6";
const softPanelClass =
  "border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.9))] shadow-[0_24px_48px_rgba(45,74,150,0.08)] backdrop-blur";

export function ReportsPage() {
  const { data: financeState } = useFinanceData();
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", accountId: "", categoryId: "" });
  const { data } = useQuery({ queryKey: ["reports"], queryFn: getReports });
  const { data: advanced } = useQuery({
    queryKey: ["advanced-reports", filters],
    queryFn: () => getAdvancedReports({
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      accountId: filters.accountId || undefined,
      categoryId: filters.categoryId || undefined,
    }),
  });

  const categoryTrendData = useMemo(() => advanced?.categoryTrends.slice(-8) ?? [], [advanced]);
  const categorySpendChartData = useMemo(() => (data?.categorySpend ?? []).slice().sort((left, right) => right.value - left.value), [data]);
  const formatMoney = (value: number | string) => formatCurrency(Number(value) || 0);
  const currencyTooltipFormatter = (value: number | string) => formatMoney(value);
  const currencyAxisFormatter = (value: number | string) => formatMoney(value).replace("₹", "").trim();

  const exportCsv = () => {
    if (!data) {
      return;
    }
    const rows = ["name,value", ...data.categorySpend.map((item) => `${item.name},${item.value}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "category-spend-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={pageShellClass}>
      <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[radial-gradient(circle,rgba(125,157,255,0.16),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,215,163,0.14),transparent_70%)] blur-3xl" />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Reports</h2>
            <p className="text-sm text-slate-600">Category spend, trends, balances, and savings momentum in one place.</p>
          </div>
          <Button onClick={exportCsv}>Export CSV</Button>
        </div>
        <Card className={softPanelClass}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
            <Input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
            <Select value={filters.accountId} onChange={(event) => setFilters((current) => ({ ...current, accountId: event.target.value }))}>
              <option value="">All accounts</option>
              {financeState?.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </Select>
            <Select value={filters.categoryId} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}>
              <option value="">All categories</option>
              {financeState?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
          </div>
        </Card>
        <div className="grid gap-4">
          <Card className={`h-[26rem] ${softPanelClass}`}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Monthly spending report</h3>
            <div className="h-[90%] rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(230,238,255,0.7),rgba(255,255,255,0.55))] px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorySpendChartData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e3f6" />
                  <XAxis type="number" stroke="#5b678a" tickFormatter={currencyAxisFormatter} />
                  <YAxis type="category" dataKey="name" width={150} stroke="#5b678a" tickLine={false} axisLine={false} />
                  <Tooltip formatter={currencyTooltipFormatter} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={26}>
                    {categorySpendChartData.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={entry.color} />)}
                    <LabelList dataKey="value" position="right" formatter={(value: number | string) => formatMoney(value)} className="fill-slate-700 text-xs font-medium" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className={`h-80 ${softPanelClass}`}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Income vs expense trend</h3>
            <div className="h-[90%] rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(230,238,255,0.7),rgba(255,255,255,0.55))] px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.incomeVsExpense}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e3f6" />
                  <XAxis dataKey="month" stroke="#5b678a" />
                  <YAxis stroke="#5b678a" tickFormatter={currencyAxisFormatter} />
                  <Tooltip formatter={currencyTooltipFormatter} />
                  <Line dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className={`h-80 ${softPanelClass}`}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Savings rate trend</h3>
            <div className="h-[90%] rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(230,238,255,0.7),rgba(255,255,255,0.55))] px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={advanced?.savingsRateTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e3f6" />
                  <XAxis dataKey="period" stroke="#5b678a" />
                  <YAxis stroke="#5b678a" />
                  <Tooltip />
                  <Line dataKey="value" stroke="#335cff" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className={`h-80 ${softPanelClass}`}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Net worth tracking</h3>
            <div className="h-[90%] rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(230,238,255,0.7),rgba(255,255,255,0.55))] px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={advanced?.netWorthTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e3f6" />
                  <XAxis dataKey="period" stroke="#5b678a" />
                  <YAxis stroke="#5b678a" tickFormatter={currencyAxisFormatter} />
                  <Tooltip formatter={currencyTooltipFormatter} />
                  <Line dataKey="value" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className={`h-80 ${softPanelClass}`}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Category trends</h3>
            <div className="h-[90%] rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(230,238,255,0.7),rgba(255,255,255,0.55))] px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e3f6" />
                  <XAxis dataKey="category" stroke="#5b678a" />
                  <YAxis stroke="#5b678a" tickFormatter={currencyAxisFormatter} />
                  <Tooltip formatter={currencyTooltipFormatter} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {categoryTrendData.map((entry, index) => (
                      <Cell key={`${entry.period}-${entry.category}-${index}`} fill={entry.color ?? "#335cff"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className={softPanelClass}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Insight highlights</h3>
            <div className="space-y-3">
              {advanced?.highlights.map((highlight) => (
                <div key={highlight.title} className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{highlight.title}</p>
                    {typeof highlight.percentChange === "number" ? <span className="text-sm text-slate-500">{highlight.percentChange}%</span> : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{highlight.message}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
