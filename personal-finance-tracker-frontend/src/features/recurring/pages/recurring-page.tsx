import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Landmark,
  PauseCircle,
  Pencil,
  Play,
  Plus,
  Repeat,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/utils/format";
import { saveRecurring } from "@/features/finance/api/finance-api";
import { toastError, toastSuccess } from "@/components/feedback/toast";
import type { RecurringTransaction } from "@/types/domain";

function createDraft(source?: RecurringTransaction): RecurringTransaction {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: source?.id ?? "",
    title: source?.title ?? "",
    type: source?.type ?? "expense",
    amount: source?.amount ?? 0,
    categoryId: source?.categoryId ?? "",
    accountId: source?.accountId ?? "",
    frequency: source?.frequency ?? "monthly",
    startDate: source?.startDate ?? today,
    endDate: source?.endDate,
    nextRunDate: source?.nextRunDate ?? today,
    autoCreateTransaction: source?.autoCreateTransaction ?? true,
    paused: source?.paused ?? false,
  };
}

function getRecurringTone(type: RecurringTransaction["type"]) {
  switch (type) {
    case "income":
      return {
        shell: "border-emerald-100 bg-emerald-50/40",
        hero: "from-emerald-500 via-emerald-500 to-teal-500",
        accent: "bg-emerald-500",
        Icon: TrendingUp,
        typeLabel: "Income recurring item",
      };
    case "transfer":
      return {
        shell: "border-sky-100 bg-sky-50/40",
        hero: "from-sky-500 via-blue-500 to-indigo-500",
        accent: "bg-sky-500",
        Icon: ArrowLeftRight,
        typeLabel: "Transfer recurring item",
      };
    default:
      return {
        shell: "border-orange-100 bg-orange-50/40",
        hero: "from-orange-500 via-amber-500 to-rose-500",
        accent: "bg-orange-500",
        Icon: TrendingDown,
        typeLabel: "Expense recurring item",
      };
  }
}

