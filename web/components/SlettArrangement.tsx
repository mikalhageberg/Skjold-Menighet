"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { slettArrangementAction } from "@/app/admin/actions";

/**
 * Sletting i to trinn. Brukes både i lista over alle arrangementer og
 * nederst på det enkelte arrangementet, så spørsmålet er det samme
 * uansett hvor man står når man trykker.
 */
export function SlettArrangement({
  id,
  tittel,
  antallFrivillige,
  variant = "knapp",
}: {
  id: string;
  tittel: string;
  antallFrivillige: number;
  /** «lenke» er den kompakte varianten som passer i en tabellrad. */
  variant?: "knapp" | "lenke";
}) {
  const [sporr, settSporr] = useState(false);

  if (!sporr) {
    return (
      <button
        type="button"
        className={variant === "lenke" ? "tekstknapp tekstknapp--fare" : "knapp knapp--fare knapp--liten"}
        onClick={() => settSporr(true)}
      >
        {variant === "lenke" ? "Slett" : "Slett arrangementet"}
      </button>
    );
  }

  return (
    <form action={slettArrangementAction} className="bekreft">
      <input type="hidden" name="id" value={id} />
      <p className="bekreft__sporsmal">
        Slette «{tittel}»
        {antallFrivillige > 0 &&
          ` og lista over ${antallFrivillige} frivillige`}? Dette kan ikke angres.
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
      {pending ? "Sletter …" : "Ja, slett"}
    </button>
  );
}
