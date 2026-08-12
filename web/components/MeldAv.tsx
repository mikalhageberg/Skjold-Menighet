"use client";

import { useState } from "react";
import { meldAvAction } from "@/app/admin/actions";

/**
 * Avbud på vegne av en som har ringt. Det sender samme varsel til de andre
 * som når hun trykker selv i appen, så vi spør én gang først.
 */
export function MeldAv({
  pameldingId,
  arrangementId,
  navn,
}: {
  pameldingId: string;
  arrangementId: string;
  navn: string;
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
    <form action={meldAvAction} className="bekreft">
      <input type="hidden" name="pamelding_id" value={pameldingId} />
      <input type="hidden" name="arrangement_id" value={arrangementId} />
      <p className="bekreft__sporsmal">
        Melde av {navn}? De andre med appen får beskjed om at det er blitt en ledig plass.
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
