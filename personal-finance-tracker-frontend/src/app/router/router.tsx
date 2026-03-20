import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/app/layouts/app-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";
import LoginPage from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page";
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { TransactionsPage } from "@/features/transactions/pages/transactions-page";
import { BudgetsPage } from "@/features/budgets/pages/budgets-page";
import { GoalsPage } from "@/features/goals/pages/goals-page";
import { ReportsPage } from "@/features/reports/pages/reports-page";
import { RecurringPage } from "@/features/recurring/pages/recurring-page";
import { AccountsPage } from "@/features/accounts/pages/accounts-page";
import { SettingsPage } from "@/features/settings/pages/settings-page";
import { routes } from "@/utils/routes";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to={routes.dashboard} replace /> },
  { path: routes.login, element: <LoginPage /> },
  { path: routes.register, element: <RegisterPage /> },
  { path: routes.forgotPassword, element: <ForgotPasswordPage /> },
  { path: routes.resetPassword, element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: routes.dashboard, element: <DashboardPage /> },
          { path: routes.transactions, element: <TransactionsPage /> },
          { path: routes.budgets, element: <BudgetsPage /> },
          { path: routes.goals, element: <GoalsPage /> },
          { path: routes.reports, element: <ReportsPage /> },
          { path: routes.recurring, element: <RecurringPage /> },
          { path: routes.accounts, element: <AccountsPage /> },
          { path: routes.settings, element: <SettingsPage /> },
        ],
      },
    ],
  },
]);



