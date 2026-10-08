"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ClipboardList, Home, Images, ShoppingBag, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ItemNav {
  href: string;
  etiqueta: string;
  icono: "inicio" | "trabajos" | "venta" | "cuenta" | "ordenes" | "avisos";
}

const iconos: Record<ItemNav["icono"], LucideIcon> = {
  inicio: Home,
  trabajos: Images,
  venta: ShoppingBag,
  cuenta: User,
  ordenes: ClipboardList,
  avisos: Bell,
};

export const NAV_PUBLICO: ItemNav[] = [
  { href: "/", etiqueta: "Inicio", icono: "inicio" },
  { href: "/trabajos", etiqueta: "Trabajos", icono: "trabajos" },
  { href: "/en-venta", etiqueta: "En venta", icono: "venta" },
  { href: "/mi-cuenta", etiqueta: "Mi cuenta", icono: "cuenta" },
];

export const NAV_TALLER: ItemNav[] = [
  { href: "/taller", etiqueta: "Órdenes", icono: "ordenes" },
  { href: "/taller/clientes", etiqueta: "Clientes", icono: "cuenta" },
  { href: "/taller/avisos", etiqueta: "Avisos", icono: "avisos" },
  { href: "/taller/muestrario", etiqueta: "En venta", icono: "venta" },
];

function activo(pathname: string, href: string): boolean {
  if (href === "/" || href === "/taller") return pathname === href;
  if (href === "/mi-cuenta") return pathname.startsWith("/mi-cuenta") || pathname.startsWith("/ingreso");
  return pathname.startsWith(href);
}

/** Sticky bottom navigation, 44px+ targets, safe-area aware. */
export function NavInferior({ items }: { items: ItemNav[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="sticky bottom-0 z-10 flex justify-around border-t border-line bg-card px-1 pt-1.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))]"
    >
      {items.map((item) => {
        const Icono = iconos[item.icono];
        const on = activo(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-[3px] text-[11px] no-underline ${
              on ? "font-semibold text-red" : "font-medium text-ink2"
            }`}
          >
            <Icono className="size-[22px]" aria-hidden />
            {item.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
