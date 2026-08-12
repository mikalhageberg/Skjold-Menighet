import { lagreEnhet } from "@/lib/data";
import { gyldigToken } from "@/lib/push";
import { apiSvar, forhandsvarsel } from "../felles";

export const dynamic = "force-dynamic";

/**
 * Appen melder inn push-tokenet sitt når den starter, ikke først når noen
 * melder seg på noe. Uten det ville varselet om en ny oppgave — eller om et
 * avbud — bare nådd dem som alt hadde sagt ja til noe, og det er jo motsatt
 * av hvem vi trenger å nå.
 *
 * Vi lagrer ingenting om personen her, bare tokenet Expo bruker for å nå
 * telefonen, og hvilken plattform den er.
 */
export async function POST(forespørsel: Request) {
  let kropp: { token?: string; plattform?: string };
  try {
    kropp = (await forespørsel.json()) as { token?: string; plattform?: string };
  } catch {
    return apiSvar({ ok: false, feil: "Ugyldig forespørsel." }, 400);
  }

  const token = (kropp?.token ?? "").trim();
  if (!gyldigToken(token)) {
    return apiSvar({ ok: false, feil: "Ugyldig push-token." }, 400);
  }

  const plattform = (kropp.plattform ?? "").trim().slice(0, 20) || null;

  try {
    await lagreEnhet(token, plattform);
  } catch (feil) {
    console.error("[api] Kunne ikke lagre enhet", feil);
    return apiSvar({ ok: false, feil: "Kunne ikke lagre enheten." }, 503);
  }

  return apiSvar({ ok: true });
}

export function OPTIONS() {
  return forhandsvarsel();
}
