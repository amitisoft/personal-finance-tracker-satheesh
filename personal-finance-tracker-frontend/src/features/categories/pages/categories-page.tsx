import { useMemo, useState } from "react";
import axios from "axios";
import { Plus, Search, Pencil, Trash2, Tag, UtensilsCrossed, CarFront, BusFront, Fuel, Home, ShoppingBag, CreditCard, Landmark, Wallet, PiggyBank, BadgeIndianRupee, CircleDollarSign, BriefcaseBusiness, TrendingUp, Plane, FerrisWheel, Film, Smartphone, HeartPulse, ShieldCheck, GraduationCap, type LucideIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";
import { removeCategory, saveCategory } from "@/features/finance/api/finance-api";
import { toastError, toastSuccess } from "@/components/feedback/toast";
import { useAuthStore } from "@/store/auth-store";
import type { Category, CategoryType } from "@/types/domain";

type DisplayCategory = Category & { systemGenerated?: boolean; helperText?: string };

const CATEGORY_ICONS: Array<{ name: string; icon: LucideIcon }> = [
  { name: "Tag", icon: Tag },
  { name: "UtensilsCrossed", icon: UtensilsCrossed },
  { name: "CarFront", icon: CarFront },
  { name: "BusFront", icon: BusFront },
  { name: "Fuel", icon: Fuel },
  { name: "Home", icon: Home },
  { name: "ShoppingBag", icon: ShoppingBag },
  { name: "CreditCard", icon: CreditCard },
  { name: "Landmark", icon: Landmark },
  { name: "Wallet", icon: Wallet },
  { name: "PiggyBank", icon: PiggyBank },
  { name: "BadgeIndianRupee", icon: BadgeIndianRupee },
  { name: "CircleDollarSign", icon: CircleDollarSign },
  { name: "BriefcaseBusiness", icon: BriefcaseBusiness },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "Plane", icon: Plane },
  { name: "FerrisWheel", icon: FerrisWheel },
  { name: "Film", icon: Film },
  { name: "Smartphone", icon: Smartphone },
  { name: "HeartPulse", icon: HeartPulse },
  { name: "ShieldCheck", icon: ShieldCheck },
  { name: "GraduationCap", icon: GraduationCap },
];

const CATEGORY_ICON_MAP = Object.fromEntries(CATEGORY_ICONS.map((item) => [item.name, item.icon])) as Record<string, LucideIcon>;

const emptyDraft = (type: CategoryType): Category => ({
  id: "",
  name: "",
  color: type === "expense" ? "#3b82f6" : "#16a34a",
  icon: "Tag",
  type,
  archived: false,
});

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
  return apiMessage || (error instanceof Error ? error.message : fallback);
}

function CategoryGlyph({ icon, size = 18 }: { icon: string; color: string; size?: number }) {
  const Icon = CATEGORY_ICON_MAP[icon] ?? Tag;
  return <Icon color="currentColor" size={size} />;
}

function CategoryModal({
  open,
  title,
  draft,
  onClose,
  onChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  title: string;
  draft: Category;
  onClose: () => void;
  onChange: (next: Category) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  const [iconSearch, setIconSearch] = useState("");
  const filteredIcons = useMemo(() => {
    const normalized = iconSearch.trim().toLowerCase();
    if (!normalized) return CATEGORY_ICONS;
    return CATEGORY_ICONS.filter((item) => item.name.toLowerCase().includes(normalized));
  }, [iconSearch]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Category name</label>
            <Input value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} placeholder="Transport" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Color</label>
            <Input type="color" value={draft.color} onChange={(event) => onChange({ ...draft, color: event.target.value })} className="h-11 p-1" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: draft.color }}>
              <CategoryGlyph icon={draft.icon} color={draft.color} size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Selected icon</p>
              <p className="text-xs text-slate-500">{draft.icon}</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Search icon</label>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Search size={16} className="text-slate-400" />
              <Input
                value={iconSearch}
                onChange={(event) => setIconSearch(event.target.value)}
                placeholder="Search available icons"
                className="border-0 bg-transparent p-0 shadow-none ring-0 focus:border-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="mt-4 grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {filteredIcons.map((item) => {
              const active = draft.icon === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => onChange({ ...draft, icon: item.name })}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${active ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: draft.color }}>
                    <CategoryGlyph icon={item.name} color={draft.color} size={18} />
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} disabled={pending} className="gap-2">
            <Plus size={16} />
            {draft.id ? "Save category" : "Create category"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CategorySection({ title, type, categories, onAdd, onEdit, onToggleArchive, onDelete }: {
  title: string;
  type: CategoryType;
  categories: DisplayCategory[];
  onAdd: (type: CategoryType) => void;
  onEdit: (category: DisplayCategory) => void;
  onToggleArchive: (category: DisplayCategory) => void;
  onDelete: (category: DisplayCategory) => void;
}) {
  return (
    <Card className="border border-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{categories.filter((category) => !category.archived).length} active | {categories.length} total</p>
        </div>
        <Button className="gap-2" onClick={() => onAdd(type)}>
          <Plus size={16} />
          Add category
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: category.color }}>
                <CategoryGlyph icon={category.icon} color={category.color} size={18} />
              </span>
              <div>
                <p className="font-medium text-slate-800">{category.name}</p>
                <p className="text-xs text-slate-500">{category.systemGenerated ? category.helperText : `${category.icon}${category.archived ? " - Archived" : ""}`}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.systemGenerated ? (
                <span className="rounded-full bg-violet-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                  Shared
                </span>
              ) : (
                <>
                  <Button variant="secondary" className="gap-2" onClick={() => onEdit(category)}>
                    <Pencil size={14} />
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => onToggleArchive(category)}>{category.archived ? "Unarchive" : "Archive"}</Button>
                  <Button variant="ghost" className="gap-2 text-rose-600 hover:bg-rose-50" onClick={() => onDelete(category)}>
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CategoriesPage() {
  const { data } = useFinanceData();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Category>(emptyDraft("expense"));
  const [open, setOpen] = useState(false);

  const saveMutation = useMutation({
    mutationFn: saveCategory,
    onSuccess: async (_, category) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ]);
      toastSuccess(category.id ? "Category updated" : "Category created");
      setDraft(emptyDraft(category.type));
      setOpen(false);
    },
    onError: (error) => toastError(getApiErrorMessage(error, "Unable to save category")),
  });

  const deleteMutation = useMutation({
    mutationFn: removeCategory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ]);
      toastSuccess("Category deleted");
    },
    onError: (error) => toastError(getApiErrorMessage(error, "Unable to delete category")),
  });

  const expenseCategories = useMemo<DisplayCategory[]>(() => data?.categories.filter((category) => category.type === "expense") ?? [], [data]);
  const incomeCategories = useMemo<DisplayCategory[]>(() => data?.categories.filter((category) => category.type === "income") ?? [], [data]);
  const sharedExpenseCategories = useMemo<DisplayCategory[]>(() => {
    if (!data || !currentUserId) {
      return [];
    }

    const seen = new Map<string, DisplayCategory>();
    for (const transaction of data.transactions) {
      if (transaction.type !== "expense" || !transaction.createdByUserId || transaction.createdByUserId === currentUserId) {
        continue;
      }

      const displayName = transaction.createdByName?.trim() || "member";
      if (seen.has(transaction.createdByUserId)) {
        continue;
      }

      seen.set(transaction.createdByUserId, {
        id: `shared-user-${transaction.createdByUserId}`,
        name: `Shared user ${displayName} spent`,
        type: "expense",
        color: "#ef4444",
        icon: "Tag",
        archived: false,
        systemGenerated: true,
        helperText: "Generated automatically for shared-account spending.",
      });
    }

    return Array.from(seen.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [currentUserId, data]);
  const uncategorizedExpenseCategory = useMemo<DisplayCategory[]>(() => {
    if (!data) {
      return [];
    }

    const hasNeedsReview = data.transactions.some((transaction) => transaction.type === "expense" && !transaction.categoryId && !transaction.categoryName);
    if (!hasNeedsReview) {
      return [];
    }

    return [{
      id: "needs-review-expense",
      name: "Needs review",
      type: "expense",
      color: "#64748b",
      icon: "Tag",
      archived: false,
      systemGenerated: true,
      helperText: "Generated automatically for expense entries without a category.",
    }];
  }, [data]);
  const expenseCategoriesWithShared = useMemo(() => [...expenseCategories, ...sharedExpenseCategories, ...uncategorizedExpenseCategory], [expenseCategories, sharedExpenseCategories, uncategorizedExpenseCategory]);

  const handleSave = () => {
    const normalizedName = draft.name.trim();
    if (!normalizedName) return toastError("Category name is required");
    const siblingCategories = draft.type === "expense" ? expenseCategories : incomeCategories;
    const duplicate = siblingCategories.find((category) => category.id !== draft.id && category.name.trim().toLowerCase() === normalizedName.toLowerCase());
    if (duplicate) return toastError("A category with this name already exists");
    saveMutation.mutate({ ...draft, name: normalizedName });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Categories</h2>
        <p className="text-sm text-slate-500">Manage income and expense categories used across budgets, reports, and transactions.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <CategorySection title="Expense categories" type="expense" categories={expenseCategoriesWithShared} onAdd={(type) => { setDraft(emptyDraft(type)); setOpen(true); }} onEdit={(category) => { setDraft(category); setOpen(true); }} onToggleArchive={(category) => saveMutation.mutate({ ...category, archived: !category.archived })} onDelete={(category) => window.confirm(`Delete category "${category.name}"?`) && deleteMutation.mutate(category.id)} />
        <CategorySection title="Income categories" type="income" categories={incomeCategories} onAdd={(type) => { setDraft(emptyDraft(type)); setOpen(true); }} onEdit={(category) => { setDraft(category); setOpen(true); }} onToggleArchive={(category) => saveMutation.mutate({ ...category, archived: !category.archived })} onDelete={(category) => window.confirm(`Delete category "${category.name}"?`) && deleteMutation.mutate(category.id)} />
      </div>
      <CategoryModal open={open} title={draft.id ? `Edit ${draft.type} category` : `Add ${draft.type} category`} draft={draft} onClose={() => setOpen(false)} onChange={setDraft} onSubmit={handleSave} pending={saveMutation.isPending} />
    </div>
  );
}


