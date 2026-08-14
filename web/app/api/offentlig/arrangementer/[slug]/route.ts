import { hentArrangement, hentFrivillige, staarPaaLista } from "@/lib/data";
import { apiSvar, forhandsvarsel } from "../../felles";

export const dynamic = "force-dynamic";

/**
 * Ett arrangement, med lista over hvem som har meldt seg. Appen henter
 * dette på nytt før påmelding, så både tallet og navnene er ferske.
 *
 * Navn og bidrag er åpent — det er hele poenget med å kunne se hvem som
 * har sagt ja. Telefonnumrene er det ikke: de følger bare med når den som
 * spør selv står på lista, og bare for dem som har krysset av for å dele.
 *
 * «Står på lista» vises ved å sende sin egen påmeldings-id i `x-pamelding-id`.
 * Den ligger bare på telefonen til den som har sagt ja, og er det nærmeste
 * en innlogging vi har i en app som med vilje ikke har kontoer. Den sendes
 * som header, ikke i adressen, så den ikke blir stående i tjenerlogger.
 */
export async function GET(
  forespørsel: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const arrangement = await hentArrangement(slug);
    if (!arrangement || !arrangement.publisert) {
      return apiSvar({ feil: "Fant ikke arrangementet." }, 404);
    }

    const pameldingId = forespørsel.headers.get("x-pamelding-id") ?? "";
    const medNumre = await staarPaaLista(arrangement.id, pameldingId);

    return apiSvar({
      arrangement,
      frivillige: await hentFrivillige(arrangement.id, { medNumre }),
    });
  } catch (feil) {
    console.error("[api] Kunne ikke hente arrangement", feil);
    return apiSvar({ feil: "Kunne ikke hente arrangementet." }, 503);
  }
}

export function OPTIONS() {
  return forhandsvarsel();
}
