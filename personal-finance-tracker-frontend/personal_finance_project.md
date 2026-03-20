You are an expert React engineer. Build the frontend for a web-based Personal Finance Tracker.

Product summary:
- Users can sign up, log in, and manage their personal financial data securely.
- Core V1 features: authentication, dashboard, transactions CRUD, categories CRUD, accounts/wallets, monthly budgets, savings goals, recurring transactions, reporting/charts, search/filters, and responsive UI.
- Primary users: individuals, freelancers, and goal-oriented savers.
- Success criteria: fast transaction entry, current-month spending visibility, budget-vs-actual tracking, recurring bill awareness, and trend charts.

Strict scope for V1:
Include:
- Authentication
- Dashboard
- Transactions CRUD
- Categories CRUD
- Accounts/wallets
- Monthly budgets
- Savings goals
- Recurring transactions
- Reports and charts
- Search and filters
- Responsive desktop/tablet/mobile UI

Do NOT include:
- Open banking integrations
- Investment portfolio tracking
- Tax filing support
- Shared family accounts with advanced permissions
- AI-driven financial advice
- Automated multi-currency conversion

Tech and tooling expectations:
- Use React with TypeScript.
- Use Vite for the frontend app unless there is a strong reason not to.
- Use React Router for routing.
- Use TanStack Query for server state.
- Use Zustand for local UI state and lightweight session state.
- Use React Hook Form + Zod for forms and validation.
- Use Axios for API calls.
- Use Recharts for charts.
- Use Tailwind CSS plus a modern accessible component system such as shadcn/ui, or an equivalent modern approach.
- Use a clean, modern, finance-friendly design.

Architecture requirements:
- Use a feature-first folder structure.
- Keep shared UI in reusable components.
- Keep feature logic close to the feature.
- Separate server state, UI state, types, services, hooks, and utilities.
- Do not mix view logic, API logic, and domain utilities in the same files.

Recommended project structure:
frontend/
  src/
    app/
      router/
      providers/
      layouts/
    components/
      ui/
      charts/
      forms/
      feedback/
      tables/
    features/
      auth/
        api/
        components/
        hooks/
        pages/
        schemas/
        types/
      dashboard/
        api/
        components/
        hooks/
        pages/
        types/
      transactions/
        api/
        components/
        hooks/
        pages/
        schemas/
        types/
      categories/
      accounts/
      budgets/
      goals/
      recurring/
      reports/
      settings/
    hooks/
    services/
      api/
      auth/
    store/
    types/
    utils/
    styles/
    main.tsx

Routes/screens to build:
Public routes:
- /login
- /register
- /forgot-password
- /reset-password

Protected routes:
- /dashboard
- /transactions
- /budgets
- /goals
- /reports
- /recurring
- /accounts
- /settings

Category management placement:
- Categories do not need a top-level navigation item.
- Manage categories from Settings and also support quick category creation/editing from transaction and budget flows.

Main navigation and shell:
- App shell with sidebar + topbar.
- Sidebar items: Dashboard, Transactions, Budgets, Goals, Reports, Recurring, Accounts, Settings.
- Topbar utilities: global Add Transaction button, search, date range picker, notifications, user profile menu.
- Tablet: collapsible sidebar.
- Mobile: stacked cards, compact header, bottom/floating add-transaction action.

Component architecture:
Build these reusable components:
- AppShell
- SidebarNav
- Topbar
- ProtectedRoute
- SummaryCard
- BudgetProgressCard
- ChartCard
- RecentTransactionsList
- UpcomingRecurringList
- DataTable
- FilterBar
- SearchInput
- DateRangePicker
- EmptyState
- ErrorState
- Skeleton loaders
- ConfirmDialog
- Toast system
- TransactionModal / Drawer
- BudgetForm
- GoalForm
- RecurringForm
- AccountForm
- CategoryForm
- CSV export action

Feature-level UX expectations:
1. Authentication
- Register with email, password, display name.
- Login/logout.
- Forgot password and reset password flows.
- Form validation:
  - email unique format validation on client side
  - password min 8 chars
  - password includes upper/lowercase and number
- Route guards for authenticated vs unauthenticated screens.
- Expired session handling with redirect to login and a clear message.

