/** Sign-out as a POST form so link prefetching can never log the user out. */
export function BotonSalir() {
  return (
    <form action="/auth/salir" method="post">
      <button
        type="submit"
        className="min-h-10 rounded-sm border border-[#4A443D] px-[10px] py-2 text-[13px] font-semibold text-[#C9C0B2]"
      >
        Salir
      </button>
    </form>
  );
}
