import type { Metadata } from "next";
import Link from "next/link";
import { krevAdmin, demomodus } from "@/lib/auth";
import { harBrevo } from "@/lib/brevo";
import { googlePlayLenke } from "@/lib/lenker";
import { hentTestere } from "@/lib/testere";
import { harCronNokkel, varselEpost } from "@/lib/varsling";
import { LeggTilAlle } from "@/components/LeggTilAlle";
import { dato, klokka } from "@skjold/delt";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Android-testere" };

/**
 * Runden med den lukkede testen, i tre steg: last ned fila, last den opp i
 * Play Console, trykk knappen. Siden ligger bak samme innlogging som
 * resten av admin, for det er en liste over e-postadresser til folk.
 */
export default async function Androidtestere() {
  await krevAdmin();
  const { ventende, ferdige } = await hentTestere();
  const harLenke = Boolean(googlePlayLenke());
  const varselTil = varselEpost();

  return (
    <div className="side">
      <nav className="admnav">
        <Link href="/admin" className="admnav__lenke">
          Oversikt
        </Link>
        <Link href="/app" className="admnav__lenke">
          Nedlastingssiden
        </Link>
      </nav>

      <section className="adm">
        <header className="adm__hode">
          <div>
            <p className="merke">Lukket test i Google Play</p>
            <h1 className="adm__tittel">Android-testere</h1>
          </div>
        </header>

        {!harLenke && (
          <p className="notis notis--fare" role="alert" style={{ marginTop: "1.5rem" }}>
            <strong>Ingen Play-lenke.</strong> <code>GOOGLE_PLAY_URL</code> er ikke satt på
            serveren, så det finnes ingenting å sende ut. Adressene samles opp som normalt
            i mellomtiden.
          </p>
        )}

        {!demomodus() && !harBrevo() && (
          <p className="notis notis--fare" role="alert" style={{ marginTop: "1.5rem" }}>
            <strong>E-posten kommer ikke fram.</strong> <code>BREVO_API_KEY</code> mangler,
            så utsendingen blir bare skrevet til loggen.
          </p>
        )}

        {!varselTil && (
          <p className="notis" style={{ marginTop: "1.5rem" }}>
            <strong>Ingen får beskjed om nye.</strong> <code>VARSEL_EPOST</code> er ikke satt
            på serveren, så du må se innom denne sida selv for å oppdage at noen har meldt
            seg.
          </p>
        )}

        {varselTil && !harCronNokkel() && (
          <p className="notis notis--fare" role="alert" style={{ marginTop: "1.5rem" }}>
            <strong>Beskjeden går ikke ut.</strong> <code>CRON_SECRET</code> mangler, så
            timesjobben som sender den blir avvist.
          </p>
        )}

        <div className="adm__tall">
          <p className="adm__tall-post">
            <span className="adm__verdi">{ventende.length}</span>
            <span className="merke">Venter på å bli lagt inn</span>
          </p>
          <p className="adm__tall-post">
            <span className="adm__verdi">{ferdige.length}</span>
            <span className="merke">Lagt inn og varslet</span>
          </p>
        </div>

        <section className="testere">
          <h2 className="merke">Slik gjør du det</h2>
          <ol className="framgang">
            <li>Last ned CSV-fila her.</li>
            <li>
              Last den opp i Play Console under <em>Testing → Closed testing → Testers</em>.
            </li>
            <li>
              Kom tilbake hit og trykk «Lagt til alle foreløpige e-poster». Da får alle
              lenken til appen på e-post, og lista er tom og klar for neste runde.
            </li>
          </ol>

          {varselTil && (
            <p className="felt__hjelp" style={{ marginTop: "-1rem", marginBottom: "1.75rem" }}>
              Du trenger ikke se innom: melder noen seg, kommer det en e-post til{" "}
              <strong>{varselTil}</strong> — én samlet beskjed i timen, og ingenting når det
              ikke er kommet noen.
            </p>
          )}

          {ventende.length === 0 ? (
            <p className="felt__hjelp">
              Ingen nye adresser akkurat nå. Det er ingenting å laste opp før noen melder
              seg på <Link href="/app">nedlastingssiden</Link>.
            </p>
          ) : (
            <>
              <div className="adm__handlinger">
                <a href="/api/android/csv" className="knapp knapp--stille knapp--liten" download>
                  Last ned CSV-fila
                </a>
              </div>

              <div className="rull">
                <table className="tabell">
                  <caption className="tabell__tittel">
                    Dette ligger i CSV-fila nå
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">E-post</th>
                      <th scope="col">Meldte seg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventende.map((t) => {
                      const nar = new Date(t.opprettet);
                      return (
                        <tr key={t.id}>
                          <td className="tabell__navn">{t.epost}</td>
                          <td>
                            {dato(nar)} <span className="stille">{klokka(nar)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <LeggTilAlle antall={ventende.length} />
              </div>
            </>
          )}
        </section>

        {ferdige.length > 0 && (
          <section className="adm__bolk">
            <h2 className="merke">Allerede lagt inn</h2>
            <p className="felt__hjelp">
              Disse har fått lenken og trenger ikke lastes opp på nytt.
            </p>
            <div className="rull">
              <table className="tabell">
                <caption className="skjult">Testere som allerede er lagt inn</caption>
                <thead>
                  <tr>
                    <th scope="col">E-post</th>
                    <th scope="col">Fikk lenken</th>
                  </tr>
                </thead>
                <tbody>
                  {ferdige.map((t) => {
                    const nar = new Date(t.lagt_til!);
                    return (
                      <tr key={t.id}>
                        <td className="tabell__navn">{t.epost}</td>
                        <td>
                          {dato(nar)} <span className="stille">{klokka(nar)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
