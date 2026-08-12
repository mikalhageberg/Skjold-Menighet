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
  hentArrangementMedId,
  hentArrangement,
  hentPameldingMedId,
  lagreEnhet,
  opprettPamelding,
} from "./data";
import { gyldigToken } from "./push";
import { sendAvmeldingsvarsel } from "./brevo";

const EPOST = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registrerer en påmelding. Både skjemaet på nett og appen går gjennom denne,
 * slik at reglene og varslene er de samme uansett hvor man melder seg på.
 */
export async function registrerPamelding(input: PameldingInn): Promise<PameldingSvar> {
  const arrangement = await hentArrangement(input.slug);
  if (!arrangement || !arrangement.publisert) {
    return { ok: false, feil: "Fant ikke arrangementet." };
  }

  const kontaktNavn = input.kontaktNavn.trim();
  // Trenger arrangementet ikke telefon eller e-post, skal det heller ikke
  // være mulig å levere det — uansett hva klienten måtte sende med.
  const kontaktTelefon = arrangement.krev_telefon ? (input.kontaktTelefon ?? "").trim() : "";
  const kontaktEpost = arrangement.krev_epost ? (input.kontaktEpost ?? "").trim() : "";
  const melding = (input.melding ?? "").trim();

  // Navn er alltid nok. Trenger arrangementet telefon eller e-post, har den
  // ansvarlige krysset av for det, og da spør vi om akkurat det.
  const feltfeil: Record<string, string> = {};
  if (!kontaktNavn) feltfeil.kontakt_navn = "Vi trenger et navn.";
  if (arrangement.krev_telefon && !kontaktTelefon)
    feltfeil.kontakt_telefon = "Dette arrangementet trenger et telefonnummer.";
  if (arrangement.krev_epost && !kontaktEpost)
    feltfeil.kontakt_epost = "Dette arrangementet trenger en e-postadresse.";
  if (kontaktEpost && !EPOST.test(kontaktEpost))
    feltfeil.kontakt_epost = "Sjekk e-postadressen — den mangler noe.";

  const deltakere = input.deltakere
    .map((d) => ({
      navn: d.navn.trim(),
      kosthold: d.kosthold?.trim() || null,
    }))
    .filter((d) => d.navn.length > 0);

  if (deltakere.length === 0) feltfeil.deltaker_navn = "Skriv inn minst ett navn.";
  if (Object.keys(feltfeil).length > 0)
    return { ok: false, feil: "Noe mangler i skjemaet.", feltfeil };

  const status = pameldingsstatus(arrangement);
  if (!status.apen) {
    return {
      ok: false,
      feil:
        status.grunn === "fullt"
          ? "Arrangementet ble fullt mens du fylte ut. Prøv igjen senere."
          : "Påmeldingen er stengt.",
    };
  }
  if (status.ledige !== null && deltakere.length > status.ledige) {
    return {
      ok: false,
      feil: `Det er ${status.ledige} ${
        status.ledige === 1 ? "plass" : "plasser"
      } igjen, og du meldte på ${deltakere.length}. Ta bort noen navn og prøv igjen.`,
    };
  }

  // Telefonen kobles til påmeldingen så den kan få påminnelse dagen før.
  let enhetId: string | null = null;
  if (input.pushToken && gyldigToken(input.pushToken)) {
    try {
      enhetId = await lagreEnhet(input.pushToken, null);
    } catch (feil) {
      console.error("Kunne ikke lagre enhet", feil);
    }
  }

  let pameldingId: string;
  try {
    pameldingId = await opprettPamelding({
      arrangementId: arrangement.id,
      enhetId,
      kontaktNavn,
      kontaktTelefon: kontaktTelefon || null,
      kontaktEpost: kontaktEpost || null,
      melding: melding || null,
      deltakere,
    });
  } catch (feil) {
    console.error("Kunne ikke lagre påmelding", feil);
    return {
      ok: false,
      feil: "Påmeldingen ble ikke lagret. Prøv igjen.",
    };
  }

  // Ingen e-post sendes her. Den som melder seg på får kvitteringen i appen
  // med én gang, og den ansvarlige får én samlet oppsummering før
  // arrangementet i stedet for én melding per påmelding.

  revalidatePath("/");
  revalidatePath(`/arrangement/${arrangement.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/arrangementer");

  return { ok: true, pameldingId, antall: deltakere.length };
}

/**
 * Avmelder fra appen. Samme vei tilbake er ikke mulig via nettskjemaet — det
 * er bare telefonen som husker påmeldings-IDen.
 *
 * Hadde noen av deltakerne et kosthold- eller allergihensyn, varsler vi den
 * ansvarlige med én gang, i stedet for at hensynet blir stående uoppdaget
 * til oppsummeringen — den kommer jo ikke før arrangementet uansett.
 */
export async function meldAv(pameldingId: string): Promise<AvmeldingSvar> {
  const pamelding = await hentPameldingMedId(pameldingId);
  if (!pamelding) return { ok: false, feil: "Fant ikke påmeldingen." };
  if (pamelding.avmeldt) return { ok: true };

  const arrangement = await hentArrangementMedId(pamelding.arrangement_id);

  await avmeldPamelding(pameldingId);

  if (arrangement && pamelding.deltakere.some((d) => d.kosthold)) {
    try {
      await sendAvmeldingsvarsel(arrangement, pamelding);
    } catch (feil) {
      console.error("Kunne ikke sende avmeldingsvarsel", feil);
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
