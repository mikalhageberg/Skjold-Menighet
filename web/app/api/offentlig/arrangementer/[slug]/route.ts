import { hentArrangement } from "@/lib/data";
import { apiSvar, forhandsvarsel } from "../../felles";

export const dynamic = "force-dynamic";

/** Ett arrangement. Appen henter dette på nytt før påmelding, så plasstallet er ferskt. */
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
    return apiSvar({ arrangement });
  } catch (feil) {
    console.error("[api] Kunne ikke hente arrangement", feil);
    return apiSvar({ feil: "Kunne ikke hente arrangementet." }, 503);
  }
}

export function OPTIONS() {
  return forhandsvarsel();
}
