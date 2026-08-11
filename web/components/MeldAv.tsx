"use client";

import { useState } from "react";
import { slettPameldingAction } from "@/app/admin/actions";

/** Å fjerne noen fra lista kan ikke angres, så vi spør én gang først. */
export function MeldAv({
  pameldingId,
  arrangementId,
  kontaktNavn,
  antall,
}: {
  pameldingId: string;
  arrangementId: string;
  kontaktNavn: string;
  antall: number;
}) {
  const [sporr, settSporr] = useState(false);

  if (!sporr) {
    return (
      <button type="button" className="tekstknapp" onClick={() => settSporr(true)}>
        Meld av
      </button>
    );
  }

  return (
    <form action={slettPameldingAction} className="bekreft">
      <input type="hidden" name="pamelding_id" value={pameldingId} />
      <input type="hidden" name="arrangement_id" value={arrangementId} />
      <p className="bekreft__sporsmal">
        Fjerne {kontaktNavn} og {antall === 1 ? "påmeldingen" : `de ${antall} plassene`}?
      </p>
      <div className="bekreft__valg">
        <button type="submit" className="knapp knapp--fare knapp--liten">
          Meld av
        </button>
        <button
          type="button"
          className="knapp knapp--stille knapp--liten"
          onClick={() => settSporr(false)}
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
