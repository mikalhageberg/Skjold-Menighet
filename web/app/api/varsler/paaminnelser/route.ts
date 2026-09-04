import { NextResponse } from "next/server";
import { hentForfaltePaaminnelser, merkJobbKjort, merkPaaminnelseSendt } from "@/lib/data";
import { varslePaaminnelse } from "@/lib/push";
import { TIMESJOBB, varsleOmNyeOppgaver, varsleOmNyeTestere } from "@/lib/varsling";

export const dynamic = "force-dynamic";

/**
 * Det som skal ut av seg selv: push-påminnelse dagen før til dem som har
 * sagt ja, etternølere av «det trengs frivillige»-varselet som ikke kom av
 * gårde da arrangementet ble publisert, og beskjed på e-post til den
 * ansvarlige om hvem som har bedt om Android-appen siden sist. Kjøres av en
 * cron-jobb én gang i timen; se README. Beskyttet med CRON_SECRET så ingen
 * andre kan utløse utsending.
 */
export async function GET(forespørsel: Request) {
  const hemmelighet = process.env.CRON_SECRET;
  if (!hemmelighet) {
    return NextResponse.json({ feil: "CRON_SECRET er ikke satt." }, { status: 500 });
  }
  if (forespørsel.headers.get("authorization") !== `Bearer ${hemmelighet}`) {
    return NextResponse.json({ feil: "Ikke tilgang." }, { status: 401 });
  }

  const nyeOppgaver = await varsleOmNyeOppgaver();
  const nyeTestere = await varsleOmNyeTestere();

  const forfalte = await hentForfaltePaaminnelser();
  if (forfalte.length === 0) {
    // Kvitteringen settes selv om det ikke var noe å sende. Poenget er å
    // vite at jobben går, ikke at den hadde noe å gjøre.
    await merkJobbKjort(TIMESJOBB);
    return NextResponse.json({ sendt: 0, paaminnelser: 0, nyeOppgaver, nyeTestere });
  }

  // Én melding per arrangement, til alle telefonene som skal ha den.
  const perArrangement = new Map<
    string,
    { tokens: string[]; ider: string[]; oppgave: (typeof forfalte)[number] }
  >();
  for (const p of forfalte) {
    const post = perArrangement.get(p.slug) ?? { tokens: [], ider: [], oppgave: p };
    post.tokens.push(p.expo_token);
    post.ider.push(p.pamelding_id);
    perArrangement.set(p.slug, post);
  }

  let sendt = 0;
  const sendteIder: string[] = [];

  for (const post of perArrangement.values()) {
    const resultat = await varslePaaminnelse(post.oppgave, post.tokens);
    sendt += resultat.sendt;
    if (resultat.sendt > 0) sendteIder.push(...post.ider);
  }

  await merkPaaminnelseSendt(sendteIder);
  await merkJobbKjort(TIMESJOBB);

  return NextResponse.json({ sendt, paaminnelser: forfalte.length, nyeOppgaver, nyeTestere });
}
