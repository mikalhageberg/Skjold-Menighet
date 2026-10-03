"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { slettSerieAction } from "@/app/admin/actions";

/** Sletter alle forekomstene i en serie samlet, med samme to-trinns bekreftelse som enkeltsletting. */
export function SlettSerie({
  serieId,
  antall,
  tittel,
  harKommende,
}: {
  serieId: string;
  antall: number;
  tittel: string;
  harKommende: boolean;
}) {
  const [sporr, settSporr] = useState(false);

  if (!sporr) {
    return (
      <button
        type="button"
        className="tekstknapp tekstknapp--fare"
        onClick={() => settSporr(true)}
      >
        {harKommende ? "Avlys hele serien" : "Slett hele serien"}
      </button>
    );
  }

  return (
    <form action={slettSerieAction} className="bekreft">
      <input type="hidden" name="serie_id" value={serieId} />
      <p className="bekreft__sporsmal">
        {harKommende
          ? `Avlyse alle ${antall} forekomstene av «${tittel}»? De frivillige som meldte seg i appen, får ett varsel hver, uansett hvor mange av datoene de sto på. Dette kan ikke angres.`
          : `Slette alle ${antall} forekomstene av «${tittel}», og de frivillige på hver av dem? Dette kan ikke angres.`}
      </p>
      <div className="bekreft__valg">
        <Bekreft avlys={harKommende} />
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

function Bekreft({ avlys }: { avlys: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="knapp knapp--fare knapp--liten" disabled={pending}>
      {avlys
        ? pending ? "Avlyser …" : "Ja, avlys alle"
        : pending ? "Sletter …" : "Ja, slett alle"}
    </button>
  );
}
