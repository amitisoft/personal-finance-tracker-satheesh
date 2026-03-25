export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
export type AccountType = "bank account" | "credit card" | "cash wallet" | "savings account";
export type GoalStatus = "active" | "completed";
export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export interface User {
  id: string;
  displayName: string;
  email: string;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface NotificationState {
  seenIds: string[];
  dismissedIds: string[];
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  accessRole?: "owner" | "editor" | "viewer";
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  archived?: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  destinationAccountId?: string;
  type: TransactionType;
  amount: number;
  date: string;
  categoryId?: string;
  note?: string;
  merchant?: string;
  paymentMethod?: string;
  recurringTransactionId?: string;
  reviewRequired?: boolean;
  tags?: string[];
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  createdByUserId?: string;
  createdByName?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: number;
  year: number;
  amount: number;
  spent: number;
  alertThresholdPercent: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  linkedAccountId?: string;
  icon: string;
  color: string;
  status: GoalStatus;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  accountId: string;
  frequency: Frequency;
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  autoCreateTransaction: boolean;
  paused?: boolean;
}

export interface DashboardSummary {
  currentMonthIncome: number;
  currentMonthExpense: number;
  netBalance: number;
  totalGoalSaved: number;
  budgets: Budget[];
  categorySpend: Array<{ name: string; value: number; color: string }>;
  incomeExpenseTrend: Array<{ month: string; income: number; expense: number }>;
  recentTransactions: Transaction[];
  upcomingRecurring: RecurringTransaction[];
  goals: Goal[];
}

export interface ForecastSummary {
  currentBalance: number;
  forecastedEndOfMonthBalance: number;
  safeToSpend: number;
  expectedIncomeRemaining: number;
  expectedExpenseRemaining: number;
  riskLevel: "low" | "medium" | "high";
  riskMessages: string[];
  calculationWindowMonths: number;
  lowConfidence: boolean;
  explanation: string;
}

export interface ForecastDailyPoint {
  date: string;
  projectedBalance: number;
  markers: string[];
}

export interface ForecastDaily {
  points: ForecastDailyPoint[];
}

export interface HealthScoreFactor {
  name: string;
  value: number;
  score: number;
  weight: number;
  explanation: string;
}

export interface HealthScore {
  score: number;
  grade: string;
  factors: HealthScoreFactor[];
  suggestions: string[];
  generatedAt: string;
  changeSummary: string;
}

export interface InsightHighlight {
  title: string;
  message: string;
  tone: string;
  percentChange?: number | null;
}

export interface InsightsBundle {
  healthScore: HealthScore;
  highlights: InsightHighlight[];
  savingsRateTrend: Array<{ period: string; value: number }>;
  incomeVsExpenseTrend: Array<{ period: string; income: number; expense: number }>;
}

export interface RuleCondition {
  field: string;
  operator: string;
  value?: string;
  values?: string[];
}

export interface RuleAction {
  type: string;
  value?: string;
}

export interface Rule {
  id: string;
  name: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
  isActive: boolean;
  summary: string;
}

export interface AccountMember {
  userId?: string | null;
  displayName: string;
  email: string;
  role: string;
  status: string;
  isOwner: boolean;
  addedAt?: string | null;
}

export interface ActivityLog {
  id: string;
  accountId?: string | null;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  actorName: string;
  createdAt: string;
  metadataJson?: string | null;
}

export interface AccountMembersResponse {
  members: AccountMember[];
  activity: ActivityLog[];
}

export interface AccountInvitation {
  id: string;
  accountId: string;
  accountName: string;
  email: string;
  role: string;
  status: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
}

export interface AdvancedReportBundle {
  categoryTrends: Array<{ period: string; category: string; value: number }>;
  savingsRateTrend: Array<{ period: string; value: number }>;
  incomeVsExpenseTrend: Array<{ period: string; income: number; expense: number }>;
  netWorthTrend: Array<{ period: string; value: number }>;
  highlights: InsightHighlight[];
}

export interface ReportBundle {
  categorySpend: Array<{ name: string; value: number; color: string }>;
  incomeVsExpense: Array<{ month: string; income: number; expense: number }>;
  accountBalanceTrend: Array<{ month: string; balance: number }>;
  savingsProgress: Array<{ name: string; progress: number }>;
}

export interface FinanceState {
  user: User | null;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  recurring: RecurringTransaction[];
}
