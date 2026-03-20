import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, PiggyBank, Plus, Target, Trash2 } from "lucide-react";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/utils/format";
import { removeGoal, saveGoal } from "@/features/finance/api/finance-api";
import { toastError, toastSuccess } from "@/components/feedback/toast";
import type { Goal } from "@/types/domain";

const pageShellClass =
  "relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(194,214,255,0.42),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,236,211,0.34),transparent_26%),linear-gradient(180deg,#f9fbff_0%,#eef4ff_54%,#f8fbff_100%)] px-4 py-5 sm:px-6";
const softPanelClass =
  "border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.9))] shadow-[0_24px_48px_rgba(45,74,150,0.08)] backdrop-blur";
const accentPanelClass =
  "border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(237,243,255,0.92),rgba(225,236,255,0.9))] shadow-[0_20px_45px_rgba(53,76,153,0.10)]";

function createDraft(source?: Goal): Goal {
  const nextYear = new Date().getFullYear() + 1;
  return {
    id: source?.id ?? "",
    name: source?.name ?? "",
    targetAmount: source?.targetAmount ?? 0,
    currentAmount: source?.currentAmount ?? 0,
    targetDate: source?.targetDate ?? `${nextYear}-12-31`,
    linkedAccountId: source?.linkedAccountId ?? "",
    icon: source?.icon ?? "Target",
    color: source?.color ?? "#335cff",
    status: source?.status ?? "active",
  };
}

export function GoalsPage() {
  const { data } = useFinanceData();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Goal>(createDraft());
  const [open, setOpen] = useState(false);

  const saveMutation = useMutation({
    mutationFn: saveGoal,
    onSuccess: async (_, goal) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      toastSuccess(goal.id ? "Goal updated" : "Goal created");
      setDraft(createDraft());
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removeGoal,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      toastSuccess("Goal deleted");
      setDraft(createDraft());
    },
  });

  const handleSave = () => {
    if (!draft.name.trim()) {
      toastError("Goal name is required");
      return;
    }
    if (draft.targetAmount <= 0) {
      toastError("Target amount must be greater than 0");
      return;
    }
    if (draft.currentAmount < 0) {
      toastError("Current amount cannot be negative");
      return;
    }
    if (!draft.targetDate) {
      toastError("Target date is required");
      return;
    }

    saveMutation.mutate({
      ...draft,
      status: draft.currentAmount >= draft.targetAmount ? "completed" : draft.status,
      linkedAccountId: draft.linkedAccountId || undefined,
    });
  };

  const goalCards = useMemo(() => data?.goals ?? [], [data]);

  return (
    <div className={pageShellClass}>
      <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[radial-gradient(circle,rgba(125,157,255,0.16),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,215,163,0.14),transparent_70%)] blur-3xl" />

      <div className="relative space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Savings goals</h2>
            <p className="text-sm text-slate-600">Track targets, link each goal to where the money is kept, and manage progress over time.</p>
          </div>
          <Button className="gap-2" onClick={() => { setDraft(createDraft()); setOpen(true); }}>
            <Plus size={16} />
            Add goal
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {goalCards.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const linkedAccount = data?.accounts.find((account) => account.id === goal.linkedAccountId);
            return (
              <Card key={goal.id} className={`${softPanelClass} border-white/70`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{goal.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">Due {formatDate(goal.targetDate)}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{linkedAccount ? `Funds kept in ${linkedAccount.name}` : "No linked account selected"}</p>
                  </div>
                  <Badge tone={goal.status === "completed" ? "green" : "blue"}>{goal.status}</Badge>
                </div>
                <div className="mt-4">
                  <Progress value={percent} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => saveMutation.mutate({ ...goal, currentAmount: Math.min(goal.targetAmount, goal.currentAmount + 5000), status: Math.min(goal.targetAmount, goal.currentAmount + 5000) >= goal.targetAmount ? "completed" : goal.status })}>
                    Add contribution
                  </Button>
                  <Button variant="secondary" className="gap-2" onClick={() => { setDraft(goal); setOpen(true); }}>
                    <Pencil size={14} />
                    Edit
                  </Button>
                  <Button variant="secondary" className="gap-2" onClick={() => saveMutation.mutate({ ...goal, status: "completed", currentAmount: goal.targetAmount })}>
                    <Target size={14} />
                    Mark complete
                  </Button>
                  <Button
                    variant="danger"
                    className="gap-2"
                    onClick={() => {
                      const confirmed = window.confirm(`Delete goal "${goal.name}"? This action cannot be undone.`);
                      if (confirmed) {
                        deleteMutation.mutate(goal.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? "Edit goal" : "Add goal"}>
        <div className="space-y-4">
          <div className={`rounded-xl px-4 py-3 ${accentPanelClass}`}>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
                <PiggyBank size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{draft.id ? "Update goal" : "Create a new goal"}</p>
                <p className="text-xs text-slate-600">Pick the target, current saved amount, and where this money is kept.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Goal name</label>
              <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Emergency Fund" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Target amount</label>
              <Input type="number" min={1} value={draft.targetAmount || ""} onChange={(event) => setDraft({ ...draft, targetAmount: Number(event.target.value) })} placeholder="300000" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Currently saved</label>
              <Input type="number" min={0} value={draft.currentAmount || ""} onChange={(event) => setDraft({ ...draft, currentAmount: Number(event.target.value) })} placeholder="50000" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Target date</label>
              <Input type="date" value={draft.targetDate} onChange={(event) => setDraft({ ...draft, targetDate: event.target.value })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Where is this money kept?</label>
              <Select value={draft.linkedAccountId ?? ""} onChange={(event) => setDraft({ ...draft, linkedAccountId: event.target.value })}>
                <option value="">Select account</option>
                {data?.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <Select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Goal["status"] })}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-3">
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
              <Plus size={16} />
              {draft.id ? "Save goal" : "Create goal"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
