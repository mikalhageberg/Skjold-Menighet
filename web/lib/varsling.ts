import "server-only";
import type { ArrangementMedAntall } from "@skjold/delt";
import { hentAlleTokens, hentUvarsledeArrangementer, merkNyhetsvarselSendt } from "./data";
import { varsleNyOppgave } from "./push";

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
