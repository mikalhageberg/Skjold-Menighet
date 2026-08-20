"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loggInn, type Svar } from "@/app/admin/actions";

const START: Svar = { ok: true };

export function LoggInnSkjema() {
  const [svar, send] = useActionState(loggInn, START);

  return (
    <form action={send} className="skjema">
      {!svar.ok && svar.melding && (
        <p className="notis notis--fare" role="alert">
          {svar.melding}
        </p>
      )}

      <div className="felt">
        <label className="felt__etikett" htmlFor="brukernavn">
          Brukernavn
        </label>
        <input
          id="brukernavn"
          name="brukernavn"
          type="text"
          className="felt__inn"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </div>

      <div className="felt">
        <label className="felt__etikett" htmlFor="passord">
          Passord
        </label>
        <input
          id="passord"
          name="passord"
          type="password"
          className="felt__inn"
          autoComplete="current-password"
          required
        />
      </div>

      <Send />
    </form>
  );
}

function Send() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="knapp" disabled={pending}>
      {pending ? "Logger inn …" : "Logg inn"}
    </button>
  );
}
