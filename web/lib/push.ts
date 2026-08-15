import "server-only";
import { klokka, langDato, ukedag } from "@skjold/delt";

/**
 * Push-varsler via Expo. Vi sender til Expos tjeneste, som videresender til
 * Apple og Google. Ingen nøkler trengs her — tokenet identifiserer telefonen.
 *
 * Dette er den eneste veien menigheten når de frivillige av seg selv. Det
 * er også grunnen til at det er få og korte varsler: én påminnelse dagen
 * før, beskjed når det kommer noe nytt, og beskjed når noen melder avbud.
 *
 * En feilet utsending skal aldri velte det som utløste den.
 */

const API = "https://exp.host/--/api/v2/push/send";

export type Varsel = {
  til: string[];
  tittel: string;
  tekst: string;
  /** Sendes med tilbake til appen, så den kan åpne riktig arrangement. */
  data?: Record<string, string>;
};

export function gyldigToken(token: string) {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}

export async function sendVarsel({ til, tittel, tekst, data }: Varsel) {
  const tokens = [...new Set(til)].filter(gyldigToken);
  if (tokens.length === 0) return { sendt: 0, feilet: 0 };

  let sendt = 0;
  let feilet = 0;

  // Expo tar imot inntil 100 meldinger per kall.
  for (let i = 0; i < tokens.length; i += 100) {
    const bolk = tokens.slice(i, i + 100).map((to) => ({
      to,
      title: tittel,
      body: tekst,
      sound: "default",
      priority: "high",
      ...(data ? { data } : {}),
    }));

    try {
      const svar = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(bolk),
      });

      if (!svar.ok) {
        console.error(`[push] ${svar.status}: ${await svar.text()}`);
        feilet += bolk.length;
        continue;
      }

      const kropp = (await svar.json()) as {
        data?: { status: string; message?: string }[];
      };
      for (const kvittering of kropp.data ?? []) {
        if (kvittering.status === "ok") sendt++;
        else {
          feilet++;
          console.warn(`[push] avvist: ${kvittering.message ?? "ukjent grunn"}`);
        }
      }
    } catch (feil) {
      console.error("[push] Nettverksfeil", feil);
      feilet += bolk.length;
    }
  }

  return { sendt, feilet };
}

/* ── De tre varslene ─────────────────────────────────────────────────── */

type Oppgave = {
  slug: string;
  tittel: string;
  starter: string;
  sted: string;
};

/**
 * «torsdag kl. 11.00» — nok når varselet handler om noe nært i tid, og
 * mottakeren alt vet hvilken dag det er snakk om.
 */
function nar(starter: string) {
  const start = new Date(starter);
  return `${ukedag(start)} kl. ${klokka(start).replace(":", ".")}`;
}

/**
 * «torsdag 16. august kl. 11.00» — med dato.
 *
 * Varselet om en ny oppgave kan gjelde noe som er flere uker unna, og da
 * sier «torsdag» ingenting om hvilken torsdag. Da må datoen med, ellers må
 * man åpne appen bare for å finne ut om det er aktuelt.
 */
function narMedDato(starter: string) {
  return langDato(new Date(starter));
}

/** Påminnelsen dagen før, til dem som har sagt ja. */
export function varslePaaminnelse(oppgave: Oppgave, tokens: string[]) {
  return sendVarsel({
    til: tokens,
    tittel: `I morgen: ${oppgave.tittel}`,
    tekst: `${nar(oppgave.starter)} i ${oppgave.sted}. Takk for at du stiller!`,
    data: { type: "paaminnelse", slug: oppgave.slug },
  });
}

/**
 * Beskjed til alle med appen om at det er lagt ut noe nytt som trenger
 * folk. Går én gang per arrangement — eller én gang for en hel serie.
 */
export function varsleNyOppgave(
  oppgave: Oppgave,
  tokens: string[],
  { antallISerie = 1 }: { antallISerie?: number } = {},
) {
  return sendVarsel({
    til: tokens,
    tittel: "Det trengs frivillige",
    tekst:
      antallISerie > 1
        ? `${oppgave.tittel} — ${antallISerie} ganger framover, første gang ${narMedDato(
            oppgave.starter,
          )}. Se om det passer for deg.`
        : `${oppgave.tittel}, ${narMedDato(oppgave.starter)} i ${oppgave.sted}. Se om det passer for deg.`,
    data: { type: "ny-oppgave", slug: oppgave.slug },
  });
}

/**
 * Beskjed når noen har meldt avbud. Den som melder avbud skal slippe å
 * ringe rundt selv — det er hele grunnen til at avbud er en knapp og ikke
 * en telefonsamtale.
 */
export function varsleAvbud(
  oppgave: Oppgave,
  tokens: string[],
  { mangler }: { mangler: number | null },
) {
  return sendVarsel({
    til: tokens,
    tittel: "En frivillig har meldt avbud",
    tekst:
      mangler === null
        ? `${oppgave.tittel}, ${nar(oppgave.starter)}. Kan du steppe inn?`
        : `${oppgave.tittel}, ${nar(oppgave.starter)}. Det mangler nå ${mangler} ${
            mangler === 1 ? "frivillig" : "frivillige"
          }.`,
    data: { type: "avbud", slug: oppgave.slug },
  });
}
