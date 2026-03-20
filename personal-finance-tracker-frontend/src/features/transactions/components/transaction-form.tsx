import { useEffect, useMemo, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight, BanknoteArrowDown, BanknoteArrowUp, CalendarDays, Landmark, Wallet } from "lucide-react";
import type { z } from "zod";
import type { Account, Category, Transaction } from "@/types/domain";
import { transactionSchema } from "@/features/transactions/schemas/transaction-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/utils/format";

const today = new Date().toISOString().slice(0, 10);

type FormValues = z.infer<typeof transactionSchema>;

function getEditableAccountBalance(accounts: Account[], accountId: string, initialValues?: Transaction) {
  const account = accounts.find((item) => item.id === accountId);
  let balance = account?.balance ?? 0;

  if (!initialValues) {
    return balance;
  }

  if (initialValues.type === "income" && initialValues.accountId === accountId) {
    balance -= initialValues.amount;
  }

  if (initialValues.type === "expense" && initialValues.accountId === accountId) {
    balance += initialValues.amount;
  }

  if (initialValues.type === "transfer") {
    if (initialValues.accountId === accountId) {
      balance += initialValues.amount;
    }

    if (initialValues.destinationAccountId === accountId) {
      balance -= initialValues.amount;
    }
  }

  return balance;
}

function getTypeTheme(type: Transaction["type"]) {
  if (type === "income") {
    return {
      icon: BanknoteArrowUp,
      title: "Income transaction",
      shell: "border-emerald-200 bg-emerald-50/70",
      badge: "bg-emerald-600 text-white",
      accent: "bg-emerald-100 text-emerald-700",
      balance: "bg-emerald-100 text-emerald-700",
    };
  }

  if (type === "transfer") {
    return {
      icon: ArrowLeftRight,
      title: "Transfer transaction",
      shell: "border-sky-200 bg-sky-50/70",
      badge: "bg-sky-600 text-white",
      accent: "bg-sky-100 text-sky-700",
      balance: "bg-sky-100 text-sky-700",
    };
  }

  return {
    icon: BanknoteArrowDown,
    title: "Expense transaction",
    shell: "border-rose-200 bg-rose-50/70",
    badge: "bg-rose-600 text-white",
    accent: "bg-rose-100 text-rose-700",
    balance: "bg-rose-100 text-rose-700",
  };
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      <p className="mt-1 min-h-4 text-xs text-rose-600">{error ?? ""}</p>
    </div>
  );
}

function getDefaultValues(accounts: Account[], initialValues?: Transaction): FormValues {
  return {
    id: initialValues?.id ?? "",
    accountId: initialValues?.accountId ?? accounts[0]?.id ?? "",
    destinationAccountId: initialValues?.destinationAccountId ?? "",
    type: initialValues?.type ?? "expense",
    amount: initialValues?.amount ?? 0,
    date: initialValues?.date ?? new Date().toISOString().slice(0, 10),
    categoryId: initialValues?.categoryId ?? "",
    merchant: initialValues?.merchant ?? "",
    note: initialValues?.note ?? "",
    paymentMethod: initialValues?.paymentMethod ?? "",
  };
}

export default function TransactionForm({
  accounts,
  categories,
  initialValues,
  onSubmit,
}: {
  accounts: Account[];
  categories: Category[];
  initialValues?: Transaction;
  onSubmit: (transaction: Transaction) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: getDefaultValues(accounts, initialValues),
  });

  useEffect(() => {
    form.reset(getDefaultValues(accounts, initialValues));
  }, [accounts, form, initialValues]);

  const type = form.watch("type");
  const accountId = form.watch("accountId");
  const currentDate = form.watch("date");
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const sourceBalance = getEditableAccountBalance(accounts, accountId, initialValues);
  const theme = getTypeTheme(type);
  const TypeIcon = theme.icon;

  const categoryOptions = useMemo(
    () =>
      categories.filter((category) => {
        if (category.type !== (type === "income" ? "income" : "expense")) {
          return false;
        }

        if (!category.archived) {
          return true;
        }

        return category.id === initialValues?.categoryId;
      }),
    [categories, initialValues?.categoryId, type],
  );

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => {
        const availableBalance = getEditableAccountBalance(accounts, values.accountId, initialValues);

        if ((values.type === "expense" || values.type === "transfer") && values.amount > availableBalance) {
          form.setError("amount", {
            type: "manual",
            message: `Insufficient balance. ${accounts.find((account) => account.id === values.accountId)?.name ?? "Selected account"} has ${availableBalance.toLocaleString("en-IN")}.`,
          });
          return;
        }

        onSubmit({
          id: values.id,
          accountId: values.accountId,
          destinationAccountId: values.destinationAccountId || undefined,
          type: values.type,
          amount: values.amount,
          date: values.date,
          categoryId: values.categoryId || undefined,
          merchant: values.merchant,
          note: values.note,
          paymentMethod: values.paymentMethod,
        });
      })}
    >
      <div className={`rounded-xl border px-3 py-3 ${theme.shell}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${theme.badge}`}>
              <TypeIcon size={16} />
            </span>
            <p className="text-sm font-semibold text-slate-900">{theme.title}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-slate-600 shadow-sm">
              <Wallet size={14} className="text-slate-500" />
              {selectedAccount?.name ?? "Select account"}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 shadow-sm ${theme.balance}`}>
              <Landmark size={14} />
              {formatCurrency(sourceBalance)} available
            </span>
            <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 shadow-sm ${theme.accent}`}>
              <CalendarDays size={14} />
              {currentDate}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" error={form.formState.errors.type?.message} className="sm:col-span-2">
          <Select {...form.register("type")}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </Select>
        </Field>

        <Field label="Amount" error={form.formState.errors.amount?.message}>
          <Input type="number" min={0} step="0.01" {...form.register("amount")} />
        </Field>

        <Field label="Date" error={form.formState.errors.date?.message}>
          <Input type="date" max={today} {...form.register("date")} />
        </Field>

        <Field label="Account" error={form.formState.errors.accountId?.message}>
          <Select {...form.register("accountId")}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </Field>

        {type === "transfer" ? (
          <Field label="Destination account" error={form.formState.errors.destinationAccountId?.message}>
            <Select {...form.register("destinationAccountId")}>
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Category" error={form.formState.errors.categoryId?.message}>
            <Select {...form.register("categoryId")}>
              <option value="">Select category</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Merchant" error={form.formState.errors.merchant?.message}>
          <Input {...form.register("merchant")} placeholder="Employer Inc, Grocery Mart, Uber" />
        </Field>

        <Field label="Payment method" error={form.formState.errors.paymentMethod?.message}>
          <Input {...form.register("paymentMethod")} placeholder="UPI, card, cash" />
        </Field>

        <Field label="Note" error={form.formState.errors.note?.message}>
          <Input {...form.register("note")} placeholder="Optional note" />
        </Field>

        <div className="flex items-start sm:items-end">
          <Button type="submit" className="min-w-40 sm:mb-5">
            Save transaction
          </Button>
        </div>
      </div>
    </form>
  );
}