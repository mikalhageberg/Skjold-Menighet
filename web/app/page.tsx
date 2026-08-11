import { hentKommende } from "@/lib/data";
import { Arrangementsliste, Neste } from "@/components/Arrangementsliste";

export const revalidate = 60;

export default async function Forside() {
  const arrangementer = await hentKommende();
  const [neste, ...resten] = arrangementer;

  if (!neste) {
    return (
      <div className="side">
        <div className="tom">
          <p className="merke">Skjold kirke</p>
          <h1 className="tom__tittel">Ingenting er lagt ut ennå</h1>
          <p>
            Når menigheten legger ut kirkekaffe, formiddagstreff og middager, dukker de opp
            her. Ring menighetskontoret på 52 76 12 00 om du lurer på noe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="side forside">
      <h1 className="skjult">Arrangementer i Skjold menighet</h1>
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
