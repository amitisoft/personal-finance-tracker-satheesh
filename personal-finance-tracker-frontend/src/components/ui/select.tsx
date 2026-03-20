import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  props,
  ref,
) {
  return (
    <select
      ref={ref}
      {...props}
      className={cn(
        "w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500",
        props.className,
      )}
    />
  );
});
