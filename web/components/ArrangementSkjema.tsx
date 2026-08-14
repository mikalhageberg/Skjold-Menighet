"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { lagreArrangementAction, type Svar } from "@/app/admin/actions";
import { BildeVelger } from "@/components/BildeVelger";
import type { Arrangement } from "@skjold/delt";
import { tilInputVerdi } from "@skjold/delt";

const START: Svar = { ok: true };

/** Splitter et `tilInputVerdi`-resultat i dato- og klokkeslettdel. */
function delTid(iso: string): [string, string] {
  const [dato, klokke] = iso ? iso.split("T") : ["", ""];
  return [dato ?? "", klokke ?? ""];
}

/** Samme utregning som lesGjentakelse i actions.ts, til forhåndsvisning. */
function antallForekomster(starterDato: string, hverUker: number, til: string): number {
  if (!starterDato || !til || !Number.isInteger(hverUker) || hverUker < 1) return 0;
  const [aar0, maned0, dag0] = starterDato.split("-").map(Number);
  const [aarT, manedT, dagT] = til.split("-").map(Number);
  const siste = new Date(aarT, manedT - 1, dagT);
  if (Number.isNaN(siste.getTime())) return 0;

  let antall = 0;
  for (let k = 0; antall < 52; k++) {
    if (new Date(aar0, maned0 - 1, dag0 + k * hverUker * 7) > siste) break;
    antall++;
  }
  return antall;
}

export function ArrangementSkjema({ arrangement }: { arrangement?: Arrangement }) {
  const [svar, send] = useActionState(lagreArrangementAction, START);
  const [tittel, settTittel] = useState(arrangement?.tittel ?? "");

  const [forhandsStarterDato, forhandsStarterKlokke] = delTid(
    tilInputVerdi(arrangement?.starter ?? null),
  );
  const [forhandsSlutterDato, forhandsSlutterKlokke] = delTid(
    tilInputVerdi(arrangement?.slutter ?? null),
  );
  const [forhandsFristDato, forhandsFristKlokke] = delTid(
    tilInputVerdi(arrangement?.pamelding_stenger ?? null),
  );
  const [starterDato, settStarterDato] = useState(forhandsStarterDato);
  const [starterKlokke, settStarterKlokke] = useState(forhandsStarterKlokke);
  const [slutterDato, settSlutterDato] = useState(forhandsSlutterDato);
  const [slutterKlokke, settSlutterKlokke] = useState(forhandsSlutterKlokke);
  const [pameldingStengerDato, settPameldingStengerDato] = useState(forhandsFristDato);
  const [pameldingStengerKlokke, settPameldingStengerKlokke] = useState(forhandsFristKlokke);

  const [gjenta, settGjenta] = useState(false);
  const [gjentaHverUker, settGjentaHverUker] = useState("1");
  const [gjentaTil, settGjentaTil] = useState("");

  // Sluttdatoen følger startdatoen automatisk — de aller fleste
  // arrangementer varer noen timer, ikke over flere dager. Har man først
  // satt en annen sluttdato selv, slutter den å følge etter.
  function endreStarterDato(ny: string) {
    const folgerEtter = slutterDato === "" || slutterDato === starterDato;
    settStarterDato(ny);
    if (folgerEtter) settSlutterDato(ny);
  }

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

        <BildeVelger
          arrangementId={arrangement?.id}
          tittel={tittel}
          eksisterendeBildeGenerert={arrangement?.bilde_generert}
        />

        <div className="felt">
          <label className="felt__etikett" htmlFor="ingress">
            Kort beskrivelse
          </label>
          <p className="felt__hjelp">
            Én eller to setninger om hva de frivillige skal gjøre. Dette står i lista på
            forsiden, og er ofte alt folk leser før de bestemmer seg.
          </p>
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
            Blank linje mellom avsnitt. Skriv gjerne hva oppgaven går ut på, når man må møte,
            og hvor lenge man må regne med å bli.
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
          <DatoKlokkeFelt
            id="starter"
            navn="starter"
            etikett="Starter"
            dato={starterDato}
            klokke={starterKlokke}
            onEndreDato={endreStarterDato}
            onEndreKlokke={settStarterKlokke}
            pakrevd
          />
          <DatoKlokkeFelt
            id="slutter"
            navn="slutter"
            etikett="Slutter"
            dato={slutterDato}
            klokke={slutterKlokke}
            onEndreDato={settSlutterDato}
            onEndreKlokke={settSlutterKlokke}
          />
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

      {!arrangement && (
        <section className="bolk">
          <h3 className="bolk__tittel">Gjentakelse</h3>

          <div className="valg__post">
            <label className="avkryss">
              <input
                type="checkbox"
                className="avkryss__boks"
                name="gjenta"
                value="på"
                checked={gjenta}
                onChange={(e) => settGjenta(e.target.checked)}
              />
              <span className="avkryss__tekst">Gjenta dette arrangementet</span>
            </label>
            <p className="felt__hjelp valg__hjelp">
              Lager flere like arrangementer på rad, med samme innhold og bilde. Hvert ett kan
              endres eller slettes for seg etterpå.
            </p>
          </div>

          {gjenta && (
            <>
              <div className="rad2">
                <div className="felt">
                  <label className="felt__etikett" htmlFor="gjenta_hver_uker">
                    Hver
                  </label>
                  <div className="gjenta__intervall">
                    <input
                      id="gjenta_hver_uker"
                      name="gjenta_hver_uker"
                      type="number"
                      min={1}
                      max={52}
                      className="felt__inn"
                      value={gjentaHverUker}
                      onChange={(e) => settGjentaHverUker(e.target.value)}
                    />
                    <span>uke(r)</span>
                  </div>
                </div>

                <div className="felt">
                  <label className="felt__etikett" htmlFor="gjenta_til">
                    Til og med
                  </label>
                  <input
                    id="gjenta_til"
                    name="gjenta_til"
                    type="date"
                    className="felt__inn"
                    value={gjentaTil}
                    onChange={(e) => settGjentaTil(e.target.value)}
                    required={gjenta}
                  />
                </div>
              </div>

              <p className="felt__hjelp">
                {(() => {
                  const antall = antallForekomster(starterDato, Number(gjentaHverUker), gjentaTil);
                  if (!gjentaTil) return "Velg en sluttdato for å se hvor mange dette lager.";
                  if (antall === 0) return "Ingen datoer å lage — sjekk sluttdatoen.";
                  return antall === 1
                    ? "Dette lager bare det ene arrangementet — sluttdatoen er før neste gang."
                    : `Dette lager ${antall} arrangementer, ett hver ${
                        Number(gjentaHverUker) === 1 ? "uke" : `${gjentaHverUker}. uke`
                      }.`;
                })()}
              </p>
            </>
          )}
        </section>
      )}

      <section className="bolk">
        <h3 className="bolk__tittel">Frivillige</h3>

        <div className="rad2">
          <div className="felt">
            <label className="felt__etikett" htmlFor="trengs">
              Hvor mange trengs?
            </label>
            <p className="felt__hjelp">
              Lista stenger av seg selv når så mange har meldt seg. La stå tomt hvis dere kan
              ta imot alle som vil.
            </p>
            <input
              id="trengs"
              name="trengs"
              type="number"
              min={1}
              className="felt__inn"
              defaultValue={arrangement?.trengs ?? ""}
            />
          </div>
          <DatoKlokkeFelt
            id="pamelding_stenger"
            navn="pamelding_stenger"
            etikett="Frist for å melde seg"
            hjelp="La stå tomt for åpen liste fram til start."
            dato={pameldingStengerDato}
            klokke={pameldingStengerKlokke}
            onEndreDato={settPameldingStengerDato}
            onEndreKlokke={settPameldingStengerKlokke}
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
            hjelp="Bruk denne når dere må kunne ringe — omrokering på kort varsel. Den enkelte får selv velge om nummeret skal vises til de andre frivillige; krysser du ikke av her, spørres det ikke om i det hele tatt."
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
          Den de frivillige skal forholde seg til. Står oppført på arrangementssiden.
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
        <h3 className="bolk__tittel">Publisering</h3>

        <Avkryss
          navn="publisert"
          merket={arrangement?.publisert ?? true}
          tekst="Vis arrangementet, og varsle om at det trengs frivillige"
          hjelp="Alle med appen får ett pushvarsel når dette publiseres første gang. Kladder er bare synlige her inne, og varsler ingen."
        />
      </section>

      <Lagre nytt={!arrangement} />
    </form>
  );
}

