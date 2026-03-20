import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { z } from "zod";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { resetPasswordSchema } from "@/features/auth/schemas/auth-schemas";
import { resetPassword } from "@/features/auth/api/auth-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toastSuccess } from "@/components/feedback/toast";
import { routes } from "@/utils/routes";
import { useAuthStore } from "@/store/auth-store";

type FormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const [resetError, setResetError] = useState<string | null>(null);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tokenFromQuery = searchParams.get("token") ?? undefined;
  const emailFromQuery = searchParams.get("email") ?? undefined;
  const emailFromState = typeof location.state?.email === "string" ? location.state.email : "";
  const initialEmail = emailFromQuery ?? emailFromState;
  const isTokenReset = Boolean(tokenFromQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: initialEmail, token: tokenFromQuery, currentPassword: "", password: "", confirmPassword: "" },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (resetError) {
      setResetError(null);
    }
  }, [watchedValues.email, watchedValues.currentPassword, watchedValues.password, watchedValues.confirmPassword, watchedValues.token]);

  const mutation = useMutation({
    mutationFn: ({ token, email, currentPassword, password }: FormValues) =>
      resetPassword({
        token: token || undefined,
        email: email || undefined,
        currentPassword: currentPassword || undefined,
        password,
      }),
    onSuccess: () => {
      logout();
      toastSuccess("Password updated. Please log in again.");
      navigate(routes.login, { replace: true, state: { email: form.getValues("email") } });
    },
    onError: (error) => {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      setResetError(apiMessage || (error instanceof Error ? error.message : "Unable to reset password."));
    },
  });

  return (
    <AuthFormShell
      title="Reset password"
      description={
        isTokenReset
          ? "Choose a new password for the reset link you opened."
          : "Enter your current password, then choose a new password to sign in again."
      }
    >
      {resetError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-rose-800">Unable to reset password</p>
              <p className="mt-1">{resetError}</p>
            </div>
          </div>
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        {!isTokenReset ? (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <Input type="email" {...form.register("email")} />
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.email?.message}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Current password</label>
              <Input type="password" {...form.register("currentPassword")} />
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.currentPassword?.message}</p>
            </div>
          </>
        ) : null}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
          <Input type="password" {...form.register("password")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.password?.message}</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
          <Input type="password" {...form.register("confirmPassword")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.confirmPassword?.message}</p>
        </div>
        <Button className="w-full" type="submit" disabled={mutation.isPending}>
          Reset password
        </Button>
      </form>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link to={routes.forgotPassword}>Forgot password?</Link>
        <Link to={routes.login}>Back to login</Link>
      </div>
    </AuthFormShell>
  );
}
