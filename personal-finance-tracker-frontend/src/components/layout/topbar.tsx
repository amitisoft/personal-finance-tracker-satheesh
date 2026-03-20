import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, CalendarClock, LogOut, Menu, Plus, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { routes } from "@/utils/routes";
import { toastSuccess } from "@/components/feedback/toast";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";
import { dismissNotifications, getNotificationState, markNotificationsSeen } from "@/features/notifications/api/notifications-api";
import type { NotificationState } from "@/types/domain";
import { formatCurrency, formatDate } from "@/utils/format";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  meta: string;
  tone: "amber" | "red" | "blue";
}

const MAX_INITIAL_NOTIFICATIONS = 4;

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const openTransactionModal = useUiStore((state) => state.openTransactionModal);
  const search = useUiStore((state) => state.search);
  const setSearch = useUiStore((state) => state.setSearch);
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const { data } = useFinanceData();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const showTransactionSearch = location.pathname === routes.transactions;
  const notificationStateQueryKey = useMemo(() => ["notification-state", session?.user?.id] as const, [session?.user?.id]);

  const { data: notificationState } = useQuery({
    queryKey: notificationStateQueryKey,
    queryFn: getNotificationState,
    enabled: Boolean(session?.user?.id),
  });

  const seenNotificationIds = notificationState?.seenIds ?? [];
  const dismissedNotificationIds = notificationState?.dismissedIds ?? [];

  const markSeenMutation = useMutation({
    mutationFn: markNotificationsSeen,
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: notificationStateQueryKey });
      const previous = queryClient.getQueryData<NotificationState>(notificationStateQueryKey);
      queryClient.setQueryData<NotificationState>(notificationStateQueryKey, {
        seenIds: Array.from(new Set([...(previous?.seenIds ?? []), ...notificationIds])),
        dismissedIds: previous?.dismissedIds ?? [],
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationStateQueryKey, context.previous);
      }
    },
    onSuccess: (state) => {
      queryClient.setQueryData(notificationStateQueryKey, state);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: dismissNotifications,
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: notificationStateQueryKey });
      const previous = queryClient.getQueryData<NotificationState>(notificationStateQueryKey);
      queryClient.setQueryData<NotificationState>(notificationStateQueryKey, {
        seenIds: Array.from(new Set([...(previous?.seenIds ?? []), ...notificationIds])),
        dismissedIds: Array.from(new Set([...(previous?.dismissedIds ?? []), ...notificationIds])),
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationStateQueryKey, context.previous);
      }
    },
    onSuccess: (state) => {
      queryClient.setQueryData(notificationStateQueryKey, state);
    },
  });

  const incomingNotifications = useMemo(() => {
    const items: NotificationItem[] = [];

    if (!data) {
      return items;
    }

    const categoryMap = new Map(data.categories.map((category) => [category.id, category]));

    for (const budget of data.budgets) {
      if (budget.amount <= 0 || budget.spent <= 0) {
        continue;
      }

      const percent = Math.round((budget.spent / budget.amount) * 100);
      const categoryName = categoryMap.get(budget.categoryId)?.name ?? "Category";

      if (percent >= 120) {
        items.push({
          id: `budget-${budget.id}-120-${percent}`,
          title: `${categoryName} budget critical`,
          description: `${categoryName} reached ${percent}%, crossing the 120% critical threshold.`,
          meta: `${percent}% used - ${formatCurrency(budget.spent)} spent`,
          tone: "red",
        });
        continue;
      }

      if (percent >= 100) {
        items.push({
          id: `budget-${budget.id}-100-${percent}`,
          title: `${categoryName} budget exceeded`,
          description: `${categoryName} reached ${percent}% and is now above its monthly budget.`,
          meta: `${percent}% used - ${formatCurrency(budget.spent)} spent`,
          tone: "red",
        });
        continue;
      }

      if (percent >= budget.alertThresholdPercent) {
        items.push({
          id: `budget-${budget.id}-threshold-${percent}`,
          title: `${categoryName} budget warning`,
          description: `${categoryName} reached ${percent}%, crossing the ${budget.alertThresholdPercent}% warning threshold.`,
          meta: `${percent}% used - ${formatCurrency(budget.spent)} spent`,
          tone: "amber",
        });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingWindowEnd = new Date(today);
    upcomingWindowEnd.setDate(upcomingWindowEnd.getDate() + 3);

    const recurringItems = data.recurring
      .filter((item) => {
        if (item.paused) {
          return false;
        }

        const nextRunDate = new Date(item.nextRunDate);
        nextRunDate.setHours(0, 0, 0, 0);

        if (Number.isNaN(nextRunDate.getTime())) {
          return false;
        }

        return nextRunDate > today && nextRunDate <= upcomingWindowEnd;
      })
      .slice()
      .sort((left, right) => new Date(left.nextRunDate).getTime() - new Date(right.nextRunDate).getTime())
      .slice(0, 3);

    for (const item of recurringItems) {
      items.push({
        id: `recurring-${item.id}-${item.nextRunDate}`,
        title: `${item.title} due soon`,
        description: `Upcoming ${item.frequency} ${item.type} is scheduled for ${formatDate(item.nextRunDate)}.`,
        meta: formatCurrency(item.amount),
        tone: "blue",
      });
    }

    return items;
  }, [data]);

  const visibleNotifications = useMemo(
    () => incomingNotifications.filter((item) => !dismissedNotificationIds.includes(item.id)),
    [incomingNotifications, dismissedNotificationIds],
  );

  const unreadNotifications = useMemo(
    () => visibleNotifications.filter((item) => !seenNotificationIds.includes(item.id)),
    [visibleNotifications, seenNotificationIds],
  );

  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    const handleOutside = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [notificationsOpen]);

  const handleLogout = () => {
    logout();
    toastSuccess("Logged out");
    navigate(routes.login);
  };

  const dismissNotification = (id: string) => {
    dismissMutation.mutate([id]);
  };

  const toggleNotifications = () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);

    if (nextOpen && unreadNotifications.length) {
      markSeenMutation.mutate(unreadNotifications.map((item) => item.id));
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2 sm:gap-3">
        <button className="rounded-xl p-2 hover:bg-slate-100 lg:hidden" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>

        {showTransactionSearch ? (
          <div className="hidden min-w-0 flex-1 lg:block">
            <Input
              placeholder="Search transactions by merchant, note, or type"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button className="gap-2 whitespace-nowrap bg-[linear-gradient(135deg,_#1c2f73,_#3158d8)] px-3 text-white shadow-[0_14px_28px_-18px_rgba(28,47,115,0.65)] hover:bg-[linear-gradient(135deg,_#16265e,_#274cc4)] sm:px-4" onClick={() => openTransactionModal()}>
            <Plus size={16} />
            <span className="hidden sm:inline">Add transaction</span>
          </Button>

          <div className="relative" ref={panelRef}>
            <button
              className={`relative rounded-xl bg-white p-2 shadow-soft transition ${unreadCount ? "notification-bell" : ""}`}
              aria-label="Notifications"
              onClick={toggleNotifications}
            >
              <Bell size={18} />
              {unreadCount ? (
                <span className="notification-badge absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
            {notificationsOpen ? (
              <div className="fixed left-4 right-4 top-24 z-40 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-[380px] sm:max-w-[calc(100vw-2rem)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Notifications</h3>
                    <p className="text-xs text-slate-500">Budget and recurring activity alerts</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{visibleNotifications.length} items</span>
                </div>
                <div className={`mt-4 space-y-3 ${visibleNotifications.length > MAX_INITIAL_NOTIFICATIONS ? "max-h-[29rem] overflow-y-auto pr-2" : ""}`}>
                  {visibleNotifications.length ? (
                    visibleNotifications.map((item) => (
                      <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-xl p-2 ${item.tone === "blue" ? "bg-brand-100 text-brand-700" : item.tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                            {item.tone === "blue" ? <CalendarClock size={16} /> : <AlertTriangle size={16} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-medium text-slate-900">{item.title}</p>
                              <button
                                type="button"
                                onClick={() => dismissNotification(item.id)}
                                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                aria-label={`Dismiss ${item.title}`}
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                            <p className="mt-2 text-xs text-slate-500">{item.meta}</p>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">No notifications right now.</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden max-w-[12rem] truncate rounded-xl bg-white px-3 py-2 text-sm shadow-soft sm:block">{session?.user?.displayName ?? "Guest"}</div>

          <Button variant="secondary" className="gap-2 whitespace-nowrap px-3 sm:px-4" onClick={handleLogout}>
            <LogOut size={16} />
            <span className="hidden md:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

