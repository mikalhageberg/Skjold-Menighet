"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendMeldingAction, type Svar } from "@/app/admin/actions";

const START: Svar = { ok: true };

export function MeldingSkjema({
  arrangementId,
  antallMottakere,
  antallPameldinger,
  tittel,
}: {
  arrangementId: string;
  antallMottakere: number;
  antallPameldinger: number;
  tittel: string;
}) {
  const [svar, send] = useActionState(sendMeldingAction, START);

  if (antallMottakere === 0) {
    return (
      <p className="stille">
        {antallPameldinger === 0
          ? "Så snart noen har meldt seg på og lagt igjen e-postadressen sin, kan du sende dem en melding herfra."
          : "Ingen av de påmeldte har oppgitt e-postadresse, så det er ingen å sende til herfra. Telefonnumrene står i lista over."}
      </p>
    );
  }

  return (
    <form action={send} className="skjema">
      <input type="hidden" name="arrangement_id" value={arrangementId} />

      {svar.melding && (
        <p className={`notis${svar.ok ? " notis--klar" : " notis--fare"}`} role="status">
          {svar.melding}
        </p>
      )}

      <div className="felt">
        <label className="felt__etikett" htmlFor="emne">
          Emne
        </label>
        <input
          id="emne"
          name="emne"
          className="felt__inn"
          defaultValue={`Om ${tittel.toLowerCase()}`}
          required
        />
      </div>

      <div className="felt">
        <label className="felt__etikett" htmlFor="tekst">
          Melding
        </label>
        <p className="felt__hjelp">Blank linje mellom avsnitt.</p>
        <textarea
          id="tekst"
          name="tekst"
          className="felt__inn felt__inn--omrade"
          rows={6}
          required
        />
      </div>

      <Send antall={antallMottakere} />
    </form>
  );
}

function Send({ antall }: { antall: number }) {
  const { pending } = useFormStatus();
  return (
    <div>
      <button type="submit" className="knapp knapp--stille" disabled={pending}>
        {pending ? "Sender …" : `Send til ${antall} ${antall === 1 ? "mottaker" : "mottakere"}`}
      </button>
    </div>
  );
}
