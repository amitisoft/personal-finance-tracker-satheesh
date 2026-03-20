import { z } from "zod";

const today = new Date().toISOString().slice(0, 10);

export const transactionSchema = z
  .object({
    id: z.string().optional().default(""),
    accountId: z.string().min(1, "Account is required"),
    destinationAccountId: z.string().optional(),
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
    date: z.string().min(1, "Date is required"),
    categoryId: z.string().optional(),
    merchant: z.string().optional(),
    note: z.string().optional(),
    paymentMethod: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.date > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: "Date cannot be in the future",
      });
    }

    if (values.type !== "transfer" && !values.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryId"],
        message: "Category is required unless this is a transfer",
      });
    }

    if (values.type === "transfer" && !values.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationAccountId"],
        message: "Destination account is required for transfers",
      });
    }

    if (values.type === "transfer" && values.accountId && values.destinationAccountId && values.accountId === values.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationAccountId"],
        message: "Source and destination accounts must be different",
      });
    }
  });
