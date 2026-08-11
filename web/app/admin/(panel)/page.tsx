import Link from "next/link";
import { hentKommende } from "@/lib/data";
import { krevAdmin } from "@/lib/auth";
import { pameldingsstatus, sesongFor } from "@skjold/delt";
import { dato, nartid, ukedag } from "@skjold/delt";

export const dynamic = "force-dynamic";

export default async function AdminOversikt() {
  const admin = await krevAdmin();
  const kommende = await hentKommende();

  const totalt = kommende.reduce((sum, a) => sum + a.antall_pameldte, 0);
  const denneUka = kommende.filter(
    (a) => new Date(a.starter).getTime() < Date.now() + 7 * 86400000,
  );
  const fulle = kommende.filter((a) => {
    const s = pameldingsstatus(a);
    return !s.apen && s.grunn === "fullt";
  });

  return (
    <section className="adm">
      <header className="adm__hode">
        <div>
          <p className="merke">Innlogget som {admin.navn ?? admin.epost}</p>
          <h1 className="adm__tittel">Oversikt</h1>
        </div>
        <Link href="/admin/arrangement/nytt" className="knapp knapp--liten">
          Nytt arrangement
        </Link>
      </header>

      <div className="adm__tall">
        <p className="adm__tall-post">
          <span className="adm__verdi">{kommende.length}</span>
          <span className="merke">Kommende arrangementer</span>
        </p>
        <p className="adm__tall-post">
          <span className="adm__verdi">{totalt}</span>
          <span className="merke">Påmeldte til sammen</span>
        </p>
        <p className="adm__tall-post">
          <span className="adm__verdi">{denneUka.length}</span>
          <span className="merke">Innen sju dager</span>
        </p>
        {fulle.length > 0 && (
          <p className="adm__tall-post">
            <span className="adm__verdi" style={{ color: "var(--rod)" }}>
              {fulle.length}
            </span>
            <span className="merke">Fullbooket</span>
          </p>
        )}
      </div>

      {kommende.length === 0 ? (
        <div className="tom">
          <p className="tom__tittel">Ingenting står i kalenderen</p>
          <p>
            Legg inn det første arrangementet, så dukker det opp på forsiden med én gang du
            publiserer det.
          </p>
          <p style={{ marginTop: "1.25rem" }}>
            <Link href="/admin/arrangement/nytt" className="knapp knapp--stille knapp--liten">
              Nytt arrangement
            </Link>
          </p>
        </div>
      ) : (
        <div className="rull">
          <table className="tabell">
            <caption className="tabell__tittel">Kommende arrangementer</caption>
            <thead>
              <tr>
                <th scope="col">Arrangement</th>
                <th scope="col">Når</th>
                <th scope="col">Påmeldte</th>
                <th scope="col">Ansvarlig</th>
                <th scope="col">
                  <span className="skjult">Handling</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {kommende.map((a) => {
                const start = new Date(a.starter);
                const s = sesongFor(start);
                const status = pameldingsstatus(a);
                return (
                  <tr key={a.id}>
                    <td className="tabell__navn">
                      <span
                        className="prikk"
                        style={{ ["--f" as string]: s.farge }}
                        aria-hidden="true"
                      />
                      {a.tittel}
                    </td>
                    <td>
                      {ukedag(start)} {dato(start)}
                      <br />
                      <span className="stille">{nartid(start)}</span>
                    </td>
                    <td>
                      {a.antall_pameldte}
                      {a.kapasitet ? ` / ${a.kapasitet}` : ""}
                      {!status.apen && status.grunn === "fullt" && (
                        <>
                          {" "}
                          <span className="stempel stempel--full">Fullt</span>
                        </>
                      )}
                    </td>
                    <td>{a.ansvarlig_navn ?? "—"}</td>
                    <td>
                      <Link href={`/admin/arrangement/${a.id}`} className="tekstknapp">
                        Se påmeldte
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
