import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeftRight, ArrowUp, BanknoteArrowDown, BanknoteArrowUp, Download, Landmark, Pencil, Search, Tag, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/feedback/states";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";
import { useUiStore } from "@/store/ui-store";
import { formatCurrency, formatDate } from "@/utils/format";
import { removeTransaction } from "@/features/finance/api/finance-api";
import { toastSuccess } from "@/components/feedback/toast";
import type { Category, Transaction } from "@/types/domain";

type SortField = "date" | "category" | "account" | "type" | "amount";
type SortDirection = "asc" | "desc" | null;

const today = new Date().toISOString().slice(0, 10);

function getTypeStyles(type: Transaction["type"]) {
  if (type === "income") {
    return {
      badge: "bg-emerald-100 text-emerald-700",
      amount: "text-emerald-600",
      icon: BanknoteArrowUp,
      label: "Income",
      prefix: "+",
    };
  }

  if (type === "expense") {
    return {
      badge: "bg-rose-100 text-rose-700",
      amount: "text-rose-600",
      icon: BanknoteArrowDown,
      label: "Expense",
      prefix: "-",
    };
  }

  return {
    badge: "bg-brand-50 text-brand-700",
    amount: "text-brand-700",
    icon: ArrowLeftRight,
    label: "Transfer",
    prefix: "",
  };
}

function getCategoryMeta(transaction: Transaction, categories: Category[]) {
  if (transaction.type === "transfer") {
    return {
      label: "Transfer",
      color: "#cbd5e1",
      tone: "text-slate-500",
    };
  }

  const category = categories.find((entry) => entry.id === transaction.categoryId);
  if (!category) {
    return {
      label: "Unassigned",
      color: "#cbd5e1",
      tone: "text-slate-500",
    };
  }

  return {
    label: category.name,
    color: category.color,
    tone: "text-slate-700",
  };
}

function getAccountLabel(transaction: Transaction, accountName: string, destinationName: string | null) {
  return destinationName ? `${accountName} -> ${destinationName}` : accountName;
}

