import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { EmptyState, SkeletonCard } from "@/components/feedback/states";
import { getInsights } from "@/features/finance/api/finance-api";

const pageShellClass =
  "relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(194,214,255,0.42),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,236,211,0.34),transparent_26%),linear-gradient(180deg,#f9fbff_0%,#eef4ff_54%,#f8fbff_100%)] px-4 py-5 sm:px-6";
const softPanelClass =
  "border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.9))] shadow-[0_24px_48px_rgba(45,74,150,0.08)] backdrop-blur";

export function InsightsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["insights"], queryFn: getInsights });

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <SkeletonCard key={index} />)}</div>;
  }

  if (!data) {
    return <EmptyState title="Insights unavailable" description="Try again after your finance data finishes syncing." />;
  }

  const gradeTone =
    data.healthScore.grade === "excellent" ? "text-emerald-600" : data.healthScore.grade === "good" ? "text-brand-700" : data.healthScore.grade === "fair" ? "text-amber-600" : "text-rose-600";

  return (
    <div className={pageShellClass}>
      <div className="relative space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Insights</h2>
          <p className="text-sm text-slate-600">Financial health, month-over-month changes, and practical suggestions in one view.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className={softPanelClass}>
            <p className="text-sm font-medium text-slate-500">Financial health score</p>
            <div className="mt-4 flex items-end gap-4">
              <span className={`text-6xl font-semibold tracking-tight ${gradeTone}`}>{data.healthScore.score}</span>
              <div className="pb-2">
                <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${gradeTone}`}>{data.healthScore.grade}</p>
                <p className="mt-1 text-sm text-slate-500">{data.healthScore.changeSummary}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {data.healthScore.factors.map((factor) => (
                <div key={factor.name} className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{factor.name}</p>
                    <span className="text-sm font-medium text-slate-500">{factor.score}/100</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{factor.explanation}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className={softPanelClass}>
            <h3 className="text-lg font-semibold text-slate-900">Suggestions</h3>
            <div className="mt-4 space-y-3">
              {data.healthScore.suggestions.map((suggestion) => (
                <div key={suggestion} className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-slate-700">
                  {suggestion}
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              {data.highlights.map((highlight) => (
                <div key={highlight.title} className="rounded-2xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,245,255,0.92))] px-4 py-4">
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

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className={softPanelClass}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Savings rate trend</h3>
            <div className="h-72 rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(230,238,255,0.7),rgba(255,255,255,0.55))] px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.savingsRateTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e3f6" />
                  <XAxis dataKey="period" stroke="#5b678a" />
                  <YAxis stroke="#5b678a" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#335cff" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className={softPanelClass}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Income vs expense</h3>
            <div className="h-72 rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(230,238,255,0.7),rgba(255,255,255,0.55))] px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.incomeVsExpenseTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e3f6" />
                  <XAxis dataKey="period" stroke="#5b678a" />
                  <YAxis stroke="#5b678a" />
                  <Tooltip />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
