"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { slettSerieAction } from "@/app/admin/actions";

/** Sletter alle forekomstene i en serie samlet, med samme to-trinns bekreftelse som enkeltsletting. */
export function SlettSerie({
  serieId,
  antall,
  tittel,
}: {
  serieId: string;
  antall: number;
  tittel: string;
}) {
  const [sporr, settSporr] = useState(false);

  if (!sporr) {
    return (
      <button
        type="button"
        className="tekstknapp tekstknapp--fare"
        onClick={() => settSporr(true)}
      >
        Slett hele serien
      </button>
    );
  }

  return (
    <form action={slettSerieAction} className="bekreft">
      <input type="hidden" name="serie_id" value={serieId} />
      <p className="bekreft__sporsmal">
        Slette alle {antall} forekomstene av «{tittel}», og påmeldingene til hver av dem? Dette
        kan ikke angres.
      </p>
      <div className="bekreft__valg">
        <Bekreft />
        <button
          type="button"
          className="knapp knapp--stille knapp--liten"
          onClick={() => settSporr(false)}
        >
          Behold
        </button>
      </div>
    </form>
  );
}

function Bekreft() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="knapp knapp--fare knapp--liten" disabled={pending}>
      {pending ? "Sletter …" : "Ja, slett alle"}
    </button>
  );
}
