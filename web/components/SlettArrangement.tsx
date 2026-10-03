"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { slettArrangementAction } from "@/app/admin/actions";

/**
 * Avlysning i to trinn. Brukes både i lista over alle arrangementer og
 * nederst på det enkelte arrangementet, så spørsmålet er det samme
 * uansett hvor man står når man trykker.
 *
 * Noe som ligger framover blir avlyst, og de frivillige med appen får
 * beskjed. Noe som alt er over blir bare slettet — det er ingen å varsle.
 */
export function SlettArrangement({
  id,
  tittel,
  starter,
  antallFrivillige,
  variant = "knapp",
}: {
  id: string;
  tittel: string;
  starter: string;
  antallFrivillige: number;
  /** «lenke» er den kompakte varianten som passer i en tabellrad. */
  variant?: "knapp" | "lenke";
}) {
  const [sporr, settSporr] = useState(false);
  const avlys = erFramover(starter);

  if (!sporr) {
    return (
      <button
        type="button"
        className={variant === "lenke" ? "tekstknapp tekstknapp--fare" : "knapp knapp--fare knapp--liten"}
        onClick={() => settSporr(true)}
      >
        {variant === "lenke"
          ? avlys ? "Avlys" : "Slett"
          : avlys ? "Avlys arrangementet" : "Slett arrangementet"}
      </button>
    );
  }

  return (
    <form action={slettArrangementAction} className="bekreft">
      <input type="hidden" name="id" value={id} />
      <p className="bekreft__sporsmal">
        {avlys
          ? `Avlyse «${tittel}»?${
              antallFrivillige > 0
                ? ` De frivillige som meldte seg i appen, får et varsel om det.`
                : ""
            } Dette kan ikke angres.`
          : `Slette «${tittel}»${
              antallFrivillige > 0 ? ` og lista over ${antallFrivillige} frivillige` : ""
            }? Dette kan ikke angres.`}
      </p>
      <div className="bekreft__valg">
        <Bekreft avlys={avlys} />
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

function erFramover(starter: string) {
  return new Date(starter).getTime() > Date.now();
}

function Bekreft({ avlys }: { avlys: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="knapp knapp--fare knapp--liten" disabled={pending}>
      {avlys ? (pending ? "Avlyser …" : "Ja, avlys") : pending ? "Sletter …" : "Ja, slett"}
    </button>
  );
}
