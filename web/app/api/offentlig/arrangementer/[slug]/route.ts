import { hentArrangement, hentFrivillige } from "@/lib/data";
import { apiSvar, forhandsvarsel } from "../../felles";

export const dynamic = "force-dynamic";

/**
 * Ett arrangement, med lista over hvem som har meldt seg. Appen henter
 * dette på nytt før påmelding, så både tallet og navnene er ferske.
 *
 * Lista er navn, bidrag og telefonnummer — det siste bare når oppgaven
 * krever nummer, og det er delt med vilje, så de som deler en vakt kan
 * avtale seg imellom. E-postadressen blir liggende hos den ansvarlige.
 *
 * Merk at denne ruta er åpen, uten innlogging. Det som legges her, er
 * lesbart for alle som kjenner adressen.
 */
export async function GET(
  _forespørsel: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const arrangement = await hentArrangement(slug);
    if (!arrangement || !arrangement.publisert) {
      return apiSvar({ feil: "Fant ikke arrangementet." }, 404);
    }
    return apiSvar({ arrangement, frivillige: await hentFrivillige(arrangement.id) });
  } catch (feil) {
    console.error("[api] Kunne ikke hente arrangement", feil);
    return apiSvar({ feil: "Kunne ikke hente arrangementet." }, 503);
  }
}

export function OPTIONS() {
  return forhandsvarsel();
}