2. Dashboard
Show these widgets on one screen:
- Current month income
- Current month expense
- Net balance
- Budget progress cards
- Spending by category chart
- Income vs expense trend chart
- Recent transactions list
- Upcoming recurring payments
- Savings goal progress summary

Dashboard actions:
- Add transaction
- View all transactions
- Create budget
- Add recurring bill
- Update goal contribution

3. Transactions
Fields to support in UI:
- id
- accountId
- type: income | expense | transfer
- amount
- date
- categoryId
- note
- merchant
- paymentMethod
- recurringTransactionId optional
- tags

Transaction features:
- Create, edit, delete transaction
- Filters by date, category, amount, type, account
- Search by merchant or note
- Pagination or infinite scroll
- Back-dated entries
- Transfer transaction flow with source and destination account
- Prevent negative amount input
- Category is required except for transfer
- Support tags

Transactions page UX:
- Table on desktop
- Card list on mobile
- Add/Edit modal on desktop and drawer on mobile if needed
- Mutation feedback via toast
- Refresh dashboard and balances after save/delete

4. Categories
- Provide default income and expense categories.
- Support custom categories.
- Edit icon and color.
- Archive category instead of destructive delete when in use.
- Separate income vs expense categories in UI.

5. Accounts
- Account types: bank account, credit card, cash wallet, savings account.
- Create account.
- Show current balance by account.
- Transfer funds between accounts.
- Use clear account cards and transaction summaries.

6. Budgets
Fields:
- categoryId
- month
- year
- amount
- alertThresholdPercent

Features:
- Set monthly budget by category
- View budget vs actual spend
- Visual alerts when 80%, 100%, 120% thresholds are exceeded
- Duplicate last month's budgets

7. Goals
Fields:
- name
- targetAmount
- currentAmount
- targetDate
- linkedAccountId optional
- icon
- color
- status

Features:
- Create goal
- Add contribution
- Withdraw from goal
- Track progress
- Mark goal completed

8. Recurring transactions
Fields:
- title
- type
- amount
- categoryId
- accountId
- frequency: daily | weekly | monthly | yearly
- startDate
- endDate
- nextRunDate
- autoCreateTransaction

Features:
- Create subscription or recurring salary
- Show next due date
- Pause/delete item
- Upcoming bills widget on dashboard

9. Reports
Build these report views:
- Monthly spending report
- Category breakdown
- Income vs expense trend
- Account balance trend
- Savings progress

Filters:
- Date range
- Account
- Category
- Transaction type

Export:
- CSV export in V1
- Leave PDF export as a future extension point

API integration strategy:
- Assume the backend exposes REST APIs under /api.
- Use a central Axios instance with baseURL = /api.
- Use withCredentials where refresh-cookie flows are needed.
- Attach access token using an interceptor.
- On 401, attempt one refresh call to /auth/refresh, then retry once.
- Never store refresh tokens in localStorage.
- Prefer in-memory access token storage with minimal persisted session metadata.
- Keep API modules feature-scoped where appropriate, while sharing one base client.
- Use typed DTOs/interfaces for every request and response.
- Generate stable query keys per feature.
- Invalidate related queries after mutations.
- For money-impacting mutations, prefer correctness over aggressive optimistic updates.

Expected API endpoints to integrate with:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/dashboard/summary
- GET /api/transactions
- POST /api/transactions
- GET /api/transactions/{id}
- PUT /api/transactions/{id}
- DELETE /api/transactions/{id}
- GET /api/categories
- POST /api/categories
- PUT /api/categories/{id}
- DELETE /api/categories/{id}
- GET /api/accounts
- POST /api/accounts
- PUT /api/accounts/{id}
- POST /api/accounts/transfer
- GET /api/budgets
- POST /api/budgets
- PUT /api/budgets/{id}
- DELETE /api/budgets/{id}
- GET /api/goals
- POST /api/goals
- PUT /api/goals/{id}
- POST /api/goals/{id}/contribute
- POST /api/goals/{id}/withdraw
- GET /api/recurring
- POST /api/recurring
- PUT /api/recurring/{id}
- DELETE /api/recurring/{id}
- GET /api/reports/category-spend
- GET /api/reports/income-vs-expense
- GET /api/reports/account-balance-trend
- GET /api/reports/savings-progress
- GET /api/reports/export/csv

