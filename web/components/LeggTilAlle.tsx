"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { leggTilAlleAction, type Utsendingssvar } from "@/app/android/actions";

const START: Utsendingssvar = { ok: true };

/**
 * Knappen som avslutter runden: sender lenken til alle på lista og
 * nullstiller CSV-fila.
 *
 * Spørsmålet i to trinn er der fordi e-post ikke kan trekkes tilbake, og
 * fordi knappen bare skal trykkes etter at fila faktisk er lastet opp i
 * Play Console — trykker man for tidlig, får folk en lenke som ikke
 * slipper dem inn.
 */
export function LeggTilAlle({ antall }: { antall: number }) {
  const [sporr, settSporr] = useState(false);
  const [svar, send] = useActionState(leggTilAlleAction, START);

  return (
    <div className="utsending">
      {svar.melding && (
        <p className={`notis${svar.ok ? " notis--klar" : " notis--fare"}`} role="status">
          {svar.melding}
        </p>
      )}

      {!sporr ? (
        <button
          type="button"
          className="knapp"
          onClick={() => settSporr(true)}
          disabled={antall === 0}
        >
          Lagt til alle foreløpige e-poster
        </button>
      ) : (
        <form action={send} className="bekreft">
          <p className="bekreft__sporsmal">
            Har du lastet opp fila i Play Console? Da sendes lenken til appen til alle
            de {antall} på lista, og lista nullstilles.
          </p>
          <div className="bekreft__valg">
            <Bekreft antall={antall} />
            <button
              type="button"
              className="knapp knapp--stille knapp--liten"
              onClick={() => settSporr(false)}
            >
              Ikke ennå
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Bekreft({ antall }: { antall: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="knapp knapp--liten" disabled={pending}>
      {pending ? "Sender …" : `Ja, send lenken til ${antall}`}
    </button>
  );
}
