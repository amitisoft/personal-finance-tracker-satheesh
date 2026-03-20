import type { PropsWithChildren } from "react";
import { cn } from "@/utils/cn";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn("rounded-2xl bg-white p-5 shadow-soft", className)}>{children}</section>;
}