State management rules:
- TanStack Query for server state:
  - dashboard summary
  - transactions
  - budgets
  - goals
  - recurring items
  - reports
  - accounts and categories
- Zustand for local UI state:
  - modal open/close
  - drawer state
  - active filters
  - selected date range
  - table sorting
  - theme/sidebar state
  - auth/session flags if needed
- Keep form state inside React Hook Form.
- Avoid duplicating server data into Zustand unless there is a compelling UX reason.

Validation and business rules to enforce on frontend:
- Transaction amount required and > 0
- Date required
- Account required
- Category required except transfer
- Transfer requires source + destination account
- Budget amount > 0
- Only one budget per category/month/year in UI flow
- Goal target amount > 0
- Contribution cannot exceed available balance for linked account
- Clear error messages for all validation failures

Error, loading, and empty states:
- No transactions yet -> CTA to add first transaction
- No budgets yet -> suggest budget creation
- No goals yet -> suggest goal setup
- No report data -> suggest expanding date range
- API unavailable -> reusable error banner/card
- Unauthorized/session expired -> redirect + toast/banner
- Failed chart/report fetch -> chart-specific fallback state
- Show loading skeletons on first load and subtle refetch indicators on subsequent loads

UI/UX design requirements:
- Clean, calm, finance-friendly visual style
- Strong visual hierarchy for important numbers
- Primary color family: deep blue/indigo
- Success: green
- Warning: amber
- Danger: red
- Background: light neutral gray
- Cards: white with subtle shadow
- Typography: Inter or system sans
- Make the UI modern, responsive, and uncluttered
- Favor clarity over decoration
- Provide labels, helper text, and accessible chart summaries
- Keep keyboard navigation working end to end
- Maintain WCAG-friendly contrast levels

Suggested page composition:
- Dashboard: metric cards, two main charts, recent transactions, upcoming bills, goal summaries
- Transactions: filter/search bar + data table/card list + add/edit modal
- Budgets: progress bars/cards by category, over-budget highlighting
- Goals: card grid with progress bars and contribution actions
- Reports: filters bar + charts + summary insights + CSV export button
- Recurring: list/table with next-run date and pause/delete actions
- Accounts: cards or table with balances and transfer CTA

Low-fidelity wireframe references from the requirement PDF:
Treat the following as implementation reference wireframes. Preserve the information hierarchy, actions, and data groupings, but translate them into a polished, modern, responsive UI system rather than copying the ASCII style literally.

9.1 Login Screen
+--------------------------------------------------+
|              Personal Finance Tracker            |
|--------------------------------------------------|
| Welcome back                                     |
| Email:    [______________________________]       |
| Password: [______________________________]       |
| [ Log In ]                                       |
|                                                  |
| Forgot password?                                 |
| Don't have an account? Sign up                   |
+--------------------------------------------------+

Modern interpretation guidance:
- Desktop: centered auth card with brand mark, supporting text, and strong CTA.
- Mobile: full-width stacked form with persistent primary action and clear secondary links.

9.2 Dashboard Screen
+-------------------------------------------------------------------------------+
| Logo | Dashboard | Transactions | Budgets | Goals | Reports | Search | Profile |
|-------------------------------------------------------------------------------|
| [Balance Card] [Income Card] [Expense Card] [Savings Goal Card]              |
|-------------------------------------------------------------------------------|
| Spending by Category           | Income vs Expense Trend                      |
| [Pie/Donut Chart]              | [Line/Bar Chart]                             |
|-------------------------------------------------------------------------------|
| Recent Transactions            | Upcoming Bills                               |
| - Grocery   -$42               | - Netflix   Mar 20                           |
| - Salary   +$2400              | - Rent      Mar 25                           |
| - Fuel      -$18               | - Spotify   Mar 27                           |
+-------------------------------------------------------------------------------+

Modern interpretation guidance:
- Desktop: top metric cards, two-column analytics row, two-column activity row.
- Tablet: collapse nav and stack the bottom widgets intelligently.
- Mobile: stacked cards, charts first, then activity lists, with floating add-transaction action.

