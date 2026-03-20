import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Landmark, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";
import { saveAccount } from "@/features/finance/api/finance-api";
import { toastError, toastSuccess } from "@/components/feedback/toast";
import { formatCurrency } from "@/utils/format";
import type { Account } from "@/types/domain";

const accountTypes: Account["type"][] = ["bank account", "cash wallet", "savings account", "credit card"];
const pageShellClass =
  "relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(194,214,255,0.42),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,236,211,0.34),transparent_26%),linear-gradient(180deg,#f9fbff_0%,#eef4ff_54%,#f8fbff_100%)] px-4 py-5 sm:px-6";
const softPanelClass =
  "border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.9))] shadow-[0_24px_48px_rgba(45,74,150,0.08)] backdrop-blur";
const accentPanelClass =
  "border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(237,243,255,0.92),rgba(225,236,255,0.9))] shadow-[0_20px_45px_rgba(53,76,153,0.10)]";

type AccountDraft = Omit<Account, "id">;

function createDraft(): AccountDraft {
  return {
    name: "",
    type: "bank account",
    balance: 0,
  };
}

export function AccountsPage() {
  const { data } = useFinanceData();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<AccountDraft>(createDraft());
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: saveAccount,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      toastSuccess("Account created");
      setDraft(createDraft());
      setOpen(false);
    },
    onError: (error) => {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      toastError(apiMessage || "Unable to create account");
    },
  });

  const handleSave = () => {
    if (!draft.name.trim()) {
      toastError("Account name is required");
      return;
    }

    mutation.mutate({
      name: draft.name.trim(),
      type: draft.type,
      balance: draft.balance,
    });
  };

  return (
    <div className={pageShellClass}>
      <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[radial-gradient(circle,rgba(125,157,255,0.16),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,215,163,0.14),transparent_70%)] blur-3xl" />

      <div className="relative space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Accounts</h2>
            <p className="max-w-xl text-sm text-slate-600">Track balances across bank, savings, wallet, and credit accounts.</p>
          </div>
          <Button className="gap-2 self-start sm:self-auto" onClick={() => setOpen(true)}>
            <Plus size={16} />
            Add account
          </Button>
        </div>

        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.accounts.map((account) => (
            <Card key={account.id} className={`${softPanelClass} p-4 sm:p-5`}>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{account.type}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">{account.name}</h3>
              <p className="mt-4 text-2xl font-semibold text-brand-700 sm:text-3xl">{formatCurrency(account.balance)}</p>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add account">
        <div className="space-y-4">
          <div className={`rounded-xl px-4 py-3 ${accentPanelClass}`}>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
                <Landmark size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Create a new account</p>
                <p className="text-xs text-slate-600">Add a bank account, wallet, savings bucket, or card to track its balance.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Account name</label>
              <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Travel Savings" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Account type</label>
              <Select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as Account["type"] })}>
                {accountTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Opening balance</label>
              <Input type="number" value={draft.balance || ""} onChange={(event) => setDraft({ ...draft, balance: Number(event.target.value) })} placeholder="45000" />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-3">
            <Button onClick={handleSave} disabled={mutation.isPending} className="gap-2">
              <Plus size={16} />
              Create account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
