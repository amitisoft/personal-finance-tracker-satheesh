import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Session, User } from "@/types/domain";

interface AuthState {
  session: Session | null;
  user: User | null;
  expiredMessage: string | null;
  hasHydrated: boolean;
  setSession: (session: Session | null) => void;
  setExpiredMessage: (message: string | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      expiredMessage: null,
      hasHydrated: false,
      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
        }),
      setExpiredMessage: (expiredMessage) => set({ expiredMessage }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () => set({ session: null, user: null, expiredMessage: null }),
    }),
    {
      name: "finance-auth-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        state?.setSession(state.session ?? null);
        state?.setHasHydrated(true);
      },
    },
  ),
);
