"use client";

import { useState, useTransition } from "react";
import { genererBildeAction } from "@/app/admin/actions";

/**
 * Genererer og forhåndsviser et headline-bilde før arrangementet lagres.
 * Selve bytene sendes ikke til serveren for lagring før hele skjemaet
 * sendes inn — de skjulte feltene her følger med resten av dataene.
 */
export function BildeVelger({
  arrangementId,
  tittel,
  eksisterendeBildeGenerert,
}: {
  arrangementId?: string;
  tittel: string;
  eksisterendeBildeGenerert?: string | null;
}) {
  const [forhandsvisning, settForhandsvisning] = useState<string | null>(
    arrangementId && eksisterendeBildeGenerert
      ? `/api/offentlig/bilde/${arrangementId}?v=${encodeURIComponent(eksisterendeBildeGenerert)}`
      : null,
  );
  const [nyDataUrl, settNyDataUrl] = useState<string | null>(null);
  const [fjernet, settFjernet] = useState(false);
  const [feil, settFeil] = useState<string | null>(null);
  const [genererer, startGenerering] = useTransition();

  const tittelTom = !tittel.trim();

  function generer() {
    settFeil(null);
    startGenerering(async () => {
      const svar = await genererBildeAction(tittel);
      if (!svar.ok) {
        settFeil(svar.feil);
        return;
      }
      settNyDataUrl(svar.dataUrl);
      settForhandsvisning(svar.dataUrl);
      settFjernet(false);
    });
  }

  function fjern() {
    settForhandsvisning(null);
    settNyDataUrl(null);
    settFjernet(true);
  }

  return (
    <div className="felt">
      <label className="felt__etikett">Headline-bilde</label>
      <p className="felt__hjelp">
        Et enkelt, stilrent bilde generert med AI ut fra navnet på arrangementet. Valgfritt.
      </p>

      {forhandsvisning && (
        <img src={forhandsvisning} alt="" className="bildevelger__bilde" />
      )}

      {feil && <p className="felt__feil">{feil}</p>}

      <div className="bildevelger__knapper">
        <button
          type="button"
          className="knapp knapp--stille knapp--liten"
          onClick={generer}
          disabled={genererer || tittelTom}
        >
          {genererer ? "Genererer …" : forhandsvisning ? "Generer på nytt" : "Generer bilde med AI"}
        </button>
        {forhandsvisning && (
          <button
            type="button"
            className="knapp knapp--stille knapp--liten"
            onClick={fjern}
            disabled={genererer}
          >
            Fjern bilde
          </button>
        )}
      </div>

      {tittelTom && !forhandsvisning && (
        <p className="felt__hjelp">Skriv inn navnet på arrangementet først.</p>
      )}

      <input type="hidden" name="bilde_data" value={nyDataUrl ?? ""} />
      <input type="hidden" name="bilde_fjern" value={fjernet ? "på" : ""} />
    </div>
  );
}
