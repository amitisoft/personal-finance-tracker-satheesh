import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { z } from "zod";
import { register } from "@/features/auth/api/auth-api";
import { registerSchema } from "@/features/auth/schemas/auth-schemas";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { routes } from "@/utils/routes";
import { useAuthStore } from "@/store/auth-store";

type FormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });
  const watchedEmail = form.watch("email");
  const watchedPassword = form.watch("password");
  const watchedConfirmPassword = form.watch("confirmPassword");
  const watchedDisplayName = form.watch("displayName");

  useEffect(() => {
    if (authError) {
      setAuthError(null);
    }
  }, [watchedEmail, watchedPassword, watchedConfirmPassword, watchedDisplayName]);

  const mutation = useMutation({
    mutationFn: ({ displayName, email, password }: FormValues) => register({ displayName, email, password }),
    onSuccess: (session) => {
      setSession(session);
      navigate(routes.dashboard);
    },
    onError: (error) => {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      setAuthError(apiMessage || (error instanceof Error ? error.message : "Unable to create your account."));
    },
  });

  const shouldSuggestLogin = authError?.toLowerCase().includes("log in") ?? false;

  return (
    <AuthFormShell title="Create your account" description="Set up a secure workspace for budgets, goals, and transaction tracking.">
      {authError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-900">Unable to sign up</p>
              <p className="mt-1">{authError}</p>
              {shouldSuggestLogin ? (
                <p className="mt-2">
                  <Link className="font-medium text-amber-900 underline" to={routes.login}>
                    Go to log in
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Display name</label>
          <Input {...form.register("displayName")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.displayName?.message}</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <Input type="email" {...form.register("email")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.email?.message}</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <Input type="password" {...form.register("password")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.password?.message}</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
          <Input type="password" {...form.register("confirmPassword")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.confirmPassword?.message}</p>
        </div>
        <Button className="w-full" type="submit" disabled={mutation.isPending}>
          Sign up
        </Button>
      </form>
      <p className="text-sm text-slate-500">
        Already have an account? <Link to={routes.login}>Log in</Link>
      </p>
    </AuthFormShell>
  );
}
