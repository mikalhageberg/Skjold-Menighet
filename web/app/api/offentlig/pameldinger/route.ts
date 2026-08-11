import { registrerPamelding } from "@/lib/pamelding";
import type { PameldingInn } from "@skjold/delt";
import { apiSvar, forhandsvarsel } from "../felles";

export const dynamic = "force-dynamic";

/** Påmelding fra appen. Samme regler og varsler som skjemaet på nett. */
export async function POST(forespørsel: Request) {
  let kropp: PameldingInn;
  try {
    kropp = (await forespørsel.json()) as PameldingInn;
  } catch {
    return apiSvar({ ok: false, feil: "Ugyldig forespørsel." }, 400);
  }

  if (!kropp?.slug || !Array.isArray(kropp.deltakere)) {
    return apiSvar({ ok: false, feil: "Ugyldig forespørsel." }, 400);
  }

  // Enkel demper mot tullepåmeldinger — ingen kan melde på hundre om gangen.
  if (kropp.deltakere.length > 20) {
    return apiSvar(
      { ok: false, feil: "Meld på inntil 20 om gangen. Ring 52 76 12 00 for større grupper." },
      400,
    );
  }

  const svar = await registrerPamelding(kropp);
  return apiSvar(svar, svar.ok ? 201 : 400);
}

export function OPTIONS() {
  return forhandsvarsel();
}
