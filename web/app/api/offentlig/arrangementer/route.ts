import { hentKommende } from "@/lib/data";
import { apiSvar, forhandsvarsel } from "../felles";

export const dynamic = "force-dynamic";

/** Alle publiserte arrangementer som kommer. Dette er lista appen viser. */
export async function GET() {
  try {
    return apiSvar({ arrangementer: await hentKommende() });
  } catch (feil) {
    console.error("[api] Kunne ikke hente arrangementer", feil);
    return apiSvar({ feil: "Kunne ikke hente arrangementer." }, 503);
  }
}

export function OPTIONS() {
  return forhandsvarsel();
}
