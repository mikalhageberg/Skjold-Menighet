import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hentArrangement } from "@/lib/data";
import { pameldingsstatus, sesongFor } from "@skjold/delt";
import { dato, klokka, nartid, plasstekst, tidsrom, ukedag } from "@skjold/delt";
import { Pameldingsskjema } from "@/components/Pameldingsskjema";

export const revalidate = 30;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await hentArrangement(slug);
  if (!a) return { title: "Fant ikke arrangementet" };
  return { title: a.tittel, description: a.ingress ?? undefined };
}

export default async function Arrangementsside({ params }: Props) {
  const { slug } = await params;
  const a = await hentArrangement(slug);
  if (!a || !a.publisert) notFound();

  const start = new Date(a.starter);
  const slutt = a.slutter ? new Date(a.slutter) : null;
  const s = sesongFor(start);
  const status = pameldingsstatus(a);

  return (
    <div className="side">
      <Link href="/" className="tilbake">
        ← Alt som skjer
      </Link>

      <article className="detalj">
        <div className="detalj__hovud">
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
                <span className="detalj__navn">Påmeldingsfrist</span>
                <span>
                  {ukedag(new Date(a.pamelding_stenger))} {dato(new Date(a.pamelding_stenger))}{" "}
                  kl. {klokka(new Date(a.pamelding_stenger)).replace(":", ".")}
                </span>
              </li>
            )}
            <li>
              <span className="detalj__navn">Plasser</span>
              <span>{plasstekst(a)}</span>
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

        </div>

        {/* Skjemaet er et eget rutenettsbarn, så det havner over teksten på
            mobil. Den som bare skal si ja, slipper å bla gjennom hele
            beskrivelsen for å finne knappen. */}
        <aside className="kort detalj__meldpa" id="meld-pa">
          {status.apen ? (
            <>
              <h2 className="kort__tittel">Meld på</h2>
              <Pameldingsskjema arrangement={a} ledige={status.ledige} />
            </>
          ) : (
            <Stengt grunn={status.grunn} arrangement={a} />
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

function Stengt({
  grunn,
  arrangement,
}: {
  grunn: "stengt" | "fullt" | "over";
  arrangement: { ansvarlig_navn: string | null };
}) {
  const tekst = {
    fullt: {
      tittel: "Det er fullt",
      brod: "Alle plassene er tatt. Ring menighetskontoret på 52 76 12 00 — vi setter deg på venteliste og gir beskjed hvis noen melder avbud.",
    },
    stengt: {
      tittel: "Påmeldingen er stengt",
      brod: `Fristen har gått ut, men det er ofte plass likevel. Ta kontakt med ${
        arrangement.ansvarlig_navn ?? "menighetskontoret"
      } på 52 76 12 00.`,
    },
    over: {
      tittel: "Dette har vært",
      brod: "Arrangementet er over. Se forsiden for det som kommer.",
    },
  }[grunn];

  return (
    <div>
      <h2 className="kort__tittel">{tekst.tittel}</h2>
      <p className="stille">{tekst.brod}</p>
    </div>
  );
}
