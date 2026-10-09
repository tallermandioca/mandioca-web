/** Sign-out as a POST form so link prefetching can never log the user out. */
export function BotonSalir({ tono = "oscuro" }: { tono?: "oscuro" | "claro" }) {
  const clases = tono === "oscuro" ? "border-[#4A443D] text-[#C9C0B2]" : "border-ink text-ink";
  return (
    <form action="/auth/salir" method="post">
      <button
        type="submit"
        className={`min-h-10 rounded-sm border px-[10px] py-2 text-[13px] font-semibold ${clases}`}
      >
        Salir
      </button>
    </form>
  );
}