export function RecurringPage() {
  const { data } = useFinanceData();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<RecurringTransaction>(createDraft());
  const [open, setOpen] = useState(false);

  const recurringItems = useMemo(() => data?.recurring ?? [], [data]);
  const availableCategories = useMemo(
    () =>
      (data?.categories ?? []).filter(
        (category) => !category.archived && (draft.type === "expense" ? category.type === "expense" : draft.type === "income" ? category.type === "income" : true),
      ),
    [data, draft.type],
  );

  const summary = useMemo(() => {
    const activeItems = recurringItems.filter((item) => !item.paused);
    return {
      total: recurringItems.length,
      paused: recurringItems.filter((item) => item.paused).length,
      scheduled: activeItems.reduce((sum, item) => sum + item.amount, 0),
    };
  }, [recurringItems]);

  const mutation = useMutation({
    mutationFn: saveRecurring,
    onSuccess: async (_, item) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      toastSuccess(item.id ? "Recurring item updated" : "Recurring item created");
      setDraft(createDraft());
      setOpen(false);
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const detail = (error.response?.data as { message?: string; detail?: string } | undefined)?.message ?? (error.response?.data as { detail?: string } | undefined)?.detail;
        toastError(detail ?? "Unable to save recurring item");
        return;
      }
      toastError("Unable to save recurring item");
    },
  });

  const handleSave = () => {
    if (!draft.title.trim()) {
      toastError("Recurring title is required");
      return;
    }
    if (!draft.accountId) {
      toastError("Account is required");
      return;
    }
    if (draft.type !== "transfer" && !draft.categoryId) {
      toastError("Category is required");
      return;
    }
    if (draft.amount <= 0) {
      toastError("Amount must be greater than 0");
      return;
    }
    if (!draft.startDate || !draft.nextRunDate) {
      toastError("Start date and next run date are required");
      return;
    }

    mutation.mutate({
      ...draft,
      categoryId: draft.type === "transfer" ? undefined : draft.categoryId || undefined,
      endDate: draft.endDate || undefined,
    });
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.75rem] border border-blue-200 bg-[radial-gradient(circle_at_top_left,rgba(194,214,255,0.38),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,236,211,0.18),transparent_24%),linear-gradient(180deg,#f9fbff_0%,#eef4ff_58%,#f7fbff_100%)] p-4 text-slate-900 shadow-[0_24px_70px_-46px_rgba(55,97,210,0.26)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-brand-700/80 sm:text-[11px]">Recurring planner</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Recurring transactions</h2>
            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-700 sm:text-sm">
              Keep subscriptions, bills, salary inflows, and repeating transfers in one place with a cleaner, card-first operating view.
            </p>
          </div>
          <Button
            variant="secondary"
            className="gap-2 border border-brand-200 bg-[linear-gradient(135deg,_#1c2f73,_#3158d8)] px-4 py-2 text-sm font-semibold !text-white shadow-[0_14px_28px_-18px_rgba(28,47,115,0.55)] hover:!bg-[linear-gradient(135deg,_#16265e,_#274cc4)]"
            onClick={() => {
              setDraft(createDraft());
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Add recurring
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { label: "Entries", value: summary.total, Icon: Repeat },
            { label: "Scheduled total", value: formatCurrency(summary.scheduled), Icon: CircleDollarSign },
            { label: "Paused items", value: summary.paused, Icon: PauseCircle },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="rounded-[1.25rem] border border-blue-200/90 bg-white/70 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-brand-700">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900 sm:text-[2rem]">{value}</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Icon size={20} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {recurringItems.length ? (
          recurringItems.map((item) => {
            const tone = getRecurringTone(item.type);
            const accountName = data?.accounts.find((account) => account.id === item.accountId)?.name ?? "Unassigned";
            const categoryName = item.categoryId ? data?.categories.find((category) => category.id === item.categoryId)?.name ?? "Unknown" : "Not required";
            const ToneIcon = tone.Icon;

            return (
              <Card key={item.id} className={`overflow-hidden border ${tone.shell} p-0 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.42)]`}>
                <div className={`bg-gradient-to-r ${tone.hero} px-3.5 py-3 text-white`}>
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/18 backdrop-blur-sm">
                        <ToneIcon size={16} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white/18 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/90">
                            {item.frequency}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${item.paused ? "bg-slate-900/30 text-slate-100" : "bg-emerald-100/20 text-emerald-50"}`}>
                            {item.paused ? "Paused" : "Active"}
                          </span>
                        </div>
                        <h3 className="mt-2 truncate text-xl font-semibold tracking-tight">{item.title}</h3>
                        <p className="mt-1 text-xs text-white/80">{tone.typeLabel}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[9px] uppercase tracking-[0.26em] text-white/70">Amount</p>
                      <p className="mt-1 text-xl font-semibold leading-none">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 px-3.5 py-3.5">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {[
                      { label: "Next run", value: formatDate(item.nextRunDate), Icon: CalendarClock },
                      { label: "Account", value: accountName, Icon: Landmark },
                      { label: "Category", value: categoryName, Icon: CircleDollarSign },
                      { label: "Auto-create", value: item.autoCreateTransaction ? "Enabled" : "Disabled", Icon: CheckCircle2 },
                    ].map(({ label, value, Icon }) => (
                      <div key={label} className="rounded-lg border border-slate-100 bg-white/85 px-3 py-2.5 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Icon size={13} />
                          <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">{label}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${tone.accent}`} />
                      {item.autoCreateTransaction ? "Auto-processing is enabled." : "Manual review required before creation."}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        className="gap-2 rounded-xl border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                        onClick={() => {
                          setDraft(item);
                          setOpen(true);
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        className="gap-2 rounded-xl border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                        onClick={() => mutation.mutate({ ...item, paused: !item.paused })}
                      >
                        {item.paused ? <Play size={14} /> : <PauseCircle size={14} />}
                        {item.paused ? "Resume" : "Pause"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="md:col-span-2 xl:col-span-3 2xl:col-span-4 border border-dashed border-slate-200 bg-white/80 px-6 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Repeat size={24} />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">No recurring items yet</h3>
            <p className="mt-2 text-sm text-slate-500">Create your first recurring entry to track subscriptions, salary, rent, or repeating transfers.</p>
            <Button
              className="mt-5 gap-2"
              onClick={() => {
                setDraft(createDraft());
                setOpen(true);
              }}
            >
              <Plus size={16} />
              Add recurring
            </Button>
          </Card>
        )}
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? "Edit recurring" : "Add recurring"}>
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
                <CalendarClock size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{draft.id ? "Update recurring item" : "Create a recurring item"}</p>
                <p className="text-xs text-slate-600">Set the schedule, linked account, and transaction type for the repeated entry.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
              <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Netflix subscription" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Type</label>
              <Select
                value={draft.type}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    type: event.target.value as RecurringTransaction["type"],
                    categoryId: event.target.value === "transfer" ? "" : draft.categoryId,
                  })
                }
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Amount</label>
              <Input type="number" min={0.01} step="0.01" value={draft.amount || ""} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} placeholder="999" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Account</label>
              <Select value={draft.accountId} onChange={(event) => setDraft({ ...draft, accountId: event.target.value })}>
                <option value="">Select account</option>
                {data?.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <Select value={draft.categoryId ?? ""} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })} disabled={draft.type === "transfer"}>
                <option value="">{draft.type === "transfer" ? "Not needed for transfer" : "Select category"}</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Frequency</label>
              <Select value={draft.frequency} onChange={(event) => setDraft({ ...draft, frequency: event.target.value as RecurringTransaction["frequency"] })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Start date</label>
              <Input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Next run date</label>
              <Input type="date" value={draft.nextRunDate} onChange={(event) => setDraft({ ...draft, nextRunDate: event.target.value })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">End date</label>
              <Input type="date" value={draft.endDate ?? ""} onChange={(event) => setDraft({ ...draft, endDate: event.target.value || undefined })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Auto-create transaction</label>
              <Select value={draft.autoCreateTransaction ? "yes" : "no"} onChange={(event) => setDraft({ ...draft, autoCreateTransaction: event.target.value === "yes" })}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-3">
            <Button onClick={handleSave} disabled={mutation.isPending} className="gap-2">
              <Plus size={16} />
              {draft.id ? "Save recurring" : "Create recurring"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

