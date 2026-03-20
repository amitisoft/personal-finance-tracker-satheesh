import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getReports } from "@/features/finance/api/finance-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const pageShellClass =
  "relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(194,214,255,0.42),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,236,211,0.34),transparent_26%),linear-gradient(180deg,#f9fbff_0%,#eef4ff_54%,#f8fbff_100%)] px-4 py-5 sm:px-6";
const softPanelClass =
  "border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.9))] shadow-[0_24px_48px_rgba(45,74,150,0.08)] backdrop-blur";

export function ReportsPage() {
  const { data } = useQuery({ queryKey: ["reports"], queryFn: getReports });

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
        <div className="grid gap-4">
          <Card className={`h-80 ${softPanelClass}`}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Monthly spending report</h3>
            <div className="h-[90%] rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(230,238,255,0.7),rgba(255,255,255,0.55))] px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.categorySpend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e3f6" />
                  <XAxis dataKey="name" stroke="#5b678a" />
                  <YAxis stroke="#5b678a" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {data?.categorySpend.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
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
                  <YAxis stroke="#5b678a" />
                  <Tooltip />
                  <Line dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
