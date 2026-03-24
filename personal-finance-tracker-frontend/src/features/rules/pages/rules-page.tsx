import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { deleteRule, getRules, saveRule, toggleRule } from "@/features/finance/api/finance-api";
import { toastError, toastSuccess } from "@/components/feedback/toast";
import type { Rule } from "@/types/domain";

const pageShellClass =
  "relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(194,214,255,0.42),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,236,211,0.34),transparent_26%),linear-gradient(180deg,#f9fbff_0%,#eef4ff_54%,#f8fbff_100%)] px-4 py-5 sm:px-6";
const softPanelClass =
  "border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.9))] shadow-[0_24px_48px_rgba(45,74,150,0.08)] backdrop-blur";

const conditionFields = ["merchant", "amount", "category", "note", "paymentMethod", "transactionType", "tags", "account"];
const operators = ["equals", "not_equals", "contains", "starts_with", "greater_than", "greater_than_or_equal", "less_than", "less_than_or_equal", "in"];
const actionTypes = ["set_category", "add_tag", "trigger_alert", "mark_review"];

function createDraft(): Rule {
  return {
    id: "",
    name: "",
    condition: { field: "merchant", operator: "equals", value: "" },
    action: { type: "mark_review", value: "" },
    priority: 0,
    isActive: true,
    summary: "",
  };
}

export function RulesPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["rules"], queryFn: getRules });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Rule>(createDraft());

  const saveMutation = useMutation({
    mutationFn: saveRule,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rules"] });
      toastSuccess("Rule saved");
      setDraft(createDraft());
      setOpen(false);
    },
    onError: (error) => {
      toastError(error instanceof Error ? error.message : "Unable to save rule");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleRule,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRule,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rules"] });
      toastSuccess("Rule deleted");
    },
  });

  const preview = useMemo(() => {
    const conditionValue = draft.condition.value || (draft.condition.values ?? []).join(", ");
    return `When ${draft.condition.field} ${draft.condition.operator.replace(/_/g, " ")} ${conditionValue || "..."}, ${draft.action.type.replace(/_/g, " ")} ${draft.action.value || ""}`.trim();
  }, [draft]);

  const handleSave = () => {
    if (!draft.name.trim()) {
      toastError("Rule name is required");
      return;
    }

    saveMutation.mutate({
      id: draft.id,
      name: draft.name.trim(),
      condition: {
        ...draft.condition,
        values: draft.condition.operator === "in" ? (draft.condition.value ?? "").split(",").map((item) => item.trim()).filter(Boolean) : undefined,
      },
      action: draft.action,
      priority: draft.priority,
      isActive: draft.isActive,
    });
  };

  return (
    <div className={pageShellClass}>
      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Rules Engine</h2>
            <p className="text-sm text-slate-600">Automate categorization, review flags, and lightweight alerts when transactions match your conditions.</p>
          </div>
          <Button onClick={() => { setDraft(createDraft()); setOpen(true); }}>New rule</Button>
        </div>

        <div className="grid gap-4">
          {data?.map((rule) => (
            <Card key={rule.id} className={softPanelClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{rule.name}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${rule.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {rule.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{rule.summary}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">Priority {rule.priority}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => { setDraft(rule); setOpen(true); }}>Edit</Button>
                  <Button variant="ghost" onClick={() => toggleMutation.mutate(rule.id)}>{rule.isActive ? "Disable" : "Enable"}</Button>
                  <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => deleteMutation.mutate(rule.id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
          {!data?.length ? <Card className={softPanelClass}>No rules yet. Create one to automate repetitive transaction cleanup.</Card> : null}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? "Edit rule" : "Create rule"}>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Rule name</label>
            <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Uber to Transport" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Field</label>
              <Select value={draft.condition.field} onChange={(event) => setDraft({ ...draft, condition: { ...draft.condition, field: event.target.value } })}>
                {conditionFields.map((field) => <option key={field} value={field}>{field}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Operator</label>
              <Select value={draft.condition.operator} onChange={(event) => setDraft({ ...draft, condition: { ...draft.condition, operator: event.target.value } })}>
                {operators.map((operator) => <option key={operator} value={operator}>{operator.replace(/_/g, " ")}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Condition value</label>
            <Input value={draft.condition.value ?? ""} onChange={(event) => setDraft({ ...draft, condition: { ...draft.condition, value: event.target.value } })} placeholder="Uber or 5000" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Action</label>
              <Select value={draft.action.type} onChange={(event) => setDraft({ ...draft, action: { ...draft.action, type: event.target.value } })}>
                {actionTypes.map((action) => <option key={action} value={action}>{action.replace(/_/g, " ")}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Action value</label>
              <Input value={draft.action.value ?? ""} onChange={(event) => setDraft({ ...draft, action: { ...draft.action, value: event.target.value } })} placeholder="Transport or monthly-food" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
              <Input type="number" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: Number(event.target.value) })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <Select value={draft.isActive ? "active" : "inactive"} onChange={(event) => setDraft({ ...draft, isActive: event.target.value === "active" })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-brand-50/70 px-4 py-3 text-sm text-brand-900">
            {preview}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>Save rule</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
