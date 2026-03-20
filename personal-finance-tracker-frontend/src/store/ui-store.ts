import { create } from "zustand";
import type { Transaction } from "@/types/domain";

interface UiState {
  sidebarOpen: boolean;
  transactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  search: string;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  openTransactionModal: (transaction?: Transaction) => void;
  closeTransactionModal: () => void;
  setSearch: (value: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  transactionModalOpen: false,
  editingTransaction: null,
  search: "",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  openTransactionModal: (transaction) => set({ transactionModalOpen: true, editingTransaction: transaction ?? null }),
  closeTransactionModal: () => set({ transactionModalOpen: false, editingTransaction: null }),
  setSearch: (search) => set({ search }),
}));
