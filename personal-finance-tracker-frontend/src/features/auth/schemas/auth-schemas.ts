import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/\d/, "Password must include a number");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    displayName: z.string().min(2, "Display name is required"),
    email: z.string().email("Enter a valid email"),
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    token: z.string().optional(),
    currentPassword: z.string().optional(),
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    if (!values.token) {
      if (!values.email) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Email is required", path: ["email"] });
      }

      if (!values.currentPassword) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Current password is required", path: ["currentPassword"] });
      }
    }

    if (values.password !== values.confirmPassword) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords must match", path: ["confirmPassword"] });
    }
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });
