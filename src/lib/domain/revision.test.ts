import { describe, expect, it } from "vitest";
import { calcularProximaRevision, diasHasta, fechaRecordatorio, semaforo } from "./revision";

const d = (iso: string) => new Date(`${iso}T00:00:00`);

describe("calcularProximaRevision", () => {
  it("adds the template months to the closing date", () => {
    expect(calcularProximaRevision(d("2026-10-08"), 6)).toEqual(d("2027-04-08"));
    expect(calcularProximaRevision(d("2026-01-31"), 1)).toEqual(d("2026-02-28"));
    expect(calcularProximaRevision(d("2026-10-08"), 0)).toEqual(d("2026-10-08"));
  });
});

describe("fechaRecordatorio", () => {
  it("is seven days before the revision", () => {
    expect(fechaRecordatorio(d("2027-04-08"))).toEqual(d("2027-04-01"));
  });
});

describe("semaforo", () => {
  const hoy = d("2026-10-08");

  it("is vencida when the revision date is in the past", () => {
    expect(semaforo(d("2026-09-15"), hoy)).toBe("vencida");
    expect(semaforo(d("2026-10-07"), hoy)).toBe("vencida");
  });

  it("is proxima when due within 30 days, including today", () => {
    expect(semaforo(d("2026-10-08"), hoy)).toBe("proxima");
    expect(semaforo(d("2026-10-31"), hoy)).toBe("proxima");
    expect(semaforo(d("2026-11-07"), hoy)).toBe("proxima");
  });

  it("is al_dia when more than 30 days away", () => {
    expect(semaforo(d("2026-11-08"), hoy)).toBe("al_dia");
    expect(semaforo(d("2027-01-05"), hoy)).toBe("al_dia");
  });

  it("is sin_fecha when there is no revision date", () => {
    expect(semaforo(null, hoy)).toBe("sin_fecha");
  });
});

describe("diasHasta", () => {
  it("counts whole days between two dates", () => {
    expect(diasHasta(d("2026-10-08"), d("2026-10-31"))).toBe(23);
    expect(diasHasta(d("2026-10-08"), d("2026-09-15"))).toBe(-23);
  });
});
