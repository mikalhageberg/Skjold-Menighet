import "server-only";
import type { ArrangementMedAntall } from "@skjold/delt";

/**
 * E-post via Brevo (transactional API v3).
 *
 * E-post går bare én vei nå: meldinger den ansvarlige skriver og sender
 * selv fra admin. Alt som går ut av seg selv — påminnelsen dagen før, nye
 * oppgaver, avbud — er push til appen, som er det de frivillige leser.
 *
 * Uten BREVO_API_KEY logges meldingene til konsollen i stedet for å sendes,
 * slik at resten av appen fungerer før nøkkelen er på plass.
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
      Skjold menighet · Du får denne fordi du står oppført som frivillig.
    </p>
  </div>
</div>`;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Meldingen den ansvarlige skriver selv og sender til dem som har sagt ja. */
export async function sendTilFrivillige(
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
