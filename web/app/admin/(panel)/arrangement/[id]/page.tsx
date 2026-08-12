import Link from "next/link";
import { notFound } from "next/navigation";
import { hentArrangementMedId, hentArrangementerISerie, hentPameldinger } from "@/lib/data";
import { krevAdmin } from "@/lib/auth";
import { harBrevo } from "@/lib/brevo";
import { pameldingsstatus, sesongFor } from "@skjold/delt";
import { dato, klokka, langDato, ukedag } from "@skjold/delt";
import { ArrangementSkjema } from "@/components/ArrangementSkjema";
import { MeldingSkjema } from "@/components/MeldingSkjema";
import { SlettArrangement } from "@/components/SlettArrangement";
import { SlettSerie } from "@/components/SlettSerie";
import { MeldAv } from "@/components/MeldAv";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lagret?: string; antall?: string }>;
};

export default async function AdminArrangement({ params, searchParams }: Props) {
  await krevAdmin();
  const { id } = await params;
  const { lagret, antall: antallParam } = await searchParams;
  const antallForekomster = Number(antallParam ?? "1");

  const a = await hentArrangementMedId(id);
  if (!a) notFound();

  const soskenISerien = a.serie_id ? await hentArrangementerISerie(a.serie_id, a.id) : [];
  const frivillige = await hentPameldinger(id);
  const medBidrag = frivillige.filter((p) => p.bidrag).length;
  const medEpost = frivillige.filter((p) => p.epost).length;
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

      {lagret === "ny" && (
        <div className="bekreftelse" role="status">
          <span className="bekreftelse__hake" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="bekreftelse__tittel">
              {antallForekomster > 1
                ? `${antallForekomster} arrangementer er opprettet`
                : "Arrangementet er opprettet"}
            </p>
            <p className="bekreftelse__tekst">
              {antallForekomster > 1
                ? a.publisert
                  ? "Dette er det første — du ser de andre i serien lenger ned."
                  : "Dette er det første, lagret som kladd — kryss av for publisering nedenfor når de er klare."
                : a.publisert
                  ? "Det ligger nå på forsiden."
                  : "Det er lagret som kladd — kryss av for publisering nedenfor når det er klart."}
            </p>
          </div>
        </div>
      )}

      {lagret === "endret" && (
        <p className="notis notis--klar" role="status" style={{ marginTop: "1.5rem" }}>
          Endringene er lagret.
        </p>
      )}

      {a.serie_id && (
        <div className="serie-boks">
          <p className="serie-boks__tittel">
            Del av en serie på {soskenISerien.length + 1} arrangementer
          </p>
          {soskenISerien.length > 0 && (
            <ul className="serie-boks__liste">
              {soskenISerien.map((s) => (
                <li key={s.id}>
                  <Link href={`/admin/arrangement/${s.id}`}>
                    {ukedag(new Date(s.starter))} {dato(new Date(s.starter))}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <SlettSerie
            serieId={a.serie_id}
            antall={soskenISerien.length + 1}
            tittel={a.tittel}
          />
        </div>
      )}

      <div className="adm__tall">
        <p className="adm__tall-post">
          <span className="adm__verdi">{frivillige.length}</span>
          <span className="merke">Frivillige{a.trengs ? ` av ${a.trengs}` : ""}</span>
        </p>
        {a.trengs && (
          <p className="adm__tall-post">
            <span className="adm__verdi" style={{ color: status.apen ? "var(--rod)" : undefined }}>
              {Math.max(0, a.trengs - frivillige.length)}
            </span>
            <span className="merke">Mangler ennå</span>
          </p>
        )}
        <p className="adm__tall-post">
          <span className="adm__verdi">{medBidrag}</span>
          <span className="merke">Har skrevet hva de bidrar med</span>
        </p>
      </div>

      <h2 className="adm__bolk">Frivillige</h2>

      {frivillige.length === 0 ? (
        <div className="tom">
          <p className="tom__tittel">Ingen har meldt seg ennå</p>
          <p>
            {a.publisert
              ? "Alle med appen har fått beskjed om at det trengs folk. De som melder seg dukker opp her."
              : "Arrangementet er ikke publisert ennå, så ingen har fått beskjed om det."}
          </p>
        </div>
      ) : (
        <div className="rull">
          <table className="tabell">
            <thead>
              <tr>
                <th scope="col">Navn</th>
                <th scope="col">Bidrar med</th>
                <th scope="col">Kontakt</th>
                <th scope="col">Meldte seg</th>
                <th scope="col">
                  <span className="skjult">Handling</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {frivillige.map((p) => (
                <tr key={p.id}>
                  <td className="tabell__navn">{p.navn}</td>
                  <td className="tabell__merknad">{p.bidrag ?? "—"}</td>
                  <td>
                    {p.telefon && (
                      <a href={`tel:${p.telefon.replace(/\s/g, "")}`}>{p.telefon}</a>
                    )}
                    {p.telefon && p.epost && <br />}
                    {p.epost && <a href={`mailto:${p.epost}`}>{p.epost}</a>}
                    {!p.telefon && !p.epost && <span className="stille">—</span>}
                  </td>
                  <td>
                    <span className="stille">
                      {ukedag(new Date(p.opprettet))} {dato(new Date(p.opprettet))}
                    </span>
                  </td>
                  <td>
                    <MeldAv pameldingId={p.id} arrangementId={a.id} navn={p.navn} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="adm__bolk">Send melding til de frivillige</h2>
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
          antallFrivillige={frivillige.length}
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
            {frivillige.length > 0
              ? `${frivillige.length} frivillige mister vakten, uten å få beskjed. Last ned lista først hvis du vil beholde den.`
              : "Arrangementet fjernes for godt."}
          </p>
        </div>
        <SlettArrangement id={a.id} tittel={a.tittel} antallFrivillige={frivillige.length} />
      </div>

      <p className="stille" style={{ padding: "2rem 0" }}>
        Opprettet {dato(new Date(a.opprettet))} · starter kl.{" "}
        {klokka(start).replace(":", ".")}
      </p>
    </section>
  );
}
