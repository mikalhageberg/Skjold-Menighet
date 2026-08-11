import "server-only";
import type { ArrangementMedAntall, PameldingMedDeltakere } from "@skjold/delt";
import { langDato } from "@skjold/delt";

/**
 * E-post via Brevo (transactional API v3).
 *
 * Uten BREVO_API_KEY logges meldingene til konsollen i stedet for å sendes,
 * slik at resten av appen fungerer før nøkkelen er på plass. Utsending skal
 * aldri kunne velte en påmelding – feil fanges og rapporteres tilbake.
 */

const API = "https://api.brevo.com/v3/smtp/email";

type Mottaker = { email: string; name?: string };

type Utsending = {
  til: Mottaker[];
  emne: string;
  html: string;
  svarTil?: Mottaker;
};

export function harBrevo() {
  return Boolean(process.env.BREVO_API_KEY);
}

function avsender() {
  return {
    name: process.env.BREVO_SENDER_NAME || "Skjold menighet",
    email: process.env.BREVO_SENDER_EMAIL || "post@skjold-menighet.no",
  };
}

export async function sendEpost({ til, emne, html, svarTil }: Utsending) {
  const gyldige = til.filter((m) => m.email && m.email.includes("@"));
  if (gyldige.length === 0) return { sendt: false, grunn: "ingen mottakere" as const };

  if (!harBrevo()) {
    console.info(
      `[brevo] Ikke konfigurert. Ville sendt «${emne}» til ${gyldige
        .map((m) => m.email)
        .join(", ")}`,
    );
    return { sendt: false, grunn: "ikke konfigurert" as const };
  }

  try {
    const svar = await fetch(API, {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: avsender(),
        to: gyldige,
        subject: emne,
        htmlContent: html,
        ...(svarTil ? { replyTo: svarTil } : {}),
      }),
    });

    if (!svar.ok) {
      const tekst = await svar.text();
      console.error(`[brevo] ${svar.status}: ${tekst}`);
      return { sendt: false, grunn: "avvist av brevo" as const };
    }
    return { sendt: true as const };
  } catch (feil) {
    console.error("[brevo] Nettverksfeil", feil);
    return { sendt: false, grunn: "nettverksfeil" as const };
  }
}

/* ── Maler ───────────────────────────────────────────────────────────── */

