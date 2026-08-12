import Link from "next/link";
import {
  dag,
  klokka,
  maned,
  frivilligtekst,
  pameldingsstatus,
  sesongFor,
  tidsrom,
  ukedag,
  type ArrangementMedAntall,
} from "@skjold/delt";

/**
 * Én oppgave er ett kort. Kanten til venstre har den liturgiske fargen
 * for tiden i kirkeåret arrangementet faller i — grønn i treenighetstiden,
 * fiolett i advent og faste. Det er eneste stedet farge brukes, så lista
 * blir rolig samtidig som året merkes. Samme oppsett som i appen.
 */
export function Arrangementsliste({
  arrangementer,
}: {
  arrangementer: ArrangementMedAntall[];
}) {
  let forrigeManed = "";

  return (
    <div className="liste">
      {arrangementer.map((a) => {
        const start = new Date(a.starter);
        const denne = maned(start);
        const nyManed = denne !== forrigeManed;
        forrigeManed = denne;

        return (
          <div key={a.id} className="liste__post">
            {nyManed && <p className="liste__maned merke">{denne}</p>}
            <Arrangementskort arrangement={a} />
          </div>
        );
      })}
    </div>
  );
}

export function Arrangementskort({
  arrangement,
  stort,
}: {
  arrangement: ArrangementMedAntall;
  stort?: boolean;
}) {
  const start = new Date(arrangement.starter);
  const s = sesongFor(start);
  const status = pameldingsstatus(arrangement);
  // Rødt bare når noe nært i tid fortsatt mangler folk — det er da et
  // manglende navn faktisk er et problem noen må gjøre noe med.
  const haster =
    status.apen &&
    status.mangler !== null &&
    new Date(arrangement.starter).getTime() < Date.now() + 7 * 86400000;

  return (
    <article
      className={`kort kort--arrangement${stort ? " kort--stort" : ""}`}
      style={{ ["--f" as string]: s.farge }}
    >
      <div className="kort__kant" aria-hidden="true" />

      <div className="kort__innhold">
        {arrangement.bilde_generert && (
          <img
            src={`/api/offentlig/bilde/${arrangement.id}?v=${encodeURIComponent(arrangement.bilde_generert)}`}
            alt=""
            className="kort__bilde"
          />
        )}

        <div className="kort__topp">
          <p className="kort__dato">
            <span className="kort__dag">{dag(start)}</span>
            <span className="kort__ukedag">{ukedag(start).slice(0, 3)}</span>
          </p>

          <div className="kort__tittelfelt">
            <h3 className="kort__tittel">
              <Link href={`/arrangement/${arrangement.slug}`} className="kort__lenke">
                {arrangement.tittel}
              </Link>
            </h3>
            <p className="kort__meta">
              {tidsrom(start, arrangement.slutter ? new Date(arrangement.slutter) : null)} ·{" "}
              {arrangement.sted}
            </p>
          </div>
        </div>

        {arrangement.ingress && <p className="kort__ingress">{arrangement.ingress}</p>}

        <div className="kort__bunn">
          <p className={`kort__dekning${haster ? " kort__dekning--haster" : ""}`}>
            {frivilligtekst(arrangement)}
          </p>
          <Handling arrangement={arrangement} stort={stort} />
        </div>
      </div>
    </article>
  );
}

function Handling({
  arrangement,
  stort,
}: {
  arrangement: ArrangementMedAntall;
  stort?: boolean;
}) {
  const status = pameldingsstatus(arrangement);
  const url = `/arrangement/${arrangement.slug}`;

  if (status.apen) {
    return (
      <Link href={url} className={`knapp knapp--liten${stort ? "" : " knapp--stille"}`}>
        Jeg kan hjelpe
      </Link>
    );
  }

  return (
    <Link href={url} className="tekstknapp">
      {status.grunn === "nok" ? "Dekket" : "Les mer"}
    </Link>
  );
}

/** Den nærmeste oppgaven, i et kort som får litt mer plass enn de andre. */
export function Neste({ arrangement }: { arrangement: ArrangementMedAntall }) {
  const start = new Date(arrangement.starter);

  return (
    <section className="neste">
      <p className="merke">
        Først ut · {ukedag(start)} kl. {klokka(start).replace(":", ".")}
      </p>
      <Arrangementskort arrangement={arrangement} stort />
    </section>
  );
}
