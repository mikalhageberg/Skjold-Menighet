import { hentKommende } from "@/lib/data";
import { Arrangementsliste, Neste } from "@/components/Arrangementsliste";

// Ikke statisk/ISR: forsiden viser hvor mange frivillige som mangler, og det
// endrer seg fortløpende. Statisk bygging ville dessuten prøvd å lese
// databasen under selve bygget — før migreringen har opprettet tabellene.
export const dynamic = "force-dynamic";

export default async function Forside() {
  const arrangementer = await hentKommende();
  const [neste, ...resten] = arrangementer;

  if (!neste) {
    return (
      <div className="side">
        <div className="tom">
          <p className="merke">Skjold kirke</p>
          <h1 className="tom__tittel">Ingenting trenger folk akkurat nå</h1>
          <p>
            Når menigheten trenger frivillige til kirkekaffe, formiddagstreff eller
            middager, dukker det opp her.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="side forside">
      <h1 className="skjult">Dette trenger frivillige i Skjold menighet</h1>
      <Neste arrangement={neste} />

      {resten.length > 0 && (
        <section aria-labelledby="senere">
          <h2 id="senere" className="skjult">
            Senere
          </h2>
          <Arrangementsliste arrangementer={resten} />
        </section>
      )}
    </div>
  );
}
