import type { Metadata } from "next";
import { appStoreLenke } from "@/lib/lenker";
import { Nedlasting } from "@/components/Nedlasting";

// Butikklenkene er miljøvariabler på Railway, og skal kunne byttes ved å
// endre variabelen og starte på nytt — ikke ved å bygge appen om igjen.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Last ned appen",
  description:
    "Appen fra Skjold menighet viser hva vi trenger hjelp til, og sier fra når det kommer noe nytt.",
};

/**
 * Siden vi deler i menighetsbladet og på kirkebakken: én skjerm, to
 * knapper, ingenting å bla i. Laget for en telefon holdt i én hånd.
 */
export default function LastNedApp() {
  return (
    <div className="side nedlastside">
      <p className="merke">Skjold menighet</p>
      <h1 className="nedlastside__tittel">Appen på telefonen</h1>
      <p className="nedlastside__ingress">
        Se hva menigheten trenger hjelp til, meld deg på det som passer, og få en
        påminnelse dagen før. Velg telefonen du har.
      </p>

      <Nedlasting appStore={appStoreLenke()} />
    </div>
  );
}
