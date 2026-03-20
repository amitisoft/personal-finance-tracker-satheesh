import { transactionSchema } from "@/features/transactions/schemas/transaction-schema";

describe("transaction schema", () => {
  it("requires category for expense", () => {
    const result = transactionSchema.safeParse({
      accountId: "a1",
      type: "expense",
      amount: 120,
      date: "2026-03-15",
      categoryId: "",
    });
    expect(result.success).toBe(false);
  });

  it("requires destination account for transfer", () => {
    const result = transactionSchema.safeParse({
      accountId: "a1",
      type: "transfer",
      amount: 120,
      date: "2026-03-15",
    });
    expect(result.success).toBe(false);
  });
});