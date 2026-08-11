import type { ArrangementMedAntall } from "./typer";

export type Pameldingsstatus =
  | { apen: true; ledige: number | null }
  | { apen: false; grunn: "stengt" | "fullt" | "over" };

/**
 * Om påmeldingen er åpen. Regnes likt på nett, i appen og på serveren,
 * slik at ingen får se en «Meld på»-knapp for noe som er stengt.
 */
export function pameldingsstatus(
  a: ArrangementMedAntall,
  na = Date.now(),
): Pameldingsstatus {
  if (new Date(a.starter).getTime() < na) return { apen: false, grunn: "over" };
  if (a.pamelding_stenger && new Date(a.pamelding_stenger).getTime() < na)
    return { apen: false, grunn: "stengt" };
  if (a.kapasitet !== null) {
    const ledige = a.kapasitet - a.antall_pameldte;
    if (ledige <= 0) return { apen: false, grunn: "fullt" };
    return { apen: true, ledige };
  }
  return { apen: true, ledige: null };
}

/** Teksten som beskriver plassituasjonen. Brukes både i lista og på detaljsiden. */
export function plasstekst(a: ArrangementMedAntall, na = Date.now()): string {
  const status = pameldingsstatus(a, na);
  if (a.kapasitet === null) {
    return a.antall_pameldte === 0
      ? "Ingen påmeldte ennå"
      : `${a.antall_pameldte} påmeldte`;
  }
  if (!status.apen && status.grunn === "fullt") {
    return `Fullt — ${a.antall_pameldte} påmeldte`;
  }
  if (a.antall_pameldte === 0) return `${a.kapasitet} plasser ledige`;
  return `${a.antall_pameldte} av ${a.kapasitet} plasser tatt`;
}

/* ── Oppsummeringen til den ansvarlige ───────────────────────────────── */

const OSLO = "Europe/Oslo";

/** Hvor mange millisekunder Oslo ligger foran UTC på et gitt tidspunkt. */
function osloForskjell(ms: number): number {
  const deler = new Intl.DateTimeFormat("sv-SE", {
    timeZone: OSLO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(ms));
  return Date.parse(deler.replace(" ", "T") + "Z") - ms;
}

/** Tidspunktet et gitt klokkeslett i Oslo svarer til i UTC. */
function osloTidspunkt(ar: number, maned: number, dag: number, time: number): number {
  const gjett = Date.UTC(ar, maned - 1, dag, time);
  // To runder holder også over sommertidsskiftet.
  let ms = gjett - osloForskjell(gjett);
  ms = gjett - osloForskjell(ms);
  return ms;
}

/** Klokkeslettet oppsummeringen sendes på. */
export const OPPSUMMERING_TIME = 8;

/**
 * Når oppsummeringen skal sendes: kl. 08 norsk tid, et gitt antall dager
 * før arrangementet. Vi regner på kalenderdatoen i Oslo, ikke på klokka,
 * så en middag kl. 16.30 og en frokost kl. 09 får e-posten på samme tid.
 */
export function oppsummeringstidspunkt(starter: string, dagerFor: number): Date {
  const start = new Date(starter);
  const [ar, maned, dag] = new Intl.DateTimeFormat("sv-SE", {
    timeZone: OSLO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(start)
    .split("-")
    .map(Number);

  const dagen = Date.UTC(ar, maned - 1, dag) - dagerFor * 86400000;
  const d = new Date(dagen);
  return new Date(
    osloTidspunkt(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), OPPSUMMERING_TIME),
  );
}

/** Valgene den ansvarlige kan velge mellom i admin. */
export const OPPSUMMERINGSVALG: { verdi: number; tekst: string }[] = [
  { verdi: 0, tekst: "Samme morgen" },
  { verdi: 1, tekst: "Dagen før" },
  { verdi: 2, tekst: "To dager før" },
  { verdi: 3, tekst: "Tre dager før" },
  { verdi: 7, tekst: "En uke før" },
];
