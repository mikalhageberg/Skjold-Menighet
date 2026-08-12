import { registrerPamelding } from "@/lib/pamelding";
import type { PameldingInn } from "@skjold/delt";
import { apiSvar, forhandsvarsel } from "../felles";

export const dynamic = "force-dynamic";

/** Én frivillig melder seg, fra appen. Samme regler som skjemaet på nett. */
export async function POST(forespørsel: Request) {
  let kropp: PameldingInn;
  try {
    kropp = (await forespørsel.json()) as PameldingInn;
  } catch {
    return apiSvar({ ok: false, feil: "Ugyldig forespørsel." }, 400);
  }

  if (!kropp?.slug || typeof kropp.navn !== "string") {
    return apiSvar({ ok: false, feil: "Ugyldig forespørsel." }, 400);
  }

  const svar = await registrerPamelding(kropp);
  return apiSvar(svar, svar.ok ? 201 : 400);
}

export function OPTIONS() {
  return forhandsvarsel();
}
