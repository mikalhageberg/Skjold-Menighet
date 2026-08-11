import Link from "next/link";
import { notFound } from "next/navigation";
import { hentArrangementMedId, hentPameldinger } from "@/lib/data";
import { krevAdmin } from "@/lib/auth";
import { harBrevo } from "@/lib/brevo";
import { oppsummeringstidspunkt, pameldingsstatus, sesongFor } from "@skjold/delt";
import { dato, klokka, langDato, ukedag } from "@skjold/delt";
import { ArrangementSkjema } from "@/components/ArrangementSkjema";
import { MeldingSkjema } from "@/components/MeldingSkjema";
import { Oppsummeringstest } from "@/components/Oppsummering";
import { SlettArrangement } from "@/components/SlettArrangement";
import { MeldAv } from "@/components/MeldAv";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lagret?: string }>;
};

export default async function AdminArrangement({ params, searchParams }: Props) {
  await krevAdmin();
  const { id } = await params;
  const { lagret } = await searchParams;

  const a = await hentArrangementMedId(id);
  if (!a) notFound();

  const pameldinger = await hentPameldinger(id);
  const deltakere = pameldinger.flatMap((p) => p.deltakere);
  const kost = deltakere.filter((d) => d.kosthold);
  const medEpost = pameldinger.filter((p) => p.kontakt_epost).length;
  const start = new Date(a.starter);
  const s = sesongFor(start);
  const status = pameldingsstatus(a);

  return (
    <section className="adm">
      <header className="adm__hode">
        <div>
          <p className="merke">
            <span className="prikk" style={{ ["--f" as string]: s.farge }} aria-hidden="true" />
            {langDato(start)} · {s.navn}
          </p>
          <h1 className="adm__tittel">{a.tittel}</h1>
        </div>
        <div className="adm__handlinger">
          {a.publisert ? (
            <Link href={`/arrangement/${a.slug}`} className="knapp knapp--stille knapp--liten">
              Se siden
            </Link>
          ) : (
            <span className="stempel stempel--kladd">Kladd — ikke publisert</span>
          )}
          <a href={`/api/eksport/${a.id}`} className="knapp knapp--stille knapp--liten">
            Last ned liste
          </a>
        </div>
      </header>

      {lagret && (
        <p className="notis notis--klar" role="status" style={{ marginTop: "1.5rem" }}>
          {lagret === "ny"
            ? a.publisert
              ? "Arrangementet er opprettet og ligger nå på forsiden."
              : "Arrangementet er opprettet som kladd. Kryss av for publisering nedenfor når det er klart."
            : "Endringene er lagret."}
        </p>
      )}

      <div className="adm__tall">
        <p className="adm__tall-post">
          <span className="adm__verdi">{deltakere.length}</span>
          <span className="merke">Påmeldte{a.kapasitet ? ` av ${a.kapasitet}` : ""}</span>
        </p>
        <p className="adm__tall-post">
          <span className="adm__verdi">{pameldinger.length}</span>
          <span className="merke">Påmeldinger</span>
        </p>
        {a.sporr_om_kost && (
          <p className="adm__tall-post">
            <span className="adm__verdi">{kost.length}</span>
            <span className="merke">Med hensyn til kosthold</span>
          </p>
        )}
        {a.kapasitet && (
          <p className="adm__tall-post">
            <span className="adm__verdi" style={{ color: status.apen ? undefined : "var(--rod)" }}>
              {Math.max(0, a.kapasitet - deltakere.length)}
            </span>
            <span className="merke">Ledige plasser</span>
          </p>
        )}
      </div>

      <h2 className="adm__bolk">Påmeldte</h2>

      {pameldinger.length === 0 ? (
        <div className="tom">
          <p className="tom__tittel">Ingen har meldt seg på ennå</p>
          <p>
            {a.publisert
              ? "Arrangementet er publisert. Påmeldingene dukker opp her etter hvert."
              : "Arrangementet er ikke publisert ennå, så ingen kan se det."}
          </p>
        </div>
      ) : (
        <div className="rull">
          <table className="tabell">
            <thead>
              <tr>
                <th scope="col">Deltakere</th>
                <th scope="col">Meldt på av</th>
                <th scope="col">Kontakt</th>
                <th scope="col">Merknad</th>
                <th scope="col">
                  <span className="skjult">Handling</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pameldinger.map((p) => (
                <tr key={p.id}>
                  <td className="tabell__navn">
                    <ul className="navneliste">
                      {p.deltakere.map((d) => (
                        <li key={d.id}>
                          {d.navn}
                          {d.kosthold && <span className="stille"> · {d.kosthold}</span>}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    {p.kontakt_navn}
                    <br />
                    <span className="stille">
                      {ukedag(new Date(p.opprettet))} {dato(new Date(p.opprettet))}
                    </span>
                  </td>
                  <td>
                    {p.kontakt_telefon && (
                      <a href={`tel:${p.kontakt_telefon.replace(/\s/g, "")}`}>
                        {p.kontakt_telefon}
                      </a>
                    )}
                    {p.kontakt_telefon && p.kontakt_epost && <br />}
                    {p.kontakt_epost && (
                      <a href={`mailto:${p.kontakt_epost}`}>{p.kontakt_epost}</a>
                    )}
                  </td>
                  <td className="tabell__merknad">{p.melding ?? "—"}</td>
                  <td>
                    <MeldAv
                      pameldingId={p.id}
                      arrangementId={a.id}
                      kontaktNavn={p.kontakt_navn}
                      antall={p.deltakere.length}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="adm__bolk">Oppsummering til ansvarlig</h2>
      <div className="kort">
        <p className="stille" style={{ marginBottom: "1.25rem" }}>
          {a.oppsummering_dager_for === null ? (
            <>
              Ingen oppsummering sendes for dette arrangementet. Skru den på under
              «Oppsummering til ansvarlig» i skjemaet nedenfor.
            </>
          ) : (
            <>
              Sendes til {a.ansvarlig_navn ?? "den ansvarlige"}{" "}
              <strong>
                {langDato(oppsummeringstidspunkt(a.starter, a.oppsummering_dager_for))}
              </strong>{" "}
              — med antall påmeldte, navn, allergier og kommentarer slik de står da.
            </>
          )}
        </p>
        {!harBrevo() && (
          <p className="notis" style={{ marginBottom: "1.25rem" }}>
            Brevo er ikke koblet til ennå. Legg inn <code>BREVO_API_KEY</code> i
            miljøvariablene, så går utsendingen live.
          </p>
        )}
        <Oppsummeringstest arrangementId={a.id} ansvarligEpost={a.ansvarlig_epost} />
      </div>

      <h2 className="adm__bolk">Send melding til de påmeldte</h2>
      <div className="kort">
        {!harBrevo() && (
          <p className="notis" style={{ marginBottom: "1.5rem" }}>
            Brevo er ikke koblet til ennå. Legg inn <code>BREVO_API_KEY</code> i
            miljøvariablene, så går utsendingen live.
          </p>
        )}
        <MeldingSkjema
          arrangementId={a.id}
          antallMottakere={medEpost}
          antallPameldinger={pameldinger.length}
          tittel={a.tittel}
        />
      </div>

      <h2 className="adm__bolk">Rediger arrangementet</h2>
      <div className="kort">
        <ArrangementSkjema arrangement={a} />
      </div>

      <div className="fareombraade">
        <div>
          <h2 className="fareombraade__tittel">Slett arrangementet</h2>
          <p className="stille">
            {deltakere.length > 0
              ? `${deltakere.length} påmeldinger slettes samtidig. Last ned lista først hvis du vil beholde den.`
              : "Arrangementet fjernes for godt."}
          </p>
        </div>
        <SlettArrangement id={a.id} tittel={a.tittel} antallPameldte={deltakere.length} />
      </div>

      <p className="stille" style={{ padding: "2rem 0" }}>
        Opprettet {dato(new Date(a.opprettet))} · starter kl.{" "}
        {klokka(start).replace(":", ".")}
      </p>
    </section>
  );
}
