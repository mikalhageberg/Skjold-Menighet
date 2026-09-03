"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { meldPaaAndroidtest, type Teststatus } from "@/app/app/actions";

const START: Teststatus = { steg: "skjema" };

/**
 * De to veiene til appen.
 *
 * iPhone går rett i App Store. Android kan ikke det: appen ligger i lukket
 * test, og Google slipper bare inn adresser vi har lagt inn på forhånd.
 * Derfor åpner Android-knappen et felt for e-postadressen i stedet for en
 * butikklenke — og teksten sier hvorfor, så det ikke føles som en sperre.
 */
export function Nedlasting({ appStore }: { appStore: string | null }) {
  const [aapen, settAapen] = useState(false);
  const [status, send] = useActionState(meldPaaAndroidtest, START);

  return (
    <div className="nedlast">
      <div className="nedlast__valg">
        {appStore ? (
          <a className="knapp nedlast__knapp" href={appStore}>
            <span className="nedlast__for">iPhone og iPad</span>
            <span className="nedlast__hva">Hent i App Store</span>
          </a>
        ) : (
          <p className="nedlast__venter">
            <span className="nedlast__for">iPhone og iPad</span>
            <span className="nedlast__hva">Appen er ikke i App Store ennå.</span>
          </p>
        )}

        <button
          type="button"
          className="knapp nedlast__knapp"
          onClick={() => settAapen(true)}
          aria-expanded={aapen}
          aria-controls="android-skjema"
        >
          <span className="nedlast__for">Android</span>
          <span className="nedlast__hva">Hent i Google Play</span>
        </button>
      </div>

      {aapen && (
        <section id="android-skjema" className="nedlast__android">
          {status.steg === "kvittert" ? (
            <div className="notis notis--klar" role="status">
              <p className="merke">Takk</p>
              <h2 className="kvittering__tittel">Vi har adressen din.</h2>
              <p>
                Du får lenken til appen på e-post så snart vi har lagt deg inn. Det
                pleier å gå en dag eller to. Se gjerne i søppelposten hvis den ikke
                dukker opp.
              </p>
            </div>
          ) : (
            <form action={send} className="skjema" noValidate>
              <div className="bolk">
                <h2 className="nedlast__tittel">Vi sender deg lenken på e-post</h2>
                <p className="felt__hjelp">
                  Android-appen er ennå på test, og da må du oppgi e-post for å få
                  tilsendt lenken til appen på mail. Bruk den samme adressen som du
                  har på telefonen din.
                </p>
              </div>

              <div className="felt">
                <label className="felt__etikett" htmlFor="epost">
                  E-postadressen din
                </label>
                <input
                  id="epost"
                  name="epost"
                  type="email"
                  inputMode="email"
                  className="felt__inn"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="navn@example.no"
                  required
                />
                {status.feil && (
                  <p className="felt__feil" role="alert">
                    {status.feil}
                  </p>
                )}
              </div>

              <Send />

              <p className="felt__hjelp">
                Adressen brukes bare til å gi deg tilgang til appen, og til å sende
                deg lenken. Ingenting annet.
              </p>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

function Send() {
  const { pending } = useFormStatus();
  return (
    <div className="skjema__send">
      <button type="submit" className="knapp" disabled={pending}>
        {pending ? "Sender …" : "Send meg lenken"}
      </button>
    </div>
  );
}
