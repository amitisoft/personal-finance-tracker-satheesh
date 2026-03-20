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
