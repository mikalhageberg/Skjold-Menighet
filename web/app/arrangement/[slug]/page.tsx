import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hentArrangement, hentFrivillige } from "@/lib/data";
import { frivilligtekst, pameldingsstatus, sesongFor } from "@skjold/delt";
import { dato, klokka, nartid, tidsrom, ukedag } from "@skjold/delt";
import { Pameldingsskjema } from "@/components/Pameldingsskjema";

// Ikke statisk/ISR: siden viser hvem som har meldt seg, og det endrer seg
// fortløpende. Statisk bygging ville dessuten prøvd å lese databasen under
// selve bygget — før migreringen har rukket å opprette tabellene.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await hentArrangement(slug);
  if (!a) return { title: "Fant ikke arrangementet" };
  return {
    title: a.tittel,
    description: a.ingress ?? undefined,
    openGraph: a.bilde_generert
      ? { images: [bildeUrl(a.id, a.bilde_generert)] }
      : undefined,
  };
}

function bildeUrl(id: string, bildeGenerert: string) {
  return `/api/offentlig/bilde/${id}?v=${encodeURIComponent(bildeGenerert)}`;
}

export default async function Arrangementsside({ params }: Props) {
  const { slug } = await params;
  const a = await hentArrangement(slug);
  if (!a || !a.publisert) notFound();

  const frivillige = await hentFrivillige(a.id);
  const start = new Date(a.starter);
  const slutt = a.slutter ? new Date(a.slutter) : null;
  const s = sesongFor(start);
  const status = pameldingsstatus(a);

  return (
    <div className="side">
      <Link href="/" className="tilbake">
        ← Alt som trenger folk
      </Link>

      <article className="detalj">
        <div className="detalj__hovud">
          {a.bilde_generert && (
            <img
              src={bildeUrl(a.id, a.bilde_generert)}
              alt=""
              className="detalj__bilde"
            />
          )}

          <header className="detalj__hode" style={{ ["--f" as string]: s.farge }}>
            <span className="detalj__trad" aria-hidden="true" />
            <div>
              <p className="merke">
                {ukedag(start)} {dato(start)} · {nartid(start)}
              </p>
              <h1 className="detalj__tittel">{a.tittel}</h1>
              {a.ingress && <p className="detalj__ingress">{a.ingress}</p>}
            </div>
          </header>

          <ul className="detalj__fakta">
            <li>
              <span className="detalj__navn">Når</span>
              <span>
                {ukedag(start)} {dato(start)}, {tidsrom(start, slutt)}
              </span>
            </li>
            <li>
              <span className="detalj__navn">Hvor</span>
              <span>{a.sted}</span>
            </li>
            {a.pamelding_stenger && (
              <li>
                <span className="detalj__navn">Frist</span>
                <span>
                  {ukedag(new Date(a.pamelding_stenger))} {dato(new Date(a.pamelding_stenger))}{" "}
                  kl. {klokka(new Date(a.pamelding_stenger)).replace(":", ".")}
                </span>
              </li>
            )}
            <li>
              <span className="detalj__navn">Frivillige</span>
              <span>{frivilligtekst(a)}</span>
            </li>
            {a.ansvarlig_navn && (
              <li>
                <span className="detalj__navn">Ansvarlig</span>
                <span>
                  {a.ansvarlig_navn}
                  {a.ansvarlig_epost && (
                    <>
                      {" · "}
                      <a href={`mailto:${a.ansvarlig_epost}`}>{a.ansvarlig_epost}</a>
                    </>
                  )}
                </span>
              </li>
            )}
            <li>
              <span className="detalj__navn">I kirkeåret</span>
              <span>
                <span className="prikk" style={{ ["--f" as string]: s.farge }} aria-hidden="true" />
                {s.navn} — {s.fargenavn} parament
              </span>
            </li>
          </ul>

          <Frivilligliste frivillige={frivillige} />
        </div>

        {/* Skjemaet er et eget rutenettsbarn, så det havner over teksten på
            mobil. Den som bare skal si ja, slipper å bla gjennom hele
            beskrivelsen for å finne knappen. */}
        <aside className="kort detalj__meldpa" id="meld-pa">
          {status.apen ? (
            <>
              <h2 className="kort__tittel">Jeg kan hjelpe</h2>
              <Pameldingsskjema arrangement={a} />
            </>
          ) : (
            <Stengt grunn={status.grunn} />
          )}
        </aside>

        {a.beskrivelse && (
          <div className="detalj__tekst">
            {a.beskrivelse.split(/\n{2,}/).map((avsnitt, i) => (
              <p key={i}>{avsnitt}</p>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

/**
 * Hvem som alt har sagt ja. Den står åpent — det er lettere å melde seg
 * når man ser at naboen har gjort det, og lettere å se at det trengs én
 * til når lista er kort. Bare navn og bidrag; kontaktopplysningene ligger
 * hos den ansvarlige.
 */
function Frivilligliste({
  frivillige,
}: {
  frivillige: { navn: string; bidrag: string | null }[];
}) {
  if (frivillige.length === 0) {
    return (
      <div className="frivillige">
        <h2 className="frivillige__tittel">Hvem har meldt seg</h2>
        <p className="stille">Ingen ennå. Du kan bli den første.</p>
      </div>
    );
  }

  return (
    <div className="frivillige">
      <h2 className="frivillige__tittel">Hvem har meldt seg</h2>
      <ul className="frivillige__liste">
        {frivillige.map((f, i) => (
          <li key={i} className="frivillige__post">
            <span className="frivillige__navn">{f.navn}</span>
            {f.bidrag && <span className="frivillige__bidrag">{f.bidrag}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stengt({ grunn }: { grunn: "stengt" | "nok" | "over" }) {
  const tekst = {
    nok: {
      tittel: "Vi har folk nok",
      brod: "Alle plassene er tatt. Sjekk gjerne igjen senere — det hender noen melder avbud.",
    },
    stengt: {
      tittel: "Fristen har gått ut",
      brod: "Vil du hjelpe likevel, ta kontakt med den ansvarlige.",
    },
    over: {
      tittel: "Dette har vært",
      brod: "Se forsiden for det som trenger folk framover.",
    },
  }[grunn];

  return (
    <div>
      <h2 className="kort__tittel">{tekst.tittel}</h2>
      <p className="stille">{tekst.brod}</p>
    </div>
  );
}
