import { useEffect, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
  children,
  open,
  onClose,
  title,
}: PropsWithChildren<{ open: boolean; onClose: () => void; title: string }>) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex min-h-dvh items-end justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.22)] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[1.5rem]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
          <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h3>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
