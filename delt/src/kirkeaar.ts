/**
 * Kirkeåret i Den norske kirke.
 *
 * Datoene i kirkeåret styres av påsken, som flytter seg. Vi regner ut
 * påskedag med Meeus/Jones/Butcher-algoritmen og avleder resten derfra.
 * Fargene er de liturgiske fargene på paramentene i kirkerommet, oppgitt
 * som heksverdier slik at både nett og app kan bruke dem direkte.
 */

export type SesongId =
  | "advent"
  | "jul"
  | "apenbaring"
  | "faste"
  | "paske"
  | "pinse"
  | "treenighet";

export type Sesong = {
  id: SesongId;
  navn: string;
  farge: string;
  /** Hva fargen heter i kirkerommet – brukes som forklaring. */
  fargenavn: string;
};

export const FIOLETT = "#59468c";
export const GULL = "#a07a1c";
export const ROD = "#99332a";
export const GRONN = "#3d6b55";

const SESONGER: Record<SesongId, Sesong> = {
  advent: { id: "advent", navn: "Advent", farge: FIOLETT, fargenavn: "fiolett" },
  jul: { id: "jul", navn: "Juletiden", farge: GULL, fargenavn: "hvit" },
  apenbaring: {
    id: "apenbaring",
    navn: "Åpenbaringstiden",
    farge: GRONN,
    fargenavn: "grønn",
  },
  faste: { id: "faste", navn: "Fastetiden", farge: FIOLETT, fargenavn: "fiolett" },
  paske: { id: "paske", navn: "Påsketiden", farge: GULL, fargenavn: "hvit" },
  pinse: { id: "pinse", navn: "Pinse", farge: ROD, fargenavn: "rød" },
  treenighet: {
    id: "treenighet",
    navn: "Treenighetstiden",
    farge: GRONN,
    fargenavn: "grønn",
  },
};

function utc(year: number, month: number, day: number) {
  return Date.UTC(year, month - 1, day);
}

function leggTilDager(ms: number, dager: number) {
  return ms + dager * 86400000;
}

/** Påskedag (søndag) for et gitt år, som UTC-millisekunder. */
export function paskedag(year: number): number {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month, day);
}

/** Første søndag i advent: fjerde søndag før 1. juledag. */
export function forsteAdventsdag(year: number): number {
  const juledag = utc(year, 12, 25);
  const ukedag = new Date(juledag).getUTCDay(); // 0 = søndag
  const sisteSondagForJul = leggTilDager(juledag, ukedag === 0 ? -7 : -ukedag);
  return leggTilDager(sisteSondagForJul, -21);
}

/**
 * Hvilken tid i kirkeåret en dato hører til.
 * Grensene følger Den norske kirkes ordning for hovedgudstjenesten.
 */
export function sesongFor(dato: Date): Sesong {
  const d = utc(dato.getFullYear(), dato.getMonth() + 1, dato.getDate());
  const ar = dato.getFullYear();

  const advent = forsteAdventsdag(ar);
  if (d >= advent && d <= utc(ar, 12, 23)) return SESONGER.advent;
  if (d >= utc(ar, 12, 24)) return SESONGER.jul;
  if (d <= utc(ar, 1, 5)) return SESONGER.jul;

  const paske = paskedag(ar);
  const askeonsdag = leggTilDager(paske, -46);
  const pinsedag = leggTilDager(paske, 49);
  const treenighetssondag = leggTilDager(paske, 56);

  if (d < askeonsdag) return SESONGER.apenbaring;
  if (d < paske) return SESONGER.faste;
  if (d < pinsedag) return SESONGER.paske;
  if (d < treenighetssondag) return SESONGER.pinse;
  return SESONGER.treenighet;
}

export function sesong(id: SesongId): Sesong {
  return SESONGER[id];
}
