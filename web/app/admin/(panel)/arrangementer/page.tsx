import Link from "next/link";
import { hentAlle } from "@/lib/data";
import { krevAdmin } from "@/lib/auth";
import { pameldingsstatus, sesongFor } from "@skjold/delt";
import { dato, klokka, ukedag } from "@skjold/delt";
import { SlettArrangement } from "@/components/SlettArrangement";

export const dynamic = "force-dynamic";

export default async function AlleArrangementer() {
  await krevAdmin();
  const alle = await hentAlle();

  const na = Date.now();
  const kommende = alle.filter((a) => new Date(a.starter).getTime() >= na).reverse();
  const tidligere = alle.filter((a) => new Date(a.starter).getTime() < na);

  return (
    <section className="adm">
      <header className="adm__hode">
        <div>
          <p className="merke">{alle.length} arrangementer totalt</p>
          <h1 className="adm__tittel">Alle arrangementer</h1>
        </div>
        <Link href="/admin/arrangement/nytt" className="knapp knapp--liten">
          Nytt arrangement
        </Link>
      </header>

      <Liste tittel="Kommende" rader={kommende} />
      <Liste tittel="Tidligere" rader={tidligere} />
    </section>
  );
}

function Liste({
  tittel,
  rader,
}: {
  tittel: string;
  rader: Awaited<ReturnType<typeof hentAlle>>;
}) {
  if (rader.length === 0) {
    return (
      <div className="tom">
        <p className="tom__tittel">{tittel}</p>
        <p>Ingen her ennå.</p>
      </div>
    );
  }

  return (
    <div className="rull">
      <table className="tabell">
        <caption className="tabell__tittel">{tittel}</caption>
        <thead>
          <tr>
            <th scope="col">Arrangement</th>
            <th scope="col">Når</th>
            <th scope="col">Frivillige</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="skjult">Handling</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rader.map((a) => {
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
                  {a.serie_id && (
                    <span className="stille" title="Del av en serie med gjentakelser">
                      {" "}
                      · serie
                    </span>
                  )}
                </td>
                <td>
                  {ukedag(start)} {dato(start)}
                  <br />
                  <span className="stille">kl. {klokka(start).replace(":", ".")}</span>
                </td>
                <td>
                  {a.antall_frivillige}
                  {a.trengs ? ` / ${a.trengs}` : ""}
                </td>
                <td>
                  {!a.publisert ? (
                    <span className="stempel stempel--kladd">Kladd</span>
                  ) : !status.apen && status.grunn === "nok" ? (
                    <span className="stempel stempel--full">Nok folk</span>
                  ) : !status.apen && status.grunn === "stengt" ? (
                    <span className="stempel">Stengt</span>
                  ) : (
                    <span className="stempel">Åpen</span>
                  )}
                </td>
                <td>
                  <div className="tabell__handlinger">
                    <Link href={`/admin/arrangement/${a.id}`} className="tekstknapp">
                      Åpne
                    </Link>
                    <SlettArrangement
                      id={a.id}
                      tittel={a.tittel}
                      antallFrivillige={a.antall_frivillige}
                      variant="lenke"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
