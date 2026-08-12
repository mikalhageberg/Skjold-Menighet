import type { ArrangementMedAntall } from "./typer";

export type Pameldingsstatus =
  | { apen: true; mangler: number | null }
  | { apen: false; grunn: "stengt" | "nok" | "over" };

/**
 * Om man fortsatt kan melde seg som frivillig. Regnes likt på nett, i appen
 * og på serveren, slik at ingen får se en «Jeg kan hjelpe»-knapp for noe som
 * er stengt eller alt har frivillige nok.
 */
export function pameldingsstatus(
  a: ArrangementMedAntall,
  na = Date.now(),
): Pameldingsstatus {
  if (new Date(a.starter).getTime() < na) return { apen: false, grunn: "over" };
  if (a.pamelding_stenger && new Date(a.pamelding_stenger).getTime() < na)
    return { apen: false, grunn: "stengt" };
  if (a.trengs !== null) {
    const mangler = a.trengs - a.antall_frivillige;
    if (mangler <= 0) return { apen: false, grunn: "nok" };
    return { apen: true, mangler };
  }
  return { apen: true, mangler: null };
}

/**
 * Teksten som beskriver hvor langt oppgaven er dekket. Brukes både i lista
 * og på detaljsiden, og er det viktigste signalet på forsiden: står det at
 * det mangler noen, er det en grunn til å trykke seg inn.
 */
export function frivilligtekst(a: ArrangementMedAntall, na = Date.now()): string {
  const status = pameldingsstatus(a, na);

  if (a.trengs === null) {
    return a.antall_frivillige === 0
      ? "Ingen frivillige ennå"
      : `${a.antall_frivillige} ${a.antall_frivillige === 1 ? "frivillig" : "frivillige"}`;
  }

  if (!status.apen && status.grunn === "nok") {
    return `Nok frivillige — ${a.antall_frivillige} har meldt seg`;
  }

  const mangler = a.trengs - a.antall_frivillige;
  if (a.antall_frivillige === 0) {
    return `Trenger ${a.trengs} ${a.trengs === 1 ? "frivillig" : "frivillige"}`;
  }
  return `${a.antall_frivillige} av ${a.trengs} — mangler ${mangler}`;
}
