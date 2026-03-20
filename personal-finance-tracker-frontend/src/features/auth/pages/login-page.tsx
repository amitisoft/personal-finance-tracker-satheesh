import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { z } from "zod";
import { login } from "@/features/auth/api/auth-api";
import { loginSchema } from "@/features/auth/schemas/auth-schemas";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { routes } from "@/utils/routes";
import { useAuthStore } from "@/store/auth-store";
import { toastSuccess } from "@/components/feedback/toast";

type FormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const expiredMessage = useAuthStore((state) => state.expiredMessage);
  const setExpiredMessage = useAuthStore((state) => state.setExpiredMessage);
  const [authError, setAuthError] = useState<string | null>(null);
  const emailFromState = typeof location.state?.email === "string" ? location.state.email : "";
  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: emailFromState, password: "" },
  });
  const watchedEmail = form.watch("email");
  const watchedPassword = form.watch("password");

  useEffect(() => {
    if (authError) {
      setAuthError(null);
    }
  }, [watchedEmail, watchedPassword]);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      setSession(session);
      setExpiredMessage(null);
      setAuthError(null);
      toastSuccess("Signed in successfully");
      navigate(location.state?.from ?? routes.dashboard);
    },
    onError: (error) => {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      setAuthError(apiMessage || (error instanceof Error ? error.message : "Unable to sign in with those credentials."));
    },
  });

  const shouldSuggestSignUp = authError?.toLowerCase().includes("sign up") ?? false;

  return (
    <AuthFormShell title="Login" description="Sign in to continue tracking income, expenses, budgets, and savings goals.">
      {expiredMessage ? <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">{expiredMessage}</div> : null}
      {authError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-rose-800">Unable to log in</p>
              <p className="mt-1">{authError}</p>
              {shouldSuggestSignUp ? (
                <p className="mt-2">
                  <Link className="font-medium text-rose-800 underline" to={routes.register}>
                    Go to sign up
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <Input type="email" placeholder="Email" className="h-12 rounded-xl border-slate-300 px-4 text-base" {...form.register("email")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.email?.message}</p>
        </div>
        <div>
          <Input type="password" placeholder="Password" className="h-12 rounded-xl border-slate-300 px-4 text-base" {...form.register("password")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.password?.message}</p>
        </div>
        <Button className="mx-auto flex h-12 min-w-[11rem] rounded-full bg-brand-600 px-8 text-base font-semibold text-white shadow-[0_12px_25px_-12px_rgba(37,99,235,0.7)] hover:bg-brand-700" type="submit" disabled={mutation.isPending}>
          Sign In
        </Button>
      </form>
      <div className="space-y-4 text-center text-sm text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link className="hover:text-slate-700 hover:underline" to={routes.forgotPassword}>
            Forgot password?
          </Link>
          <Link className="font-medium text-brand-700 hover:text-brand-800 hover:underline" to={routes.resetPassword} state={{ email: watchedEmail }}>
            Reset password
          </Link>
        </div>
        <p>
          New User?{" "}
          <Link className="font-semibold text-slate-900 underline underline-offset-2 hover:text-brand-700" to={routes.register}>
            Sign Up
          </Link>
        </p>
      </div>
    </AuthFormShell>
  );
}
