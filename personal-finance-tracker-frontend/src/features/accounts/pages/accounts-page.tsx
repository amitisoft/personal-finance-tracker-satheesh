import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";
import {
  acceptAccountInvitation,
  declineAccountInvitation,
  getAccountMembers,
  getPendingAccountInvitations,
  inviteAccountMember,
  removeAccountMember,
  saveAccount,
  updateAccountMember,
} from "@/features/finance/api/finance-api";
import { toastError, toastSuccess } from "@/components/feedback/toast";
import { useAuthStore } from "@/store/auth-store";
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
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<AccountDraft>(createDraft());
  const [open, setOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteDraft, setInviteDraft] = useState({ email: "", role: "viewer" });
  const [activityPage, setActivityPage] = useState(1);

  const selectedAccount = data?.accounts.find((account) => account.id === selectedAccountId) ?? data?.accounts[0];
  const invitationsQuery = useQuery({ queryKey: ["pending-account-invitations"], queryFn: getPendingAccountInvitations });

  const membersQuery = useQuery({
    queryKey: ["account-members", selectedAccount?.id],
    queryFn: () => getAccountMembers(selectedAccount!.id),
    enabled: Boolean(selectedAccount?.id),
  });
  const ownerMember = membersQuery.data?.members.find((member) => member.isOwner);
  const isCurrentUserOwner = ownerMember?.userId === currentUser?.id;
  const activityPageSize = 5;
  const activityItems = membersQuery.data?.activity ?? [];
  const activityTotalPages = Math.max(1, Math.ceil(activityItems.length / activityPageSize));
  const paginatedActivity = useMemo(() => {
    const startIndex = (activityPage - 1) * activityPageSize;
    return activityItems.slice(startIndex, startIndex + activityPageSize);
  }, [activityItems, activityPage]);

  useEffect(() => {
    setActivityPage(1);
  }, [selectedAccount?.id]);

  useEffect(() => {
    setActivityPage((page) => Math.min(page, activityTotalPages));
  }, [activityTotalPages]);

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

  const inviteMutation = useMutation({
    mutationFn: ({ accountId, payload }: { accountId: string; payload: typeof inviteDraft }) => inviteAccountMember(accountId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["account-members", selectedAccount?.id] });
      toastSuccess("Invitation created");
      setInviteDraft({ email: "", role: "viewer" });
      setInviteOpen(false);
    },
    onError: (error) => {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      toastError(apiMessage || "Unable to invite member");
    },
  });

  const memberMutation = useMutation({
    mutationFn: ({ accountId, userId, role }: { accountId: string; userId: string; role: string }) => updateAccountMember(accountId, userId, { role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["account-members", selectedAccount?.id] });
      toastSuccess("Member updated");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ accountId, userId }: { accountId: string; userId: string }) => removeAccountMember(accountId, userId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["account-members", selectedAccount?.id] }),
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      toastSuccess("Access updated");
    },
  });

  const invitationDecisionMutation = useMutation({
    mutationFn: ({ accountId, decision }: { accountId: string; decision: "accept" | "decline" }) =>
      decision === "accept" ? acceptAccountInvitation(accountId) : declineAccountInvitation(accountId),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pending-account-invitations"] }),
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      toastSuccess(variables.decision === "accept" ? "Invitation accepted" : "Invitation declined");
    },
    onError: (error) => {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      toastError(apiMessage || "Unable to update invitation");
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
            <Card key={account.id} className={`${softPanelClass} p-4 sm:p-5 ${selectedAccount?.id === account.id ? "ring-2 ring-brand-300" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{account.type}</p>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                    account.accessRole === "owner"
                      ? "bg-brand-100 text-brand-700"
                      : account.accessRole === "editor"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {account.accessRole ?? "owner"}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">{account.name}</h3>
              <p className="mt-4 text-2xl font-semibold text-brand-700 sm:text-3xl">{formatCurrency(account.balance)}</p>
              {account.accessRole === "viewer" ? (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Read-only access. You can view this shared account but cannot modify its transactions.
                </p>
              ) : null}
              <Button variant="secondary" className="mt-4" onClick={() => setSelectedAccountId(account.id)}>Manage sharing</Button>
            </Card>
          ))}
        </div>

        {invitationsQuery.data?.length ? (
          <Card className={`${softPanelClass} p-4 sm:p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Pending invitations</h3>
                <p className="text-sm text-slate-500">Accept or decline shared-account access invitations sent to your email.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {invitationsQuery.data.map((invitation) => (
                <div key={invitation.id} className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{invitation.accountName}</p>
                      <p className="text-sm text-slate-500">
                        Invited by {invitation.invitedByName} as {invitation.role}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => invitationDecisionMutation.mutate({ accountId: invitation.accountId, decision: "decline" })}
                        disabled={invitationDecisionMutation.isPending}
                      >
                        Decline
                      </Button>
                      <Button
                        onClick={() => invitationDecisionMutation.mutate({ accountId: invitation.accountId, decision: "accept" })}
                        disabled={invitationDecisionMutation.isPending}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {selectedAccount ? (
          <Card className={`${softPanelClass} p-4 sm:p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Shared with</h3>
                <p className="text-sm text-slate-500">{selectedAccount.name} member access and recent shared activity.</p>
              </div>
              {isCurrentUserOwner ? <Button onClick={() => setInviteOpen(true)}>Invite member</Button> : null}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-3">
                {membersQuery.data?.members.map((member) => (
                  <div key={`${member.email}-${member.userId ?? "pending"}`} className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{member.displayName}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{member.status}</span>
                        {member.isOwner ? (
                          <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">owner</span>
                        ) : member.userId && isCurrentUserOwner ? (
                          <>
                            <Select value={member.role} onChange={(event) => memberMutation.mutate({ accountId: selectedAccount.id, userId: member.userId!, role: event.target.value })}>
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </Select>
                            <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => removeMemberMutation.mutate({ accountId: selectedAccount.id, userId: member.userId! })}>
                              Remove
                            </Button>
                          </>
                        ) : member.userId === currentUser?.id ? (
                          <Button
                            variant="ghost"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => removeMemberMutation.mutate({ accountId: selectedAccount.id, userId: member.userId! })}
                          >
                            Leave shared account
                          </Button>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">{member.role}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Activity</h4>
                {paginatedActivity.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(243,247,255,0.88))] px-4 py-3">
                    <p className="font-medium text-slate-800">{item.actorName}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.actionType.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {activityItems.length > activityPageSize ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-slate-600">
                    <span>
                      Page {activityPage} of {activityTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => setActivityPage((page) => Math.max(1, page - 1))} disabled={activityPage === 1}>
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setActivityPage((page) => Math.min(activityTotalPages, page + 1))}
                        disabled={activityPage === activityTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        ) : null}
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

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite member">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <Input value={inviteDraft.email} onChange={(event) => setInviteDraft((current) => ({ ...current, email: event.target.value }))} placeholder="family@example.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
            <Select value={inviteDraft.role} onChange={(event) => setInviteDraft((current) => ({ ...current, role: event.target.value }))}>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedAccount && inviteMutation.mutate({ accountId: selectedAccount.id, payload: inviteDraft })}
              disabled={inviteMutation.isPending || !selectedAccount}
            >
              Send invite
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
