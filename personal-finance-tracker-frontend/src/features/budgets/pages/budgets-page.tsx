import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Pencil, PiggyBank, Plus, TriangleAlert } from "lucide-react";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatMonthYear } from "@/utils/format";
import { saveBudget } from "@/features/finance/api/finance-api";
import { toastError, toastSuccess } from "@/components/feedback/toast";
import type { Budget } from "@/types/domain";

const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const pageShellClass =
  "relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(194,214,255,0.42),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,236,211,0.34),transparent_26%),linear-gradient(180deg,#f9fbff_0%,#eef4ff_54%,#f8fbff_100%)] px-4 py-5 sm:px-6";
const softPanelClass =
  "border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.9))] shadow-[0_24px_48px_rgba(45,74,150,0.08)] backdrop-blur";
const accentPanelClass =
  "border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(237,243,255,0.92),rgba(225,236,255,0.9))] shadow-[0_20px_45px_rgba(53,76,153,0.10)]";

function createDraft(source?: Budget): Budget {
  const today = new Date();
  return {
    id: source?.id ?? "",
    categoryId: source?.categoryId ?? "",
    month: source?.month ?? today.getMonth() + 1,
    year: source?.year ?? today.getFullYear(),
    amount: source?.amount ?? 0,
    spent: source?.spent ?? 0,
    alertThresholdPercent: source?.alertThresholdPercent ?? 80,
  };
}

export function BudgetsPage() {
  const { data } = useFinanceData();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Budget>(createDraft());
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: saveBudget,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      toastSuccess(draft.id ? "Budget updated" : "Budget created");
      setDraft(createDraft());
      setOpen(false);
    },
  });

  const expenseCategories = useMemo(
    () => data?.categories.filter((category) => category.type === "expense" && !category.archived) ?? [],
    [data],
  );

  const handleSubmit = () => {
    if (!draft.categoryId) {
      toastError("Category is required");
      return;
    }
    if (draft.amount <= 0) {
      toastError("Budget amount must be greater than 0");
      return;
    }
    const duplicate = data?.budgets.find(
      (budget) =>
        budget.id !== draft.id &&
        budget.categoryId === draft.categoryId &&
        budget.month === draft.month &&
        budget.year === draft.year,
    );
    if (duplicate) {
      toastError("Only one budget per category/month/year is allowed");
      return;
    }
    mutation.mutate({ ...draft, spent: draft.spent ?? 0 });
  };

  const startEdit = (budget: Budget) => {
    setDraft(createDraft(budget));
    setOpen(true);
  };

  const duplicateLastMonth = () => {
    if (!data?.budgets.length) {
      toastError("No existing budget to duplicate");
      return;
    }
    const first = data.budgets[0];
    const nextMonth = first.month === 12 ? 1 : first.month + 1;
    const nextYear = first.month === 12 ? first.year + 1 : first.year;
    setDraft(createDraft({ ...first, id: "", month: nextMonth, year: nextYear }));
    setOpen(true);
  };

  return (
    <div className={pageShellClass}>
      <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[radial-gradient(circle,rgba(125,157,255,0.16),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,215,163,0.14),transparent_70%)] blur-3xl" />

      <div className="relative space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Budgets</h2>
            <p className="text-sm text-slate-600">Create, edit, and review monthly budgets against actual transaction spend.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={duplicateLastMonth}>
              Duplicate last month
            </Button>
            <Button className="gap-2" onClick={() => { setDraft(createDraft()); setOpen(true); }}>
              <Plus size={16} />
              Add budget
            </Button>
          </div>
        </div>

        {!data || !data.budgets.length ? (
          <Card className={softPanelClass}>No budgets yet. Add a monthly budget to start tracking spend versus target.</Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.budgets.map((budget) => {
              const category = data.categories.find((item) => item.id === budget.categoryId);
              const percent = Math.round((budget.spent / budget.amount) * 100);
              return (
                <Card key={budget.id} className={`${softPanelClass} min-w-0`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{category?.name ?? "Category"}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatMonthYear(budget.month, budget.year)} - Alert at {budget.alertThresholdPercent}%
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${percent >= 100 ? "bg-rose-100 text-rose-700" : percent >= 80 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>
                        {percent}%
                      </span>
                      <Button variant="secondary" className="gap-2" onClick={() => startEdit(budget)}>
                        <Pencil size={14} />
                        Edit
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={percent} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? "Edit budget" : "Add budget"}>
        <div className="space-y-4">
          <div className={`rounded-xl px-4 py-3 ${accentPanelClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
                  <PiggyBank size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{draft.id ? "Update budget" : "Create monthly budget"}</p>
                  <p className="text-xs text-slate-600">Pick the category, amount, period, and warning threshold.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-slate-600 shadow-sm">
                  <CalendarClock size={14} />
                  {formatMonthYear(draft.month, draft.year)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-amber-800 shadow-sm">
                  <TriangleAlert size={14} />
                  Alert at {draft.alertThresholdPercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <Select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>
                <option value="">Select category</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Budget amount</label>
              <Input type="number" min={1} step="0.01" value={draft.amount || ""} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} placeholder="Enter amount" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Budget month</label>
              <Select value={String(draft.month)} onChange={(event) => setDraft({ ...draft, month: Number(event.target.value) })}>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Budget year</label>
              <Input type="number" min={2024} value={draft.year} onChange={(event) => setDraft({ ...draft, year: Number(event.target.value) })} placeholder="Enter year" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Alert threshold %</label>
              <Input type="number" min={1} max={200} value={draft.alertThresholdPercent} onChange={(event) => setDraft({ ...draft, alertThresholdPercent: Number(event.target.value) })} placeholder="80 means warn at 80%" />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-3">
            <Button onClick={handleSubmit} disabled={mutation.isPending} className="gap-2">
              <Plus size={16} />
              {draft.id ? "Save budget" : "Create budget"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
