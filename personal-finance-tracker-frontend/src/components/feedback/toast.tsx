import { create } from "zustand";

type Toast = { id: number; title: string; tone: "success" | "error" };

interface ToastState {
  items: Toast[];
  push: (item: Omit<Toast, "id">) => void;
  remove: (id: number) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (item) =>
    set((state) => ({
      items: [...state.items, { id: Date.now(), ...item }],
    })),
  remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}));

export function toastSuccess(title: string) {
  useToastStore.getState().push({ title, tone: "success" });
}

export function toastError(title: string) {
  useToastStore.getState().push({ title, tone: "error" });
}

export function ToastViewport() {
  const items = useToastStore((state) => state.items);
  const remove = useToastStore((state) => state.remove);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm shadow-soft ${
            item.tone === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
          onAnimationEnd={() => remove(item.id)}
          style={{ animation: "fadeout 4s forwards" }}
        >
          {item.title}
        </div>
      ))}
      <style>{`@keyframes fadeout {0%,80%{opacity:1}100%{opacity:0}}`}</style>
    </div>
  );
}
