import type {
  Account,
  AccountInvitation,
  AccountMembersResponse,
  AdvancedReportBundle,
  Budget,
  Category,
  DashboardSummary,
  ForecastDaily,
  ForecastSummary,
  Goal,
  HealthScore,
  InsightsBundle,
  RecurringTransaction,
  ReportBundle,
  Rule,
  Transaction,
} from "@/types/domain";
import { apiClient } from "@/services/api/client";

type AccountPayload = Omit<Account, "id"> & { id?: string | null };
type TransactionPayload = Omit<Transaction, "id"> & { id?: string | null };
type BudgetPayload = Omit<Budget, "id"> & { id?: string | null };
type GoalPayload = Omit<Goal, "id"> & { id?: string | null };
type RecurringPayload = Omit<RecurringTransaction, "id"> & { id?: string | null };

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return (await apiClient.get("/dashboard/summary")).data;
}

export async function getForecastMonth(): Promise<ForecastSummary> {
  return (await apiClient.get("/forecast/month")).data;
}

export async function getForecastDaily(): Promise<ForecastDaily> {
  return (await apiClient.get("/forecast/daily")).data;
}

export async function getHealthScore(): Promise<HealthScore> {
  return (await apiClient.get("/insights/health-score")).data;
}

export async function getInsights(): Promise<InsightsBundle> {
  return (await apiClient.get("/insights")).data;
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

export async function inviteAccountMember(accountId: string, payload: { email: string; role: string }) {
  return (await apiClient.post(`/accounts/${accountId}/invite`, payload)).data;
}

export async function getAccountMembers(accountId: string): Promise<AccountMembersResponse> {
  return (await apiClient.get(`/accounts/${accountId}/members`)).data;
}

export async function getPendingAccountInvitations(): Promise<AccountInvitation[]> {
  return (await apiClient.get("/accounts/invitations")).data;
}

export async function updateAccountMember(accountId: string, userId: string, payload: { role: string }) {
  return (await apiClient.put(`/accounts/${accountId}/members/${userId}`, payload)).data;
}

export async function removeAccountMember(accountId: string, userId: string) {
  return (await apiClient.delete(`/accounts/${accountId}/members/${userId}`)).data;
}

export async function acceptAccountInvitation(accountId: string) {
  return (await apiClient.post(`/accounts/${accountId}/accept-invite`)).data;
}

export async function declineAccountInvitation(accountId: string) {
  return (await apiClient.post(`/accounts/${accountId}/decline-invite`)).data;
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

export async function getAdvancedReports(params?: { dateFrom?: string; dateTo?: string; accountId?: string; categoryId?: string }): Promise<AdvancedReportBundle> {
  return (await apiClient.get("/reports/trends", { params })).data;
}

export async function getNetWorthReport(params?: { dateFrom?: string; dateTo?: string; accountId?: string }): Promise<Array<{ period: string; value: number }>> {
  return (await apiClient.get("/reports/net-worth", { params })).data;
}

export async function getRules(): Promise<Rule[]> {
  return (await apiClient.get("/rules")).data;
}

export async function saveRule(payload: Omit<Rule, "summary">) {
  const body = { ...payload, id: payload.id || null, summary: "" };
  return (payload.id ? await apiClient.put(`/rules/${payload.id}`, body) : await apiClient.post("/rules", body)).data;
}

export async function deleteRule(id: string) {
  return (await apiClient.delete(`/rules/${id}`)).data;
}

export async function toggleRule(id: string) {
  return (await apiClient.post(`/rules/${id}/toggle`)).data;
}

export async function testRule(payload: { condition: Rule["condition"]; action: Rule["action"]; transaction: Transaction }) {
  return (await apiClient.post("/rules/test", payload)).data;
}



