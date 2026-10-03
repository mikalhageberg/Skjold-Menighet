import "server-only";
import type { ArrangementMedAntall } from "@skjold/delt";
import {
  hentAlleTokens,
  hentPameldteISerie,
  hentSistKjort,
  hentUvarsledeArrangementer,
  merkNyhetsvarselSendt,
} from "./data";
import { hentUvarsledeTestere, merkAdminVarslet } from "./testere";
import { sendNyeTestere } from "./brevo";
import { nettstedUrl } from "./lenker";
import { varsleAvlysning, varsleNyOppgave } from "./push";

/** Navnet timesjobben kvitterer under i jobbkjoringer. */
export const TIMESJOBB = "paaminnelser";

/**
 * Hvor lenge det får gå før admin sier fra. Jobben kjører hver time i
 * serveren; tre timer tåler en omstart eller en treg runde uten at det
 * ropes varsku for tidlig.
 */
const TAALT_STILLE_TIMER = 3;

export type Driftsstatus =
  | { ok: true; sistKjort: string }
  | { ok: false; grunn: "aldri kjørt" }
  | { ok: false; grunn: "for lenge siden"; sistKjort: string; timer: number };

/**
 * Om timesjobben faktisk kjører — målt på når den sist kom gjennom, ikke
 * på om noe er satt opp. Det var nettopp forskjellen som først gjorde at
 * påminnelsen dagen før aldri gikk ut, og deretter at den gikk hver fjerde
 * time, uten at noen merket det.
 */
export async function timesjobbStatus(): Promise<Driftsstatus> {
  const sistKjort = await hentSistKjort(TIMESJOBB);
  if (!sistKjort) return { ok: false, grunn: "aldri kjørt" };

  const timer = (Date.now() - new Date(sistKjort).getTime()) / 3600_000;
  if (timer > TAALT_STILLE_TIMER) {
    return { ok: false, grunn: "for lenge siden", sistKjort, timer: Math.floor(timer) };
  }
  return { ok: true, sistKjort };
}

/**
 * Adressen som skal ha beskjed når noen ber om Android-appen. Uten den
 * sendes ingenting, og admin sier fra om at den mangler.
 */
export function varselEpost() {
  const verdi = (process.env.VARSEL_EPOST ?? "").trim();
  return verdi.includes("@") ? verdi : null;
}

/**
 * «Det trengs frivillige til noe nytt» — varselet som går til alle med
 * appen når et arrangement blir publisert.
 *
 * Det sendes med én gang den ansvarlige publiserer, og cron-jobben tar
 * igjen det som eventuelt ikke kom av gårde. Hvert arrangement merkes når
 * det er forsøkt sendt, så ingen får den samme beskjeden to ganger.
 *
 * En hel serie deler ett varsel. Tolv formiddagstreff lagt inn på én gang
 * skal gi én beskjed, ikke tolv.
 */
export async function varsleOmNyeOppgaver(
  kandidater?: ArrangementMedAntall[],
): Promise<number> {
  const uvarslede = kandidater ?? (await hentUvarsledeArrangementer());
  if (uvarslede.length === 0) return 0;

  const grupper = new Map<string, ArrangementMedAntall[]>();
  for (const a of uvarslede) {
    const nokkel = a.serie_id ?? a.id;
    grupper.set(nokkel, [...(grupper.get(nokkel) ?? []), a]);
  }

  let sendt = 0;

  for (const gruppe of grupper.values()) {
    const sortert = [...gruppe].sort((a, b) => a.starter.localeCompare(b.starter));
    const forste = sortert[0];

    try {
      const tokens = await hentAlleTokens();
      if (tokens.length > 0) {
        const resultat = await varsleNyOppgave(forste, tokens, {
          antallISerie: sortert.length,
        });
        sendt += resultat.sendt;
      }
      // Merkes uansett utfall. Ellers ville et arrangement uten mottakere,
      // eller ett Expo avviste, ligge og bli forsøkt på nytt i det uendelige.
      await merkNyhetsvarselSendt(sortert.map((a) => a.id));
    } catch (feil) {
      console.error(`[varsel] Ny oppgave «${forste.slug}» feilet`, feil);
    }
  }

  return sendt;
}

/**
 * «Avlyst» til alle som har sagt ja til en av de kommende gangene i en
 * serie som blir avlyst.
 *
 * Hver telefon får ett varsel, uansett hvor mange datoer den står på. Den
 * som har sagt ja til fire formiddagstreff, skal få én beskjed om at alle
 * fire er avlyst — ikke fire beskjeder etter hverandre. Telefoner som står
 * på nøyaktig de samme datoene, deler utsending.
 */
export async function varsleOmAvlystSerie(serieId: string): Promise<number> {
  const na = Date.now();
  const kommende = (await hentPameldteISerie(serieId)).filter(
    (r) => new Date(r.starter).getTime() > na,
  );
  if (kommende.length === 0) return 0;

  const perTelefon = new Map<string, { tittel: string; starter: string }[]>();
  for (const r of kommende) {
    const liste = perTelefon.get(r.expo_token) ?? [];
    // Samme telefon kan i prinsippet stå to ganger på samme dato.
    if (!liste.some((x) => x.starter === r.starter)) liste.push(r);
    perTelefon.set(r.expo_token, liste);
  }

  type Utsending = { forste: { tittel: string; starter: string }; antall: number; tokens: string[] };
  const utsendinger = new Map<string, Utsending>();
  for (const [token, datoer] of perTelefon) {
    const nokkel = datoer.map((d) => d.starter).join("|");
    const utsending = utsendinger.get(nokkel) ?? {
      forste: datoer[0],
      antall: datoer.length,
      tokens: [],
    };
    utsending.tokens.push(token);
    utsendinger.set(nokkel, utsending);
  }

  let sendt = 0;
  for (const { forste, antall, tokens } of utsendinger.values()) {
    const resultat = await varsleAvlysning(forste, tokens, { antallGanger: antall });
    sendt += resultat.sendt;
  }
  return sendt;
}

/**
 * «Noen har bedt om Android-appen.»
 *
 * Kjøres av timesjobben. Alle som har meldt seg siden sist samles i én
 * e-post, og det sendes ingenting når det ikke er kommet noen — en tom
 * innboks er selv beskjeden om at ingenting har skjedd.
 *
 * De merkes bare når e-posten faktisk gikk av gårde, så en Brevo som er
 * nede gir en beskjed en time senere i stedet for ingen beskjed.
 */
export async function varsleOmNyeTestere(): Promise<number> {
  const til = varselEpost();
  if (!til) return 0;

  const nye = await hentUvarsledeTestere();
  if (nye.length === 0) return 0;

  const base = nettstedUrl();
  const svar = await sendNyeTestere(
    til,
    nye.map((t) => t.epost),
    base ? `${base}/android` : null,
  );

  if (!svar.sendt) {
    console.error(`[varsel] Beskjed om ${nye.length} nye testere gikk ikke: ${svar.grunn}`);
    return 0;
  }

  await merkAdminVarslet(nye.map((t) => t.id));
  return nye.length;
}
