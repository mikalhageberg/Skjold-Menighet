import "server-only";
import { harDatabase, hentForfaltePaaminnelser, merkJobbKjort, merkPaaminnelseSendt } from "./data";
import { varslePaaminnelse } from "./push";
import { TIMESJOBB, varsleOmNyeOppgaver, varsleOmNyeTestere } from "./varsling";

/**
 * Timesjobben: det som skal ut av seg selv.
 *
 *  - push-påminnelse dagen før til dem som har sagt ja,
 *  - etternølere av «det trengs frivillige»-varselet som ikke kom av gårde
 *    da arrangementet ble publisert,
 *  - beskjed på e-post til den ansvarlige om hvem som har bedt om
 *    Android-appen siden sist.
 *
 * Serveren kjører den selv hver time (se planleggTimesjobb under), og
 * GitHub Actions kaller /api/varsler/paaminnelser som sikkerhetsnett.
 * Det var GitHub alene først, men planlagte kjøringer der er «best
 * effort»: de droppes når det er travelt, og det ble seks i døgnet i
 * stedet for 24.
 */

export type Timesjobbsvar = {
  sendt: number;
  paaminnelser: number;
  nyeOppgaver: number;
  nyeTestere: number;
};

// Kommer serveren og GitHub samtidig, får det andre kallet svaret fra det
// første i stedet for å starte en ny runde. Alt merkes som sendt, men først
// etter at det er sendt — to runder side om side kunne ellers begge ha
// funnet de samme påminnelsene og sendt dem to ganger. Én lås i minnet
// holder, for det kjører aldri mer enn én server: volumet med databasen
// kan bare festes til én beholder om gangen.
let paagaar: Promise<Timesjobbsvar> | null = null;

export function kjorTimesjobb(): Promise<Timesjobbsvar> {
  paagaar ??= gjennomfor().finally(() => {
    paagaar = null;
  });
  return paagaar;
}

async function gjennomfor(): Promise<Timesjobbsvar> {
  const nyeOppgaver = await varsleOmNyeOppgaver();
  const nyeTestere = await varsleOmNyeTestere();

  const forfalte = await hentForfaltePaaminnelser();

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

  // Kvitteringen settes også når det ikke var noe å sende. Poenget er å
  // vite at jobben går, ikke at den hadde noe å gjøre.
  await merkJobbKjort(TIMESJOBB);

  return { sendt, paaminnelser: forfalte.length, nyeOppgaver, nyeTestere };
}

/* ── Planleggingen i serveren ────────────────────────────────────────── */

const EN_TIME = 60 * 60 * 1000;

// Hot reload og flere kall til register() skal ikke gi flere tidtakere.
const globalt = globalThis as unknown as { __timesjobbPlanlagt?: boolean };

/**
 * Starter timesjobben inne i serveren: første gang et minutt etter oppstart,
 * så en utrulling ikke betyr en time uten jobb, og så hver time.
 *
 * Kalles fra instrumentation.ts når serveren starter.
 */
export function planleggTimesjobb() {
  if (globalt.__timesjobbPlanlagt || !harDatabase()) return;
  globalt.__timesjobbPlanlagt = true;

  const kjor = () =>
    kjorTimesjobb().catch((feil) => console.error("[timesjobb] Feilet", feil));

  setTimeout(kjor, 60_000);
  setInterval(kjor, EN_TIME);
  console.info("[timesjobb] Kjører i serveren hver time.");
}
