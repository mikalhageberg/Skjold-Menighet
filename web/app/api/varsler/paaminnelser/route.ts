import { NextResponse } from "next/server";
import {
  hentForfaltePaaminnelser,
  hentKandidaterForOppsummering,
  hentPameldinger,
  merkOppsummeringSendt,
  merkPaaminnelseSendt,
} from "@/lib/data";
import { sendVarsel } from "@/lib/push";
import { sendOppsummering } from "@/lib/brevo";
import { klokka, oppsummeringstidspunkt, ukedag } from "@skjold/delt";

export const dynamic = "force-dynamic";

/**
 * Det som skal ut av seg selv: push-påminnelse til de påmeldte dagen før, og
 * oppsummeringen til den ansvarlige. Kjøres av en cron-jobb én gang i timen;
 * se README. Beskyttet med CRON_SECRET så ingen andre kan utløse utsending.
 */
export async function GET(forespørsel: Request) {
  const hemmelighet = process.env.CRON_SECRET;
  if (!hemmelighet) {
    return NextResponse.json({ feil: "CRON_SECRET er ikke satt." }, { status: 500 });
  }
  if (forespørsel.headers.get("authorization") !== `Bearer ${hemmelighet}`) {
    return NextResponse.json({ feil: "Ikke tilgang." }, { status: 401 });
  }

  const oppsummeringer = await sendForfalteOppsummeringer();

  const forfalte = await hentForfaltePaaminnelser();
  if (forfalte.length === 0) {
    return NextResponse.json({ sendt: 0, paaminnelser: 0, oppsummeringer });
  }

  // Én melding per arrangement, til alle telefonene som skal ha den.
  const perArrangement = new Map<string, { tokens: string[]; ider: string[] }>();
  for (const p of forfalte) {
    const nokkel = `${p.tittel}|${p.starter}|${p.sted}`;
    const post = perArrangement.get(nokkel) ?? { tokens: [], ider: [] };
    post.tokens.push(p.expo_token);
    post.ider.push(p.pamelding_id);
    perArrangement.set(nokkel, post);
  }

  let sendt = 0;
  const sendteIder: string[] = [];

  for (const [nokkel, post] of perArrangement) {
    const [tittel, starter, sted] = nokkel.split("|");
    const start = new Date(starter);
    const resultat = await sendVarsel({
      til: post.tokens,
      tittel: `I morgen: ${tittel}`,
      tekst: `${ukedag(start)} kl. ${klokka(start).replace(":", ".")} i ${sted}. Vi ses!`,
      data: { type: "paaminnelse" },
    });
    sendt += resultat.sendt;
    if (resultat.sendt > 0) sendteIder.push(...post.ider);
  }

  await merkPaaminnelseSendt(sendteIder);

  return NextResponse.json({ sendt, paaminnelser: forfalte.length, oppsummeringer });
}

/**
 * Oppsummeringen går ut når tidspunktet har passert, og bare én gang.
 * Jobben kjører hver time, så en e-post satt til kl. 08 går ut kl. 08.
 */
async function sendForfalteOppsummeringer(): Promise<number> {
  const na = Date.now();
  let sendt = 0;

  const kandidater = await hentKandidaterForOppsummering();

  for (const arrangement of kandidater) {
    if (arrangement.oppsummering_dager_for === null) continue;
    const tid = oppsummeringstidspunkt(arrangement.starter, arrangement.oppsummering_dager_for);
    if (tid.getTime() > na) continue;

    try {
      const pameldinger = await hentPameldinger(arrangement.id);
      const svar = await sendOppsummering(arrangement, pameldinger);
      // Markeres også når Brevo ikke er satt opp, ellers prøver jobben igjen
      // hver time i det uendelige.
      await merkOppsummeringSendt(arrangement.id);
      if (svar.sendt) sendt++;
    } catch (feil) {
      console.error(`[oppsummering] ${arrangement.slug} feilet`, feil);
    }
  }

  return sendt;
}
