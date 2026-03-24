import { useEffect, useState } from "react";
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
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setInlineError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: saveTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance-state"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      setInlineError(null);
      toastSuccess(editingTransaction ? "Transaction updated" : "Transaction saved");
      close();
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setInlineError("This shared account is read-only for you. Ask the owner to change your role to Editor if you need to add or edit transactions.");
        return;
      }

      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message ?? error.response?.data?.detail : null;
      const message = apiMessage || (error instanceof Error ? error.message : "Unable to save transaction");
      setInlineError(message);
      toastError(message);
    },
  });

  return (
    <Modal open={open} onClose={close} title={editingTransaction ? "Edit transaction" : "Add transaction"}>
      {data ? (
        <div className="space-y-4">
          {inlineError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {inlineError}
            </div>
          ) : null}
          <TransactionForm
            key={editingTransaction?.id ?? "new-transaction"}
            accounts={data.accounts}
            categories={data.categories}
            initialValues={editingTransaction ?? undefined}
            onSubmit={(values) => {
              setInlineError(null);
              mutation.mutate(values);
            }}
          />
        </div>
      ) : null}
    </Modal>
  );
}
