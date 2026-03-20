import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { useUiStore } from "@/store/ui-store";
import { useFinanceData } from "@/features/common/hooks/use-finance-data";
import TransactionForm from "@/features/transactions/components/transaction-form";
import { saveTransaction } from "@/features/finance/api/finance-api";
import { toastError, toastSuccess } from "@/components/feedback/toast";

export function TransactionModal() {
  const open = useUiStore((state) => state.transactionModalOpen);
  const editingTransaction = useUiStore((state) => state.editingTransaction);
  const close = useUiStore((state) => state.closeTransactionModal);
  const queryClient = useQueryClient();
  const { data } = useFinanceData();
  const mutation = useMutation({
    mutationFn: saveTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      toastSuccess(editingTransaction ? "Transaction updated" : "Transaction saved");
      close();
    },
    onError: (error) => {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message ?? error.response?.data?.detail : null;
      toastError(apiMessage || (error instanceof Error ? error.message : "Unable to save transaction"));
    },
  });

  return (
    <Modal open={open} onClose={close} title={editingTransaction ? "Edit transaction" : "Add transaction"}>
      {data ? (
        <TransactionForm
          key={editingTransaction?.id ?? "new-transaction"}
          accounts={data.accounts}
          categories={data.categories}
          initialValues={editingTransaction ?? undefined}
          onSubmit={(values) => mutation.mutate(values)}
        />
      ) : null}
    </Modal>
  );
}