9.3 Transactions List
+-------------------------------------------------------------------------------+
| Transactions                                                  [Add Transaction]|
|-------------------------------------------------------------------------------|
| Filters: [Date] [Type] [Category] [Account] [Search__________]               |
|-------------------------------------------------------------------------------|
| Date       | Merchant      | Category  | Account     | Type    | Amount       |
| 2026-03-01 | Grocery Mart  | Food      | HDFC Bank   | Expense | -42.00       |
| 2026-03-01 | Employer Inc  | Salary    | HDFC Bank   | Income  | +2400.00     |
| 2026-03-02 | Uber          | Transport | Credit Card | Expense | -11.50       |
+-------------------------------------------------------------------------------+

Modern interpretation guidance:
- Desktop: sticky filter bar + data table + row actions.
- Mobile: convert table into transaction cards with amount emphasis and inline filter drawer.

9.4 Add Transaction Modal
+--------------------------------------------+
| Add Transaction                            |
|--------------------------------------------|
| Type:     (o) Expense ( ) Income ( ) Transfer
| Amount:   [____________________]           |
| Date:     [____/____/________]             |
| Account:  [Select v]                       |
| Category: [Select v]                       |
| Merchant: [____________________]           |
| Note:     [____________________]           |
| Tags:     [____________________]           |
|                    [Cancel] [Save]         |
+--------------------------------------------+

Modern interpretation guidance:
- Desktop: modal dialog.
- Mobile: bottom sheet or full-screen drawer.
- Put the most frequent fields first for rapid entry.

9.5 Budgets Screen
+---------------------------------------------------------------------------+
| Budgets                                                        [Set Budget]|
|---------------------------------------------------------------------------|
| Food           650 / 800    [########----] 81%                            |
| Transport      120 / 250    [#####-------] 48%                            |
| Entertainment  210 / 200    [###########-] 105%                           |
| Shopping        75 / 300    [###---------] 25%                            |
+---------------------------------------------------------------------------+

Modern interpretation guidance:
- Use progress bars, threshold badges, and over-budget highlighting.
- Surface actions to duplicate last month and edit budget inline or in modal form.

9.6 Goals Screen
+---------------------------------------------------------------------------+
| Savings Goals                                                   [Add Goal] |
|---------------------------------------------------------------------------|
| Emergency Fund   45,000 / 100,000   [######------] 45%  Due: Dec 2026     |
| Vacation         20,000 / 50,000    [####--------] 40%  Due: Aug 2026     |
+---------------------------------------------------------------------------+

Modern interpretation guidance:
- Present goals as cards with progress, due date, contribution action, and status badge.

9.7 Reports Screen
+---------------------------------------------------------------------------+
| Reports                                                                   |
|---------------------------------------------------------------------------|
| Date Range: [This Month v]   Account: [All v]   Type: [All v]             |
|---------------------------------------------------------------------------|
| [Bar Chart: Category Spend]                                               |
|---------------------------------------------------------------------------|
| [Line Chart: Income vs Expense by Month]                                  |
|---------------------------------------------------------------------------|
| Top Categories: Food, Rent, Transport                                     |
+---------------------------------------------------------------------------+

Modern interpretation guidance:
- Filters should remain visible, charts should be responsive, and each report block should support loading, empty, and export states.

Performance and code quality expectations:
- Lazy load heavy routes.
- Split feature code where useful.
- Memoize expensive chart transforms.
- Debounce search input.
- Keep dashboard load fast and avoid unnecessary rerenders.
- Use strict TypeScript and avoid any.
- Centralize currency/date formatting utilities.
- Centralize query keys, route definitions, and validation schemas.
- Keep components small and composable.
- Use reusable hooks for common patterns.

Testing expectations:
- Add at least basic tests for critical flows:
  - login form validation
  - transaction form validation
  - protected route behavior
  - one or two key components/pages
- If full test coverage is not practical, prioritize auth and money-impacting flows.

Implementation notes:
- Seed UI defaults and sensible empty states.
- Use mock adapters only when necessary, but structure the code for real API integration first.
- Provide .env.example for frontend runtime/build variables if needed.
- Prefer same-origin API calls such as /api rather than hardcoding backend hostnames.
- Build the app in a way that is container-friendly for Podman deployment.

Expected output from you:
- Generate the actual frontend codebase, not only an architecture description.
- Include file structure, core pages, reusable components, API client, stores, schemas, and route protection.
- Include a concise README with setup/run/build instructions.
- Keep the code production-minded, maintainable, and easy for a hackathon team to continue.