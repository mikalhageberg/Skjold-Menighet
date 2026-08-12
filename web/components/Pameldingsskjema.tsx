"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { meldPa, type Skjemastatus } from "@/app/arrangement/[slug]/actions";
import type { ArrangementMedAntall } from "@skjold/delt";

type Deltaker = { navn: string; kosthold: string };

const START: Skjemastatus = { steg: "skjema" };

export function Pameldingsskjema({
  arrangement,
  ledige,
}: {
  arrangement: ArrangementMedAntall;
  ledige: number | null;
}) {
  const [status, send] = useActionState(meldPa, START);
  const [kontaktNavn, settKontaktNavn] = useState("");
  const [deltakere, settDeltakere] = useState<Deltaker[]>([
    { navn: "", kosthold: "" },
  ]);
  // Første navn følger kontaktnavnet til noen skriver noe annet der.
  const [rortForste, settRortForste] = useState(false);

  if (status.steg === "kvittert") {
    return <Kvittering status={status} arrangement={arrangement} />;
  }

  const endre = (i: number, endring: Partial<Deltaker>) =>
    settDeltakere((d) => d.map((x, j) => (j === i ? { ...x, ...endring } : x)));

  const feltfeil = status.feltfeil ?? {};
  const kanLeggeTil =
    arrangement.tillat_flere && (ledige === null || deltakere.length < ledige);

  return (
    <form action={send} className="skjema" noValidate>
      <input type="hidden" name="slug" value={arrangement.slug} />

      {status.feil && (
        <p className="notis notis--fare" role="alert">
          {status.feil}
        </p>
      )}

      <section className="bolk">
        <h3 className="bolk__tittel">Hvem melder på?</h3>
        <p className="felt__hjelp">
          Melder du på noen andre, skriver du ditt eget navn her.
          {arrangement.krev_telefon || arrangement.krev_epost
            ? " Til dette arrangementet trenger vi også å kunne nå deg."
            : " Navn er alt vi trenger."}
        </p>

        <div className={`felt${feltfeil.kontakt_navn ? " felt--feil" : ""}`}>
          <label className="felt__etikett" htmlFor="kontakt_navn">
            Navn
          </label>
          <input
            id="kontakt_navn"
            name="kontakt_navn"
            className="felt__inn"
            autoComplete="name"
            value={kontaktNavn}
            onChange={(e) => settKontaktNavn(e.target.value)}
            required
          />
          {feltfeil.kontakt_navn && <p className="felt__feil">{feltfeil.kontakt_navn}</p>}
        </div>

        {(arrangement.krev_telefon || arrangement.krev_epost) && (
          <div className="rad2">
            {arrangement.krev_telefon && (
              <div className={`felt${feltfeil.kontakt_telefon ? " felt--feil" : ""}`}>
                <label className="felt__etikett" htmlFor="kontakt_telefon">
                  Telefon
                </label>
                <input
                  id="kontakt_telefon"
                  name="kontakt_telefon"
                  type="tel"
                  inputMode="tel"
                  className="felt__inn"
                  autoComplete="tel"
                  required
                />
                {feltfeil.kontakt_telefon && (
                  <p className="felt__feil">{feltfeil.kontakt_telefon}</p>
                )}
              </div>
            )}

            {arrangement.krev_epost && (
              <div className={`felt${feltfeil.kontakt_epost ? " felt--feil" : ""}`}>
                <label className="felt__etikett" htmlFor="kontakt_epost">
                  E-post
                </label>
                <input
                  id="kontakt_epost"
                  name="kontakt_epost"
                  type="email"
                  inputMode="email"
                  className="felt__inn"
                  autoComplete="email"
                  required
                />
                <p className="felt__hjelp">Brukes hvis den ansvarlige må sende ut noe.</p>
                {feltfeil.kontakt_epost && <p className="felt__feil">{feltfeil.kontakt_epost}</p>}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bolk">
        <h3 className="bolk__tittel">Hvem skal komme?</h3>
        {arrangement.tillat_flere && (
          <p className="felt__hjelp">
            Skriv ett navn per linje. Du kan melde på hele familien, en nabo eller noen fra
            bygda som ikke bruker mobil.
          </p>
        )}

        <ul className="deltakere">
          {deltakere.map((d, i) => (
            <li key={i} className="deltaker-post">
              <div className="deltaker">
                <span className="deltaker__nr" aria-hidden="true">
                  {i + 1}
                </span>
                <input
                  name="deltaker_navn"
                  className="felt__inn"
                  aria-label={`Navn på deltaker ${i + 1}`}
                  placeholder={i === 0 ? "Fullt navn" : "Navn"}
                  value={i === 0 && !rortForste ? kontaktNavn : d.navn}
                  onChange={(e) => {
                    if (i === 0) settRortForste(true);
                    endre(i, { navn: e.target.value });
                  }}
                />
                {deltakere.length > 1 ? (
                  <button
                    type="button"
                    className="deltaker__fjern"
                    onClick={() => settDeltakere((liste) => liste.filter((_, j) => j !== i))}
                    aria-label={`Fjern deltaker ${i + 1}`}
                  >
                    ×
                  </button>
                ) : (
                  <span />
                )}
              </div>

              {arrangement.sporr_om_kost && (
                <div className="deltaker__ekstra">
                  <input
                    name="deltaker_kosthold"
                    className="felt__inn felt__inn--smal"
                    aria-label={`Allergi eller kosthold for deltaker ${i + 1}`}
                    placeholder="Allergi eller kosthold (valgfritt)"
                    value={d.kosthold}
                    onChange={(e) => endre(i, { kosthold: e.target.value })}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>

        {feltfeil.deltaker_navn && <p className="felt__feil">{feltfeil.deltaker_navn}</p>}

        {kanLeggeTil && (
          <button
            type="button"
            className="knapp knapp--stille knapp--liten"
            onClick={() =>
              settDeltakere((liste) => [...liste, { navn: "", kosthold: "" }])
            }
          >
            Legg til én til
          </button>
        )}
        {!kanLeggeTil && arrangement.tillat_flere && ledige !== null && (
          <p className="felt__hjelp">Det er {ledige} plasser igjen.</p>
        )}
      </section>

      <div className="felt">
        <label className="felt__etikett" htmlFor="melding">
          Kommentar
        </label>
        <textarea id="melding" name="melding" className="felt__inn felt__inn--omrade" />
      </div>

      <Send
        antall={
          deltakere.filter((d, i) =>
            (i === 0 && !rortForste ? kontaktNavn : d.navn).trim(),
          ).length
        }
      />
    </form>
  );
}

function Send({ antall }: { antall: number }) {
  const { pending } = useFormStatus();
  return (
    <div className="skjema__send">
      <button type="submit" className="knapp" disabled={pending}>
        {pending ? "Sender …" : antall > 1 ? `Meld på ${antall} personer` : "Meld på"}
      </button>
    </div>
  );
}

function Kvittering({
  status,
  arrangement,
}: {
  status: Extract<Skjemastatus, { steg: "kvittert" }>;
  arrangement: ArrangementMedAntall;
}) {
  return (
    <div className="notis notis--klar" role="status">
      <p className="merke">Påmeldingen er registrert</p>
      <h3 className="kvittering__tittel">
        {status.antall === 1
          ? "Vi har satt av en plass."
          : `Vi har satt av ${status.antall} plasser.`}
      </h3>
      <p>Vi ses på {arrangement.tittel.toLowerCase()}.</p>
    </div>
  );
}
