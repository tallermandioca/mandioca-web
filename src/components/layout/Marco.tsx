import type { ReactNode } from "react";

/** Phone-width column (max 480px) centred on larger screens, like the prototype. */
export function Marco({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-paper min-[520px]:shadow-[0_0_0_1px_var(--line)]">
      {children}
    </div>
  );
}

export function Contenido({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main className={`flex flex-1 flex-col gap-[14px] px-[18px] pt-4 pb-6 ${className}`}>{children}</main>
  );
}
