import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type { z } from "zod";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { forgotPasswordSchema } from "@/features/auth/schemas/auth-schemas";
import { forgotPassword } from "@/features/auth/api/auth-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toastSuccess } from "@/components/feedback/toast";
import { routes } from "@/utils/routes";

type FormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (result) => {
      setResetUrl(result.resetUrl ?? null);
      toastSuccess(result.resetUrl ? "Reset link generated" : "If the email exists, reset instructions are ready.");
    },
  });

  return (
    <AuthFormShell title="Forgot password" description="Enter your email and we will prepare a reset link for your account.">
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <Input type="email" {...form.register("email")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.email?.message}</p>
        </div>
        <Button className="w-full" type="submit" disabled={mutation.isPending}>
          Send reset link
        </Button>
      </form>
      {resetUrl ? (
        <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Development reset link</p>
          <p className="mt-1">Email delivery is not wired yet, so you can open the reset page directly from this link.</p>
          <a className="mt-3 inline-block break-all font-medium text-brand-700 underline" href={resetUrl}>
            {resetUrl}
          </a>
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <Link to={routes.resetPassword}>Reset password manually</Link>
        <Link to={routes.login}>Back to login</Link>
      </div>
    </AuthFormShell>
  );
}
