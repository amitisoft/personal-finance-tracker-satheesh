import { useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  BriefcaseBusiness,
  BusFront,
  CarFront,
  CircleDollarSign,
  CreditCard,
  FerrisWheel,
  Film,
  Fuel,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  LockKeyhole,
  Pencil,
  PiggyBank,
  Plane,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tag,
  Trash2,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";
import { removeCategory, saveCategory } from "@/features/finance/api/finance-api";
import { changePassword } from "@/features/auth/api/auth-api";
import { changePasswordSchema } from "@/features/auth/schemas/auth-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toastError, toastSuccess } from "@/components/feedback/toast";
import type { Category, CategoryType } from "@/types/domain";
import type { z } from "zod";

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

type PasswordFormValues = z.infer<typeof changePasswordSchema>;

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
    if (!normalized) {
      return CATEGORY_ICONS;
    }
    return CATEGORY_ICONS.filter((item) => item.name.toLowerCase().includes(normalized));
  }, [iconSearch]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">{draft.id ? "Update category" : "Create category"}</p>
          <p className="mt-1 text-xs text-slate-600">Choose the name, color, and icon used across budgets, reports, and transactions.</p>
        </div>

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
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-brand-400 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: draft.color }}>
                    <CategoryGlyph icon={item.name} color={draft.color} size={18} />
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              );
            })}
            {!filteredIcons.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 sm:col-span-2">
                No matching icons found.
              </div>
            ) : null}
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

function CategorySection({
  title,
  type,
  categories,
  onAdd,
  onEdit,
  onToggleArchive,
  onDelete,
}: {
  title: string;
  type: CategoryType;
  categories: Category[];
  onAdd: (type: CategoryType) => void;
  onEdit: (category: Category) => void;
  onToggleArchive: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const activeCount = categories.filter((category) => !category.archived).length;

  return (
    <Card className="border border-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{activeCount} active | {categories.length} total</p>
        </div>
        <Button className="gap-2" onClick={() => onAdd(type)}>
          <Plus size={16} />
          Add category
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {categories.length ? (
          categories.map((category) => (
            <div key={category.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: category.color }}>
                  <CategoryGlyph icon={category.icon} color={category.color} size={18} />
                </span>
                <div>
                  <p className="font-medium text-slate-800">{category.name}</p>
                  <p className="text-xs text-slate-500">{category.icon}{category.archived ? " - Archived" : ""}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="gap-2" onClick={() => onEdit(category)}>
                  <Pencil size={14} />
                  Edit
                </Button>
                <Button variant="ghost" onClick={() => onToggleArchive(category)}>
                  {category.archived ? "Unarchive" : "Archive"}
                </Button>
                <Button variant="ghost" className="gap-2 text-rose-600 hover:bg-rose-50" onClick={() => onDelete(category)}>
                  <Trash2 size={14} />
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
            No {type} categories yet.
          </div>
        )}
      </div>
    </Card>
  );
}

function ChangePasswordSection() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: ({ currentPassword, password }: PasswordFormValues) => changePassword({ currentPassword, password }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance-state"] });
      toastSuccess("Password updated");
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toastError(error instanceof Error ? error.message : "Unable to update password");
    },
  });

  return (
    <>
      <Card className="border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Password</h3>
            <p className="mt-1 text-sm text-slate-500">Change your password using your current password.</p>
          </div>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <LockKeyhole size={16} />
            Edit password
          </Button>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit password">
        <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Current password</label>
            <Input type="password" {...form.register("currentPassword")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.currentPassword?.message}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">New password</label>
            <Input type="password" {...form.register("password")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.password?.message}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</label>
            <Input type="password" {...form.register("confirmPassword")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.confirmPassword?.message}</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>Update password</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function SettingsPage() {
  const { data } = useFinanceData();
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
    onError: (error) => {
      toastError(error instanceof Error ? error.message : "Unable to save category");
    },
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
    onError: (error) => {
      toastError(error instanceof Error ? error.message : "Unable to delete category");
    },
  });

  const expenseCategories = useMemo(
    () => data?.categories.filter((category) => category.type === "expense") ?? [],
    [data],
  );
  const incomeCategories = useMemo(
    () => data?.categories.filter((category) => category.type === "income") ?? [],
    [data],
  );

  const openCreateModal = (type: CategoryType) => {
    setDraft(emptyDraft(type));
    setOpen(true);
  };

  const openEditModal = (category: Category) => {
    setDraft(category);
    setOpen(true);
  };

  const handleSave = () => {
    const normalizedName = draft.name.trim();
    if (!normalizedName) {
      toastError("Category name is required");
      return;
    }

    const siblingCategories = draft.type === "expense" ? expenseCategories : incomeCategories;
    const duplicate = siblingCategories.find(
      (category) => category.id !== draft.id && category.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (duplicate) {
      toastError("A category with this name already exists");
      return;
    }

    saveMutation.mutate({ ...draft, name: normalizedName });
  };

  const handleArchiveToggle = (category: Category) => {
    saveMutation.mutate({ ...category, archived: !category.archived });
  };

  const handleDelete = (category: Category) => {
    const confirmed = window.confirm(`Delete category "${category.name}"? Unused categories can be removed permanently.`);
    if (confirmed) {
      deleteMutation.mutate(category.id);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-slate-500">Manage categories and account security settings.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <CategorySection
          title="Expense categories"
          type="expense"
          categories={expenseCategories}
          onAdd={openCreateModal}
          onEdit={openEditModal}
          onToggleArchive={handleArchiveToggle}
          onDelete={handleDelete}
        />
        <CategorySection
          title="Income categories"
          type="income"
          categories={incomeCategories}
          onAdd={openCreateModal}
          onEdit={openEditModal}
          onToggleArchive={handleArchiveToggle}
          onDelete={handleDelete}
        />
      </div>
      <ChangePasswordSection />

      <CategoryModal
        open={open}
        title={draft.id ? `Edit ${draft.type} category` : `Add ${draft.type} category`}
        draft={draft}
        onClose={() => setOpen(false)}
        onChange={setDraft}
        onSubmit={handleSave}
        pending={saveMutation.isPending}
      />
    </div>
  );
}


