import "server-only";
import { revalidatePath } from "next/cache";
import {
  pameldingsstatus,
  type AvmeldingSvar,
  type PameldingInn,
  type PameldingSvar,
} from "@skjold/delt";
import {
  avmeldPamelding,
  harMeldtSeg,
  hentAlleTokens,
  hentArrangementMedId,
  hentArrangement,
  hentPameldingMedId,
  lagreEnhet,
  opprettPamelding,
} from "./data";
import { gyldigToken, varsleAvbud } from "./push";

const EPOST = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registrerer én frivillig. Både skjemaet på nett og appen går gjennom
 * denne, slik at reglene og varslene er de samme uansett hvor man sier ja.
 */
export async function registrerPamelding(input: PameldingInn): Promise<PameldingSvar> {
  const arrangement = await hentArrangement(input.slug);
  if (!arrangement || !arrangement.publisert) {
    return { ok: false, feil: "Fant ikke arrangementet." };
  }

  const navn = input.navn.trim();
  // Trenger ikke oppgaven telefon eller e-post, skal det heller ikke være
  // mulig å levere det — uansett hva klienten måtte sende med.
  const telefon = arrangement.krev_telefon ? (input.telefon ?? "").trim() : "";
  const epost = arrangement.krev_epost ? (input.epost ?? "").trim() : "";
  const bidrag = (input.bidrag ?? "").trim();
  // Uten nummer er det ingenting å dele, uansett hva klienten sender.
  const delNummer = Boolean(input.delNummer) && arrangement.krev_telefon;

  // Navn er alltid nok. Trenger oppgaven telefon eller e-post, har den
  // ansvarlige krysset av for det, og da spør vi om akkurat det.
  const feltfeil: Record<string, string> = {};
  if (!navn) feltfeil.navn = "Vi trenger et navn.";
  if (arrangement.krev_telefon && !telefon)
    feltfeil.telefon = "Til denne oppgaven trenger vi et telefonnummer.";
  if (arrangement.krev_epost && !epost)
    feltfeil.epost = "Til denne oppgaven trenger vi en e-postadresse.";
  if (epost && !EPOST.test(epost)) feltfeil.epost = "Sjekk e-postadressen — den mangler noe.";

  if (Object.keys(feltfeil).length > 0)
    return { ok: false, feil: "Noe mangler i skjemaet.", feltfeil };

  const status = pameldingsstatus(arrangement);
  if (!status.apen) {
    return {
      ok: false,
      feil:
        status.grunn === "nok"
          ? "Det ble nok frivillige mens du fylte ut. Takk for at du ville!"
          : "Fristen for å melde seg har gått ut.",
    };
  }

  // Telefonen kobles til påmeldingen, så den kan få påminnelsen dagen før
  // og holdes utenfor varselet når den selv melder avbud.
  let enhetId: string | null = null;
  if (input.pushToken && gyldigToken(input.pushToken)) {
    try {
      enhetId = await lagreEnhet(input.pushToken, null);
    } catch (feil) {
      console.error("Kunne ikke lagre enhet", feil);
    }
  }

  if (enhetId && (await harMeldtSeg(arrangement.id, enhetId))) {
    return { ok: false, feil: "Du står allerede på lista til dette." };
  }

  let pameldingId: string;
  try {
    pameldingId = await opprettPamelding({
      arrangementId: arrangement.id,
      enhetId,
      navn,
      telefon: telefon || null,
      epost: epost || null,
      bidrag: bidrag || null,
      delNummer,
    });
  } catch (feil) {
    console.error("Kunne ikke lagre påmelding", feil);
    return { ok: false, feil: "Påmeldingen ble ikke lagret. Prøv igjen." };
  }

  // Ingen beskjed går ut nå. Den som sier ja ser lista si med én gang, og
  // de andre trenger ikke en melding hver gang noen melder seg — bare når
  // det oppstår et hull.

  revalidatePath("/");
  revalidatePath(`/arrangement/${arrangement.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/arrangementer");

  return { ok: true, pameldingId };
}

/**
 * Avbud fra appen. Samme vei tilbake er ikke mulig via nettskjemaet — det
 * er bare telefonen som husker påmeldings-IDen.
 *
 * Her ligger hele poenget med avbudsknappen: i stedet for at den som ikke
 * kan må ringe rundt for å finne en avløser, går det ut et varsel til alle
 * andre med appen om at det er blitt en ledig plass.
 */
export async function meldAv(pameldingId: string): Promise<AvmeldingSvar> {
  const pamelding = await hentPameldingMedId(pameldingId);
  if (!pamelding) return { ok: false, feil: "Fant ikke påmeldingen." };
  if (pamelding.avmeldt) return { ok: true };

  await avmeldPamelding(pameldingId);

  // Hentes etter avmeldingen, så tallet i varselet er det som faktisk mangler.
  const arrangement = await hentArrangementMedId(pamelding.arrangement_id);

  if (arrangement && arrangement.publisert && new Date(arrangement.starter).getTime() > Date.now()) {
    try {
      const tokens = await hentAlleTokens({
        unntattEnhetId: pamelding.enhet_id,
        unntattArrangementId: arrangement.id,
      });
      if (tokens.length > 0) {
        const status = pameldingsstatus(arrangement);
        await varsleAvbud(arrangement, tokens, {
          mangler: status.apen ? status.mangler : null,
        });
      }
    } catch (feil) {
      console.error("Kunne ikke sende avbudsvarsel", feil);
    }
  }

  if (arrangement) {
    revalidatePath("/");
    revalidatePath(`/arrangement/${arrangement.slug}`);
    revalidatePath("/admin");
    revalidatePath("/admin/arrangementer");
  }

  return { ok: true };
}
