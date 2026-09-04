import "server-only";
import type { ArrangementMedAntall } from "@skjold/delt";
import {
  hentAlleTokens,
  hentSistKjort,
  hentUvarsledeArrangementer,
  merkNyhetsvarselSendt,
} from "./data";
import { hentUvarsledeTestere, merkAdminVarslet } from "./testere";
import { sendNyeTestere } from "./brevo";
import { nettstedUrl } from "./lenker";
import { varsleNyOppgave } from "./push";

/**
 * Om cron-jobben kan slippe til. Uten CRON_SECRET svarer
 * /api/varsler/paaminnelser 500, og da stopper påminnelsen dagen før —
 * uten at noen merker det før en frivillig ikke dukker opp. Derfor sier
 * admin fra om den mangler, på samme måte som med Brevo-nøkkelen.
 */
export function harCronNokkel() {
  return Boolean(process.env.CRON_SECRET);
}

/** Navnet timesjobben kvitterer under i jobbkjoringer. */
export const TIMESJOBB = "paaminnelser";

/**
 * Hvor lenge det får gå før admin sier fra. Jobben skal kjøre hver time;
 * tre timer tåler at en kjøring eller to blir hengende uten at det ropes
 * varsku for tidlig. GitHub sine planlagte kjøringer er dessuten sjelden
 * helt presise.
 */
const TAALT_STILLE_TIMER = 3;

export type Driftsstatus =
  | { ok: true; sistKjort: string }
  | { ok: false; grunn: "mangler nøkkel" }
  | { ok: false; grunn: "aldri kjørt" }
  | { ok: false; grunn: "for lenge siden"; sistKjort: string; timer: number };

/**
 * Om timesjobben faktisk kjører.
 *
 * At CRON_SECRET er satt sier bare at ruta ville sluppet noen inn — ikke
 * at noen kaller den. Det var nettopp forskjellen som gjorde at
 * påminnelsen dagen før aldri gikk ut uten at noen merket det.
 */
export async function timesjobbStatus(): Promise<Driftsstatus> {
  if (!harCronNokkel()) return { ok: false, grunn: "mangler nøkkel" };

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
