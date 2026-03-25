import { LockKeyhole } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { changePassword } from "@/features/auth/api/auth-api";
import { changePasswordSchema } from "@/features/auth/schemas/auth-schemas";
import { toastError, toastSuccess } from "@/components/feedback/toast";
import type { z } from "zod";
import { useState } from "react";

type PasswordFormValues = z.infer<typeof changePasswordSchema>;

function ChangePasswordSection() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: ({ currentPassword, password }: PasswordFormValues) => changePassword({ currentPassword, password }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finance-state"] });
      toastSuccess("Password updated");
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toastError(error instanceof Error ? error.message : "Unable to update password");
    },
  });

  return (
    <>
      <Card className="border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Password</h3>
            <p className="mt-1 text-sm text-slate-500">Change your password using your current password.</p>
          </div>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <LockKeyhole size={16} />
            Edit password
          </Button>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit password">
        <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Current password</label>
            <Input type="password" {...form.register("currentPassword")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.currentPassword?.message}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">New password</label>
            <Input type="password" {...form.register("password")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.password?.message}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</label>
            <Input type="password" {...form.register("confirmPassword")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.confirmPassword?.message}</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>Update password</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-slate-500">Account security settings.</p>
      </div>
      <ChangePasswordSection />
    </div>
  );
}