/**
 * Dato og klokkeslett som to felt i stedet for ett `datetime-local`-felt.
 * Den innebygde kombi-velgeren er treg å styre med mus — man må klikke inn i
 * akkurat riktig delfelt og bla med små piler. Egne, native dato- og
 * klokkeslett-felt har hver sin modne kalender-/tidsvelger i nettleseren.
 */
function DatoKlokkeFelt({
  id,
  navn,
  etikett,
  hjelp,
  dato,
  klokke,
  onEndreDato,
  onEndreKlokke,
  pakrevd,
}: {
  id: string;
  navn: string;
  etikett: string;
  hjelp?: string;
  dato: string;
  klokke: string;
  onEndreDato: (verdi: string) => void;
  onEndreKlokke: (verdi: string) => void;
  pakrevd?: boolean;
}) {
  return (
    <div className="felt">
      <label className="felt__etikett" htmlFor={`${id}-dato`}>
        {etikett}
      </label>
      {hjelp ? <p className="felt__hjelp">{hjelp}</p> : null}
      <div className="rad2">
        <input
          id={`${id}-dato`}
          type="date"
          className="felt__inn"
          value={dato}
          onChange={(e) => onEndreDato(e.target.value)}
          required={pakrevd}
        />
        <input
          id={`${id}-klokke`}
          type="time"
          className="felt__inn"
          value={klokke}
          onChange={(e) => onEndreKlokke(e.target.value)}
          required={pakrevd}
        />
      </div>
      <input type="hidden" name={navn} value={dato && klokke ? `${dato}T${klokke}` : ""} />
    </div>
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