function escapeCsvValue(value: string | number) {
  const normalized = String(value ?? "");
  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function SortHeader({
  label,
  direction,
  onClick,
  align = "left",
}: {
  label: string;
  direction: SortDirection;
  onClick: () => void;
  align?: "left" | "right";
}) {
  const justifyClass = align === "right" ? "justify-end" : "justify-start";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center gap-2 font-medium transition hover:text-slate-700 ${justifyClass}`}
    >
      <span>{label}</span>
      {direction ? (
        <span className="inline-flex h-4 w-4 items-center justify-center text-brand-700">
          {direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        </span>
      ) : null}
    </button>
  );
}

function TransactionsPage() {
  const pageSizeOptions = [10, 25, 50];
  const { data } = useFinanceData();
  const openTransactionModal = useUiStore((state) => state.openTransactionModal);
  const search = useUiStore((state) => state.search);
  const setSearch = useUiStore((state) => state.setSearch);
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const deleteMutation = useMutation({
    mutationFn: removeTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      toastSuccess("Transaction deleted");
    },
  });

  const allRows = data?.transactions ?? [];
  const rows = useMemo(() => {
    const filteredRows = allRows.filter((item) => {
      const haystack = `${item.merchant ?? ""} ${item.note ?? ""} ${getTypeStyles(item.type).label}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesFrom = !dateFrom || item.date >= dateFrom;
      const matchesTo = !dateTo || item.date <= dateTo;
      return matchesSearch && matchesFrom && matchesTo;
    });

    if (!data || !sortField || !sortDirection) {
      return filteredRows;
    }

    const directionMultiplier = sortDirection === "asc" ? 1 : -1;

    return [...filteredRows].sort((left, right) => {
      const leftAccount = data.accounts.find((entry) => entry.id === left.accountId)?.name ?? left.accountId;
      const rightAccount = data.accounts.find((entry) => entry.id === right.accountId)?.name ?? right.accountId;
      const leftDestination = left.destinationAccountId
        ? data.accounts.find((entry) => entry.id === left.destinationAccountId)?.name ?? left.destinationAccountId
        : null;
      const rightDestination = right.destinationAccountId
        ? data.accounts.find((entry) => entry.id === right.destinationAccountId)?.name ?? right.destinationAccountId
        : null;
      const leftCategory = getCategoryMeta(left, data.categories).label;
      const rightCategory = getCategoryMeta(right, data.categories).label;
      const leftType = getTypeStyles(left.type).label;
      const rightType = getTypeStyles(right.type).label;

      if (sortField === "amount") {
        return (left.amount - right.amount) * directionMultiplier;
      }

      if (sortField === "date") {
        return (new Date(left.date).getTime() - new Date(right.date).getTime()) * directionMultiplier;
      }

      const leftValue =
        sortField === "category"
          ? leftCategory
          : sortField === "account"
            ? getAccountLabel(left, leftAccount, leftDestination)
            : leftType;
      const rightValue =
        sortField === "category"
          ? rightCategory
          : sortField === "account"
            ? getAccountLabel(right, rightAccount, rightDestination)
            : rightType;

      return leftValue.localeCompare(rightValue) * directionMultiplier;
    });
  }, [allRows, data, dateFrom, dateTo, search, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, rows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, search, pageSize, sortDirection, sortField]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const summary = useMemo(() => {
    const income = allRows.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expense = allRows.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const transfers = allRows.filter((item) => item.type === "transfer").length;
    return {
      count: allRows.length,
      income,
      expense,
      transfers,
    };
  }, [allRows]);

  const toggleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    if (sortDirection === "desc") {
      setSortField(null);
      setSortDirection(null);
      return;
    }

    setSortDirection("asc");
  };

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
  };

  const exportCurrentRowsToCsv = () => {
    if (!data || !rows.length) {
      return;
    }

    const headers = ["Date", "Merchant", "Category", "Account", "Type", "Amount", "Payment Method", "Note"];
    const lines = rows.map((item) => {
      const account = data.accounts.find((entry) => entry.id === item.accountId)?.name ?? item.accountId;
      const destination = item.destinationAccountId
        ? data.accounts.find((entry) => entry.id === item.destinationAccountId)?.name ?? item.destinationAccountId
        : null;

      return [
        item.date,
        item.merchant ?? "",
        getCategoryMeta(item, data.categories).label,
        getAccountLabel(item, account, destination),
        getTypeStyles(item.type).label,
        item.amount,
        item.paymentMethod ?? "",
        item.note ?? "",
      ]
        .map((value) => escapeCsvValue(value))
        .join(",");
    });

    downloadCsv(`transactions-${today}.csv`, [headers.join(","), ...lines].join("\r\n"));
  };

  if (!data || !allRows.length) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Start with your first income, expense, or transfer entry."
        action={<Button onClick={() => openTransactionModal()}>Add first transaction</Button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,_#0f1d52,_#335cff)] p-6 text-white shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-100">Money Movement</p>
            <h2 className="mt-3 text-3xl font-semibold">Transactions</h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-100/90">
              Review every inflow, expense, and transfer across your accounts with a cleaner operating view.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openTransactionModal()}
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-lg shadow-slate-950/15 transition hover:bg-slate-100"
          >
            Add transaction
          </button>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Entries</p>
            <p className="mt-2 text-2xl font-semibold">{summary.count}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Income</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.income)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Expenses</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.expense)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Transfers</p>
            <p className="mt-2 text-2xl font-semibold">{summary.transfers}</p>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden border border-slate-100 p-0">
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,_#f8fbff,_#eef4ff)] px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Transaction filters</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Search and review</h3>
              <p className="mt-1 text-sm text-slate-500">Search by merchant or transaction type, then narrow results to a custom date window only when you need it.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {dateFrom || dateTo ? (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">Custom period active</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">Showing all dates</span>
              )}
              <Button variant="secondary" className="gap-2" onClick={exportCurrentRowsToCsv} disabled={!rows.length}>
                <Download size={14} />
                Export CSV
              </Button>
              {dateFrom || dateTo ? (
                <Button variant="secondary" onClick={clearDateFilter}>Clear dates</Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-white px-4 py-4 sm:px-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-3xl border border-brand-100 bg-brand-50/50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Keyword search</p>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 shadow-sm">
              <Search size={18} className="text-brand-400" />
              <Input
                placeholder="Search merchant or type"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="border-0 bg-transparent p-0 shadow-none ring-0 focus:border-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Date window</p>
              <span className="text-xs font-medium text-amber-700">Optional</span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">From date</label>
                <Input type="date" value={dateFrom} max={dateTo || today} onChange={(event) => setDateFrom(event.target.value)} className="bg-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">To date</label>
                <Input type="date" value={dateTo} min={dateFrom || undefined} max={today} onChange={(event) => setDateTo(event.target.value)} className="bg-white" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {!rows.length ? (
        <EmptyState
          title="No matching transactions"
          description={`No transactions matched the current filters. Try a different search or date period.`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setSearch("")}>Clear search</Button>
              <Button variant="secondary" onClick={clearDateFilter}>Clear dates</Button>
            </div>
          }
        />
      ) : (
        <>
          <Card className="hidden overflow-hidden border border-slate-100 p-0 lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium"><SortHeader label="Date" direction={sortField === "date" ? sortDirection : null} onClick={() => toggleSort("date")} /></th>
                    <th className="px-6 py-4 font-medium">Merchant</th>
                    <th className="px-6 py-4 font-medium">
                      <SortHeader label="Category" direction={sortField === "category" ? sortDirection : null} onClick={() => toggleSort("category")} />
                    </th>
                    <th className="px-6 py-4 font-medium">
                      <SortHeader label="Account" direction={sortField === "account" ? sortDirection : null} onClick={() => toggleSort("account")} />
                    </th>
                    <th className="px-6 py-4 font-medium">
                      <SortHeader label="Type" direction={sortField === "type" ? sortDirection : null} onClick={() => toggleSort("type")} />
                    </th>
                    <th className="px-6 py-4 font-medium text-right">
                      <SortHeader label="Amount" align="right" direction={sortField === "amount" ? sortDirection : null} onClick={() => toggleSort("amount")} />
                    </th>
                    <th className="px-6 py-4 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((item, index) => {
                    const account = data.accounts.find((entry) => entry.id === item.accountId)?.name ?? item.accountId;
                    const destination = item.destinationAccountId
                      ? data.accounts.find((entry) => entry.id === item.destinationAccountId)?.name ?? item.destinationAccountId
                      : null;
                    const category = getCategoryMeta(item, data.categories);
                    const styles = getTypeStyles(item.type);
                    const Icon = styles.icon;
                    const initials = (item.merchant ?? item.note ?? "NA").slice(0, 2).toUpperCase();
                    const absoluteIndex = (currentPage - 1) * pageSize + index;

                    return (
                      <tr key={item.id} className={absoluteIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                        <td className="px-6 py-4 align-top text-slate-600">{formatDate(item.date)}</td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-600">
                              {initials}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{item.merchant ?? item.note ?? "Untitled"}</p>
                              <p className="text-xs text-slate-500">{item.paymentMethod || item.note || "No extra details"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium ${category.tone}`}>
                            <span className="h-2.5 w-2.5 rounded-full border border-white/70 shadow-sm" style={{ backgroundColor: category.color }} />
                            {category.label}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-slate-700">
                            <Landmark size={14} />
                            <span>{getAccountLabel(item, account, destination)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${styles.badge}`}>
                            <Icon size={14} />
                            {styles.label}
                          </span>
                        </td>
                        <td className={`px-6 py-4 align-top text-right text-base font-semibold whitespace-nowrap ${styles.amount}`}>
                          {styles.prefix}
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="mx-auto flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                            <Button variant="ghost" className="gap-2 rounded-xl px-3 text-slate-600 hover:bg-slate-100" onClick={() => openTransactionModal(item)}>
                              <Pencil size={14} />
                              Edit
                            </Button>
                            <Button variant="ghost" className="gap-2 rounded-xl px-3 text-rose-600 hover:bg-rose-50" onClick={() => deleteMutation.mutate(item.id)}>
                              <Trash2 size={14} />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 lg:hidden">
            {paginatedRows.map((item) => {
              const account = data.accounts.find((entry) => entry.id === item.accountId)?.name ?? item.accountId;
              const destination = item.destinationAccountId
                ? data.accounts.find((entry) => entry.id === item.destinationAccountId)?.name ?? item.destinationAccountId
                : null;
              const category = getCategoryMeta(item, data.categories);
              const styles = getTypeStyles(item.type);
              const Icon = styles.icon;

              return (
                <Card key={item.id} className="border border-slate-100 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${styles.badge}`}>
                        <Icon size={14} />
                        {styles.label}
                      </span>
                      <p className="mt-3 text-lg font-semibold text-slate-900">{item.merchant ?? item.note ?? "Untitled"}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatDate(item.date)}</p>
                    </div>
                    <span className={`text-lg font-semibold ${styles.amount}`}>
                      {styles.prefix}
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <Landmark size={14} />
                      {getAccountLabel(item, account, destination)}
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium ${category.tone}`}>
                      <Tag size={13} />
                      <span className="h-2.5 w-2.5 rounded-full border border-white/70 shadow-sm" style={{ backgroundColor: category.color }} />
                      {category.label}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <div className="flex w-full items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                      <Button variant="ghost" className="flex-1 gap-2 rounded-xl text-slate-600 hover:bg-slate-100" onClick={() => openTransactionModal(item)}>
                        <Pencil size={14} />
                        Edit
                      </Button>
                      <Button variant="ghost" className="flex-1 gap-2 rounded-xl text-rose-600 hover:bg-rose-50" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="border border-slate-100 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <p>
                  Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, rows.length)} of {rows.length} transactions
                </p>
                <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  {pageSizeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPageSize(option)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                        pageSize === option ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 self-start lg:self-auto">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export { TransactionsPage };
export default TransactionsPage;
