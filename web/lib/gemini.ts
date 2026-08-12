import "server-only";

/**
 * Headline-bilder via Gemini.
 *
 * Uten GEMINI_API_KEY er dette bare skrudd av — «Generer bilde»-knappen
 * gir da en tydelig feilmelding i stedet for å late som noe fungerer.
 */

const MODELL = "gemini-3.1-flash-image";
const API = `https://generativelanguage.googleapis.com/v1beta/models/${MODELL}:generateContent`;

export function harGemini() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type GenerertBilde = { data: Buffer; mimeType: string };

type GenereringsSvar = { ok: true; bilde: GenerertBilde } | { ok: false; grunn: string };

function lagPrompt(tittel: string) {
  return [
    `Lag et enkelt, rolig headline-bilde til et arrangement kalt «${tittel}», til nettsiden og appen til en norsk kirkemenighet.`,
    "",
    "Stil: flat, minimalistisk illustrasjon med myke former. Dempede, varme jordfarger — ikke blanke, glansy eller fotorealistiske flater. Ingen 3D-rendering eller airbrush-effekt. Tenk enkel vektorillustrasjon eller papirklipp, med god plass og ro i komposisjonen.",
    "",
    "Ikke ta med tekst, bokstaver, logoer eller ansikter i nærbilde. Bildet skal virke stillferdig og innbydende, ikke skrikende eller kommersielt.",
  ].join("\n");
}

export async function genererBilde(tittel: string): Promise<GenereringsSvar> {
  if (!harGemini()) {
    return { ok: false, grunn: "Bildegenerering er ikke satt opp ennå." };
  }

  let svar: Response;
  try {
    svar = await fetch(`${API}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: lagPrompt(tittel) }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: "16:9" },
        },
      }),
    });
  } catch (feil) {
    console.error("[gemini] Nettverksfeil", feil);
    return { ok: false, grunn: "Fikk ikke kontakt med bildetjenesten. Prøv igjen." };
  }

  if (!svar.ok) {
    const tekst = await svar.text().catch(() => "");
    console.error(`[gemini] ${svar.status}: ${tekst}`);
    return { ok: false, grunn: "Fikk ikke generert bilde. Prøv igjen." };
  }

  let json: unknown;
  try {
    json = await svar.json();
  } catch {
    return { ok: false, grunn: "Fikk et svar vi ikke forsto. Prøv igjen." };
  }

  const deler = (json as GenerateContentSvar)?.candidates?.[0]?.content?.parts ?? [];
  const bildedel = deler.find((d) => d.inlineData?.data);

  if (!bildedel?.inlineData) {
    console.error("[gemini] Ingen bildedata i svaret", JSON.stringify(json).slice(0, 500));
    return { ok: false, grunn: "Fikk ikke generert bilde. Prøv igjen." };
  }

  return {
    ok: true,
    bilde: {
      data: Buffer.from(bildedel.inlineData.data, "base64"),
      mimeType: bildedel.inlineData.mimeType || "image/png",
    },
  };
}

type GenerateContentSvar = {
  candidates?: {
    content?: {
      parts?: { inlineData?: { data: string; mimeType?: string } }[];
    };
  }[];
};
