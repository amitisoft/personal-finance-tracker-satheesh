import { useQuery } from "@tanstack/react-query";
import { getFinanceState } from "@/features/finance/api/finance-api";
import { useAuthStore } from "@/store/auth-store";

export function useFinanceData() {
  const userId = useAuthStore((state) => state.session?.user?.id);

  return useQuery({
    queryKey: ["finance-state", userId],
    queryFn: getFinanceState,
    enabled: Boolean(userId),
  });
}
