"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { meldPa, type Skjemastatus } from "@/app/arrangement/[slug]/actions";
import type { ArrangementMedAntall } from "@skjold/delt";

const START: Skjemastatus = { steg: "skjema" };

/**
 * Å si ja til en vakt. Man melder bare på seg selv — ingen skal kunne
 * sette naboen opp til å bake kaker — så skjemaet er ett navn, eventuelt
 * et nummer, og hva man tar med seg.
 */
export function Pameldingsskjema({ arrangement }: { arrangement: ArrangementMedAntall }) {
  const [status, send] = useActionState(meldPa, START);

  if (status.steg === "kvittert") {
    return <Kvittering arrangement={arrangement} />;
  }

  const feltfeil = status.feltfeil ?? {};

  return (
    <form action={send} className="skjema" noValidate>
      <input type="hidden" name="slug" value={arrangement.slug} />

      {status.feil && (
        <p className="notis notis--fare" role="alert">
          {status.feil}
        </p>
      )}

      <section className="bolk">
        <p className="felt__hjelp">
          {arrangement.krev_telefon || arrangement.krev_epost
            ? "Til denne oppgaven trenger den ansvarlige å kunne nå deg."
            : "Navnet ditt er alt vi trenger."}
        </p>

        <div className={`felt${feltfeil.navn ? " felt--feil" : ""}`}>
          <label className="felt__etikett" htmlFor="navn">
            Navn
          </label>
          <input
            id="navn"
            name="navn"
            className="felt__inn"
            autoComplete="name"
            required
          />
          {feltfeil.navn && <p className="felt__feil">{feltfeil.navn}</p>}
        </div>

        {(arrangement.krev_telefon || arrangement.krev_epost) && (
          <div className="rad2">
            {arrangement.krev_telefon && (
              <div className={`felt${feltfeil.telefon ? " felt--feil" : ""}`}>
                <label className="felt__etikett" htmlFor="telefon">
                  Telefon
                </label>
                <input
                  id="telefon"
                  name="telefon"
                  type="tel"
                  inputMode="tel"
                  className="felt__inn"
                  autoComplete="tel"
                  required
                />
                {feltfeil.telefon && <p className="felt__feil">{feltfeil.telefon}</p>}
              </div>
            )}

            {arrangement.krev_epost && (
              <div className={`felt${feltfeil.epost ? " felt--feil" : ""}`}>
                <label className="felt__etikett" htmlFor="epost">
                  E-post
                </label>
                <input
                  id="epost"
                  name="epost"
                  type="email"
                  inputMode="email"
                  className="felt__inn"
                  autoComplete="email"
                  required
                />
                <p className="felt__hjelp">Brukes hvis den ansvarlige må sende ut noe.</p>
                {feltfeil.epost && <p className="felt__feil">{feltfeil.epost}</p>}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="felt">
        <label className="felt__etikett" htmlFor="bidrag">
          Jeg bidrar med
        </label>
        <p className="felt__hjelp">
          Skriv gjerne hva du bidrar med i form av hva du tar med av mat og lignende
        </p>
        <textarea id="bidrag" name="bidrag" className="felt__inn felt__inn--omrade" rows={3} />
      </div>

      <Send />
    </form>
  );
}

function Send() {
  const { pending } = useFormStatus();
  return (
    <div className="skjema__send">
      <button type="submit" className="knapp" disabled={pending}>
        {pending ? "Sender …" : "Jeg kan hjelpe"}
      </button>
    </div>
  );
}

function Kvittering({ arrangement }: { arrangement: ArrangementMedAntall }) {
  return (
    <div className="notis notis--klar" role="status">
      <p className="merke">Du står på lista</p>
      <h3 className="kvittering__tittel">Takk for at du stiller.</h3>
      <p>
        {arrangement.ansvarlig_navn
          ? `${arrangement.ansvarlig_navn} tar kontakt hvis noe endrer seg.`
          : "Den ansvarlige tar kontakt hvis noe endrer seg."}{" "}
        Har du appen, får du en påminnelse dagen før.
      </p>
    </div>
  );
}
