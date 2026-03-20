import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex min-h-40 flex-col items-start justify-center gap-3 border border-dashed border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
      {action}
    </Card>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <Card className="border border-rose-100 bg-rose-50">
      <h3 className="text-lg font-semibold text-rose-700">Something went wrong</h3>
      <p className="mt-2 text-sm text-rose-600">{message}</p>
      {retry ? (
        <Button variant="danger" className="mt-4" onClick={retry}>
          Try again
        </Button>
      ) : null}
    </Card>
  );
}

export function SkeletonCard() {
  return <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />;
}
