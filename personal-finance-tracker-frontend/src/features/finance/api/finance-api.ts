import type { Account, Budget, Category, DashboardSummary, Goal, RecurringTransaction, ReportBundle, Transaction } from "@/types/domain";
import { apiClient } from "@/services/api/client";

type AccountPayload = Omit<Account, "id"> & { id?: string | null };
type TransactionPayload = Omit<Transaction, "id"> & { id?: string | null };
type BudgetPayload = Omit<Budget, "id"> & { id?: string | null };
type GoalPayload = Omit<Goal, "id"> & { id?: string | null };
type RecurringPayload = Omit<RecurringTransaction, "id"> & { id?: string | null };

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return (await apiClient.get("/dashboard/summary")).data;
}

export async function getFinanceState() {
  const [accounts, categories, transactions, budgets, goals, recurring] = await Promise.all([
    apiClient.get("/accounts"),
    apiClient.get("/categories"),
    apiClient.get("/transactions"),
    apiClient.get("/budgets"),
    apiClient.get("/goals"),
    apiClient.get("/recurring"),
  ]);

  return {
    accounts: accounts.data as Account[],
    categories: categories.data as Category[],
    transactions: transactions.data as Transaction[],
    budgets: budgets.data as Budget[],
    goals: goals.data as Goal[],
    recurring: recurring.data as RecurringTransaction[],
  };
}

export async function saveTransaction(payload: TransactionPayload) {
  const body = payload.id ? payload : { ...payload, id: null };
  return (payload.id ? await apiClient.put(`/transactions/${payload.id}`, body) : await apiClient.post("/transactions", body)).data;
}

export async function removeTransaction(id: string) {
  return (await apiClient.delete(`/transactions/${id}`)).data;
}

export async function saveBudget(payload: BudgetPayload) {
  const body = payload.id ? payload : { ...payload, id: null };
  return (payload.id ? await apiClient.put(`/budgets/${payload.id}`, body) : await apiClient.post("/budgets", body)).data;
}

export async function saveGoal(payload: GoalPayload) {
  const body = payload.id ? payload : { ...payload, id: null };
  return (payload.id ? await apiClient.put(`/goals/${payload.id}`, body) : await apiClient.post("/goals", body)).data;
}

export async function removeGoal(id: string) {
  return (await apiClient.delete(`/goals/${id}`)).data;
}

export async function saveRecurring(payload: RecurringPayload) {
  const body = payload.id ? payload : { ...payload, id: null };
  return (payload.id ? await apiClient.put(`/recurring/${payload.id}`, body) : await apiClient.post("/recurring", body)).data;
}

export async function saveAccount(payload: AccountPayload) {
  const body = payload.id ? payload : { ...payload, id: null };
  return (payload.id ? await apiClient.put(`/accounts/${payload.id}`, body) : await apiClient.post("/accounts", body)).data;
}

export async function saveCategory(payload: Category) {
  const body = payload.id ? payload : { ...payload, id: null };
  return (payload.id ? await apiClient.put(`/categories/${payload.id}`, body) : await apiClient.post("/categories", body)).data;
}

export async function removeCategory(id: string) {
  return (await apiClient.delete(`/categories/${id}`)).data;
}

export async function getReports(): Promise<ReportBundle> {
  return {
    categorySpend: (await apiClient.get("/reports/category-spend")).data,
    incomeVsExpense: (await apiClient.get("/reports/income-vs-expense")).data,
    accountBalanceTrend: (await apiClient.get("/reports/account-balance-trend")).data,
    savingsProgress: (await apiClient.get("/reports/savings-progress")).data,
  };
}



