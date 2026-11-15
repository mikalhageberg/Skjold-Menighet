"use client";

import { useState, useTransition } from "react";
import { genererBilderAction } from "@/app/admin/actions";

/**
 * Genererer tre forslag til headline-bilde og lar admin velge ett før
 * arrangementet lagres. Bare det valgte følger med skjemaet — de skjulte
 * feltene her sendes inn sammen med resten av dataene.
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
  const eksisterende =
    arrangementId && eksisterendeBildeGenerert
      ? `/api/offentlig/bilde/${arrangementId}?v=${encodeURIComponent(eksisterendeBildeGenerert)}`
      : null;

  const [forslag, settForslag] = useState<string[]>([]);
  const [valgt, settValgt] = useState<number | null>(null);
  const [fjernet, settFjernet] = useState(false);
  const [feil, settFeil] = useState<string | null>(null);
  const [genererer, startGenerering] = useTransition();

  const tittelTom = !tittel.trim();
  const nyDataUrl = valgt !== null ? forslag[valgt] ?? null : null;
  const visEksisterende = !fjernet && !nyDataUrl && eksisterende;
  const harBilde = Boolean(nyDataUrl || visEksisterende);

  function generer() {
    settFeil(null);
    startGenerering(async () => {
      const svar = await genererBilderAction(tittel);
      if (!svar.ok) {
        settFeil(svar.feil);
        return;
      }
      settForslag(svar.dataUrler);
      settValgt(0);
      settFjernet(false);
    });
  }

  function fjern() {
    settForslag([]);
    settValgt(null);
    settFjernet(true);
  }

  return (
    <div className="felt">
      <label className="felt__etikett">Headline-bilde</label>
      <p className="felt__hjelp">
        Enkle, stilrene bilder generert med AI ut fra navnet på arrangementet. Du får tre
        forslag å velge mellom. Valgfritt.
      </p>

      {forslag.length > 0 ? (
        <>
          <div className="bildevelger__forslag" role="radiogroup" aria-label="Velg bilde">
            {forslag.map((url, i) => (
              <button
                key={url.slice(-40) + i}
                type="button"
                role="radio"
                aria-checked={valgt === i}
                aria-label={`Forslag ${i + 1}`}
                className="bildevelger__valg"
                onClick={() => settValgt(i)}
                disabled={genererer}
              >
                <img src={url} alt="" className="bildevelger__bilde" />
              </button>
            ))}
          </div>
          <p className="felt__hjelp">
            {valgt !== null
              ? `Forslag ${valgt + 1} er valgt. Trykk på et annet bilde for å bytte.`
              : "Trykk på bildet du vil bruke."}
          </p>
        </>
      ) : (
        visEksisterende && <img src={eksisterende} alt="" className="bildevelger__bilde" />
      )}

      {feil && <p className="felt__feil">{feil}</p>}

      <div className="bildevelger__knapper">
        <button
          type="button"
          className="knapp knapp--stille knapp--liten"
          onClick={generer}
          disabled={genererer || tittelTom}
        >
          {genererer
            ? "Genererer tre forslag …"
            : forslag.length > 0 || harBilde
              ? "Generer tre nye forslag"
              : "Generer bilder med AI"}
        </button>
        {harBilde && (
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

      {tittelTom && !harBilde && (
        <p className="felt__hjelp">Skriv inn navnet på arrangementet først.</p>
      )}

      <input type="hidden" name="bilde_data" value={nyDataUrl ?? ""} />
      <input type="hidden" name="bilde_fjern" value={fjernet ? "på" : ""} />
    </div>
  );
}