function ramme(innhold: string) {
  return `<div style="font-family:Georgia,'Times New Roman',serif;color:#16302A;background:#EFF2EE;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#FAFBF8;border:1px solid #D2DAD4;padding:32px">
    ${innhold}
    <hr style="border:none;border-top:1px solid #D2DAD4;margin:28px 0 16px">
    <p style="font-size:13px;color:#3E5B53;margin:0;font-family:Helvetica,Arial,sans-serif">
      Skjold menighet · Denne meldingen er sendt fra påmeldingssystemet.
    </p>
  </div>
</div>`;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Oppsummeringen til den ansvarlige.
 *
 * Én e-post per arrangement i stedet for én per påmelding — med alt man
 * trenger for å handle inn og dekke bord: hvor mange, hvem, hva de ikke
 * tåler, og hva de har skrevet. Sendes et valgt antall dager før start,
 * eller som testutgave når den ansvarlige ber om det.
 */
export async function sendOppsummering(
  arrangement: ArrangementMedAntall,
  pameldinger: PameldingMedDeltakere[],
  { test = false }: { test?: boolean } = {},
) {
  if (!arrangement.ansvarlig_epost) return { sendt: false, grunn: "ingen ansvarlig" as const };

  const deltakere = pameldinger.flatMap((p) => p.deltakere);
  const kosthold = deltakere.filter((d) => d.kosthold);
  const kommentarer = pameldinger.filter((p) => p.melding);

  const rad = (venstre: string, hoyre: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#3E5B53;white-space:nowrap">${venstre}</td><td style="padding:6px 0"><strong>${hoyre}</strong></td></tr>`;

  const navneliste = pameldinger
    .map((p) => {
      const navn = p.deltakere
        .map((d) => esc(d.navn) + (d.kosthold ? ` <span style="color:#99332A">(${esc(d.kosthold)})</span>` : ""))
        .join(", ");
      const kontakt = [p.kontakt_telefon, p.kontakt_epost]
        .filter((v): v is string => Boolean(v))
        .map(esc)
        .join(" · ");
      return `<li style="margin-bottom:8px">${navn}${
        kontakt ? `<br><span style="color:#3E5B53;font-size:13px">${esc(p.kontakt_navn)} · ${kontakt}</span>` : ""
      }</li>`;
    })
    .join("");

  const kostholdsliste = kosthold
    .map((d) => `<li style="margin-bottom:4px">${esc(d.navn)} — <strong>${esc(d.kosthold!)}</strong></li>`)
    .join("");

  const kommentarliste = kommentarer
    .map(
      (p) =>
        `<li style="margin-bottom:10px">${esc(p.melding!)}<br><span style="color:#3E5B53;font-size:13px">— ${esc(
          p.kontakt_navn,
        )}</span></li>`,
    )
    .join("");

  const bolk = (tittel: string, innhold: string) =>
    innhold
      ? `<h2 style="font-size:15px;letter-spacing:.06em;text-transform:uppercase;color:#3E5B53;margin:28px 0 10px;font-family:Helvetica,Arial,sans-serif">${tittel}</h2><ul style="margin:0;padding-left:20px">${innhold}</ul>`
      : "";

  return sendEpost({
    til: [{ email: arrangement.ansvarlig_epost, name: arrangement.ansvarlig_navn ?? undefined }],
    emne: `${test ? "[Test] " : ""}${arrangement.tittel}: ${deltakere.length} påmeldte`,
    html: ramme(`
      ${
        test
          ? `<p style="margin:0 0 20px;padding:10px 14px;background:#ECDFC2;border-left:3px solid #8F6716;font-size:14px">Dette er en testutgave, sendt fordi du ba om den. Den ekte kommer av seg selv før arrangementet.</p>`
          : ""
      }
      <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#3E5B53;margin:0 0 8px;font-family:Helvetica,Arial,sans-serif">Oppsummering før</p>
      <h1 style="font-size:26px;margin:0 0 4px;font-weight:600">${esc(arrangement.tittel)}</h1>
      <p style="margin:0 0 24px;color:#3E5B53">${esc(langDato(new Date(arrangement.starter)))} · ${esc(
        arrangement.sted,
      )}</p>

      <table style="border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;font-size:15px">
        ${rad("Påmeldte", String(deltakere.length) + (arrangement.kapasitet ? ` av ${arrangement.kapasitet}` : ""))}
        ${rad("Påmeldinger", String(pameldinger.length))}
        ${kosthold.length ? rad("Hensyn til kosthold", String(kosthold.length)) : ""}
        ${kommentarer.length ? rad("Kommentarer", String(kommentarer.length)) : ""}
      </table>

      ${bolk("Hvem kommer", navneliste)}
      ${bolk("Allergi og kosthold", kostholdsliste)}
      ${bolk("Kommentarer", kommentarliste)}

      ${
        deltakere.length === 0
          ? `<p style="margin:24px 0 0;color:#3E5B53">Ingen har meldt seg på ennå.</p>`
          : ""
      }
    `),
  });
}

export async function sendTilPameldte(
  arrangement: ArrangementMedAntall,
  mottakere: Mottaker[],
  emne: string,
  tekst: string,
) {
  const avsnitt = tekst
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.6">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

  return sendEpost({
    til: mottakere,
    emne,
    svarTil: arrangement.ansvarlig_epost
      ? { email: arrangement.ansvarlig_epost, name: arrangement.ansvarlig_navn ?? undefined }
      : undefined,
    html: ramme(`
      <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#3E5B53;margin:0 0 8px;font-family:Helvetica,Arial,sans-serif">${esc(
        arrangement.tittel,
      )}</p>
      <h1 style="font-size:24px;margin:0 0 20px;font-weight:600">${esc(emne)}</h1>
      ${avsnitt}
    `),
  });
}
