"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { lagreArrangementAction, type Svar } from "@/app/admin/actions";
import type { Arrangement } from "@skjold/delt";
import { OPPSUMMERINGSVALG, tilInputVerdi } from "@skjold/delt";

const START: Svar = { ok: true };

export function ArrangementSkjema({ arrangement }: { arrangement?: Arrangement }) {
  const [svar, send] = useActionState(lagreArrangementAction, START);
  const [tittel, settTittel] = useState(arrangement?.tittel ?? "");

  return (
    <form action={send} className="skjema">
      {arrangement && <input type="hidden" name="id" value={arrangement.id} />}

      {!svar.ok && svar.melding && (
        <p className="notis notis--fare" role="alert">
          {svar.melding}
        </p>
      )}

      <section className="bolk">
        <h3 className="bolk__tittel">Hva skjer</h3>

        <div className="felt">
          <label className="felt__etikett" htmlFor="tittel">
            Navn på arrangementet
          </label>
          <input
            id="tittel"
            name="tittel"
            className="felt__inn"
            value={tittel}
            onChange={(e) => settTittel(e.target.value)}
            required
          />
        </div>

        <div className="felt">
          <label className="felt__etikett" htmlFor="ingress">
            Kort beskrivelse
          </label>
          <p className="felt__hjelp">Én eller to setninger. Dette står i lista på forsiden.</p>
          <input
            id="ingress"
            name="ingress"
            className="felt__inn"
            defaultValue={arrangement?.ingress ?? ""}
            maxLength={180}
          />
        </div>

        <div className="felt">
          <label className="felt__etikett" htmlFor="beskrivelse">
            Full tekst
          </label>
          <p className="felt__hjelp">
            Blank linje mellom avsnitt. Skriv gjerne hva som serveres og hvor lenge det varer.
          </p>
          <textarea
            id="beskrivelse"
            name="beskrivelse"
            className="felt__inn felt__inn--omrade"
            defaultValue={arrangement?.beskrivelse ?? ""}
            rows={8}
          />
        </div>
      </section>

      <section className="bolk">
        <h3 className="bolk__tittel">Når og hvor</h3>

        <div className="rad2">
          <div className="felt">
            <label className="felt__etikett" htmlFor="starter">
              Starter
            </label>
            <input
              id="starter"
              name="starter"
              type="datetime-local"
              className="felt__inn"
              defaultValue={tilInputVerdi(arrangement?.starter ?? null)}
              required
            />
          </div>
          <div className="felt">
            <label className="felt__etikett" htmlFor="slutter">
              Slutter
            </label>
            <input
              id="slutter"
              name="slutter"
              type="datetime-local"
              className="felt__inn"
              defaultValue={tilInputVerdi(arrangement?.slutter ?? null)}
            />
          </div>
        </div>

        <div className="felt">
          <label className="felt__etikett" htmlFor="sted">
            Sted
          </label>
          <input
            id="sted"
            name="sted"
            className="felt__inn"
            defaultValue={arrangement?.sted ?? "Skjold kirke"}
          />
        </div>
      </section>

      <section className="bolk">
        <h3 className="bolk__tittel">Påmelding</h3>

        <div className="rad2">
          <div className="felt">
            <label className="felt__etikett" htmlFor="kapasitet">
              Antall plasser
            </label>
            <p className="felt__hjelp">La stå tomt hvis det ikke er noen grense.</p>
            <input
              id="kapasitet"
              name="kapasitet"
              type="number"
              min={1}
              className="felt__inn"
              defaultValue={arrangement?.kapasitet ?? ""}
            />
          </div>
          <div className="felt">
            <label className="felt__etikett" htmlFor="pamelding_stenger">
              Påmeldingsfrist
            </label>
            <p className="felt__hjelp">La stå tomt for åpen påmelding fram til start.</p>
            <input
              id="pamelding_stenger"
              name="pamelding_stenger"
              type="datetime-local"
              className="felt__inn"
              defaultValue={tilInputVerdi(arrangement?.pamelding_stenger ?? null)}
            />
          </div>
        </div>

        <div className="valg">
          <Avkryss
            navn="tillat_flere"
            merket={arrangement?.tillat_flere ?? true}
            tekst="Man kan melde på flere personer"
            hjelp="Skru av for kurs og grupper der hver plass må bookes enkeltvis."
          />
          <Avkryss
            navn="sporr_om_kost"
            merket={arrangement?.sporr_om_kost ?? false}
            tekst="Spør om allergi og kosthold"
            hjelp="Bruk denne når det serveres mat."
          />
        </div>

        <div className="valg">
          <p className="felt__etikett">Kontaktopplysninger</p>
          <p className="felt__hjelp valg__innledning">
            Navn holder til vanlig. Krev bare mer når dere faktisk trenger å nå folk —
            hvert felt til er en terskel for dem som synes mobil er vanskelig.
          </p>
          <Avkryss
            navn="krev_telefon"
            merket={arrangement?.krev_telefon ?? false}
            tekst="Krev telefonnummer"
            hjelp="Bruk denne når dere må kunne ringe — henting, avlysning på kort varsel."
          />
          <Avkryss
            navn="krev_epost"
            merket={arrangement?.krev_epost ?? false}
            tekst="Krev e-postadresse"
            hjelp="Bruk denne når dere skal sende ut informasjon i forkant."
          />
        </div>
      </section>

      <section className="bolk">
        <h3 className="bolk__tittel">Ansvarlig</h3>
        <p className="felt__hjelp">
          Står oppført på arrangementssiden, og får oppsummeringen før arrangementet.
        </p>

        <div className="rad2">
          <div className="felt">
            <label className="felt__etikett" htmlFor="ansvarlig_navn">
              Navn
            </label>
            <input
              id="ansvarlig_navn"
              name="ansvarlig_navn"
              className="felt__inn"
              defaultValue={arrangement?.ansvarlig_navn ?? ""}
            />
          </div>
          <div className="felt">
            <label className="felt__etikett" htmlFor="ansvarlig_epost">
              E-post
            </label>
            <input
              id="ansvarlig_epost"
              name="ansvarlig_epost"
              type="email"
              className="felt__inn"
              defaultValue={arrangement?.ansvarlig_epost ?? ""}
            />
          </div>
        </div>
      </section>

      <section className="bolk">
        <h3 className="bolk__tittel">Oppsummering til ansvarlig</h3>
        <p className="felt__hjelp valg__innledning">
          Én e-post med antall påmeldte, navn, allergier og kommentarer — i stedet for én
          melding hver gang noen melder seg på. Den sendes kl. 08 den dagen du velger.
        </p>

        <div className="felt">
          <label className="felt__etikett" htmlFor="oppsummering_dager_for">
            Når skal den sendes?
          </label>
          <select
            id="oppsummering_dager_for"
            name="oppsummering_dager_for"
            className="felt__inn"
            defaultValue={
              arrangement?.oppsummering_dager_for === null
                ? "av"
                : String(arrangement?.oppsummering_dager_for ?? 1)
            }
          >
            {OPPSUMMERINGSVALG.map((v) => (
              <option key={v.verdi} value={String(v.verdi)}>
                {v.tekst}
              </option>
            ))}
            <option value="av">Ikke send oppsummering</option>
          </select>
        </div>
      </section>

      <section className="bolk">
        <h3 className="bolk__tittel">Publisering</h3>

        <Avkryss
          navn="publisert"
          merket={arrangement?.publisert ?? false}
          tekst="Vis arrangementet på forsiden"
          hjelp="Kladder er bare synlige her inne."
        />

      </section>

      <Lagre nytt={!arrangement} />
    </form>
  );
}

function Avkryss({
  navn,
  merket,
  tekst,
  hjelp,
}: {
  navn: string;
  merket: boolean;
  tekst: string;
  hjelp: string;
}) {
  return (
    <div className="valg__post">
      <label className="avkryss">
        <input
          type="checkbox"
          className="avkryss__boks"
          name={navn}
          value="på"
          defaultChecked={merket}
        />
        <span className="avkryss__tekst">{tekst}</span>
      </label>
      <p className="felt__hjelp valg__hjelp">{hjelp}</p>
    </div>
  );
}

function Lagre({ nytt }: { nytt: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="skjema__send">
      <button type="submit" className="knapp" disabled={pending}>
        {pending ? "Lagrer …" : nytt ? "Opprett arrangement" : "Lagre endringer"}
      </button>
    </div>
  );
}
