import { cn } from "@/utils/cn";

export function Badge({
  children,
  tone = "slate",
}: {
  children: string;
  tone?: "slate" | "green" | "amber" | "red" | "blue";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-brand-50 text-brand-700",
  };

  return <span className={cn("rounded-full px-3 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}
