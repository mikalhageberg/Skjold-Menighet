"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendTestoppsummeringAction, type Svar } from "@/app/admin/actions";

const START: Svar = { ok: true };

/**
 * Lar den ansvarlige se oppsummeringen før den sendes av seg selv.
 * Testen bruker de påmeldingene som finnes akkurat nå.
 */
export function Oppsummeringstest({
  arrangementId,
  ansvarligEpost,
}: {
  arrangementId: string;
  ansvarligEpost: string | null;
}) {
  const [svar, send] = useActionState(sendTestoppsummeringAction, START);

  if (!ansvarligEpost) {
    return (
      <p className="stille">
        Ingen ansvarlig med e-postadresse er lagt inn, så oppsummeringen har ingen mottaker.
        Fyll inn navn og e-post under «Ansvarlig» nedenfor.
      </p>
    );
  }

  return (
    <form action={send}>
      <input type="hidden" name="arrangement_id" value={arrangementId} />
      {svar.melding && (
        <p
          className={`notis${svar.ok ? " notis--klar" : " notis--fare"}`}
          role="status"
          style={{ marginBottom: "1.25rem" }}
        >
          {svar.melding}
        </p>
      )}
      <Send epost={ansvarligEpost} />
    </form>
  );
}

function Send({ epost }: { epost: string }) {
  const { pending } = useFormStatus();
  return (
    <div style={{ display: "grid", gap: "0.75rem", justifyItems: "start" }}>
      <button type="submit" className="knapp knapp--stille knapp--liten" disabled={pending}>
        {pending ? "Sender …" : "Send testutgave nå"}
      </button>
      <p className="felt__hjelp">
        Går til {epost} med de påmeldingene som finnes nå. Den ekte sendes uansett til
        oppsatt tid.
      </p>
    </div>
  );
}
