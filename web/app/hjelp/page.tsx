import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hjelp",
  description:
    "Svar på det folk lurer på i frivilligappen til Skjold menighet — hvordan du melder deg, melder avbud, og hvem du kontakter.",
};

/**
 * Støttesiden App Store og Google Play krever en adresse til.
 *
 * Den skal faktisk hjelpe noen. Apple sjekker at adressen virker og at det
 * står noe der — en forside med arrangementer er ikke støtte. Spørsmålene
 * her er de vi vet folk lurer på: hvordan man kommer seg av en vakt, og
 * hvorfor appen spør om telefonnummeret.
 */
export default function Hjelp() {
  return (
    <div className="side">
      <article className="brodtekst">
        <p className="merke">Skjold menighet</p>
        <h1 className="brodtekst__tittel">Hjelp</h1>

        <p className="brodtekst__ingress">
          Appen er en vaktliste for frivillige. Her er svar på det folk pleier å lure på. Får
          du det ikke til, ring eller skriv — det er ingen skam i det.
        </p>

        <h2>Ta kontakt</h2>
        <p>
          Mikal Hageberg,{" "}
          <a href="mailto:mikal.hageberg@gmail.com">mikal.hageberg@gmail.com</a>. Skriv gjerne
          hva slags telefon du har, og hva som skjedde — det gjør det mye lettere å hjelpe.
        </p>

        <h2>Hvordan melder jeg meg på noe?</h2>
        <p>
          Åpne oppgaven under <strong>Vi trenger deg</strong> og trykk «Jeg kan hjelpe». Navnet
          ditt er allerede utfylt, så som regel er det ett trykk. Feltet «Jeg bidrar med» er
          frivillig, men til god hjelp — skriver du «tar med to kaker», slipper dere å bli tre
          om det samme.
        </p>

        <h2>Jeg kan likevel ikke — hva gjør jeg?</h2>
        <p>
          Gå til <strong>Mine vakter</strong> og trykk «Meld avbud». Da får de andre som har
          appen beskjed om at det trengs en avløser, så du slipper å ringe rundt selv. Gjør det
          gjerne så tidlig du kan; da er det lettere for noen andre å steppe inn.
        </p>

        <h2>Hvorfor spør appen om telefonnummeret mitt?</h2>
        <p>
          Bare når en oppgave krever det, og da fordi den ansvarlige må kunne nå deg hvis noe
          endrer seg på kort varsel. Nummeret vises ikke til andre med mindre du selv krysser
          av for det — og da bare til dem som står på den samme lista.
        </p>

        <h2>Jeg får for mange varsler</h2>
        <p>
          Appen sender tre slag: når det legges ut noe nytt som trenger folk, når noen melder
          avbud, og dagen før en vakt du har sagt ja til. Vil du ha dem bort, skrur du av
          varsler for Skjold menighet under Innstillinger på telefonen. Appen virker som før.
        </p>

        <h2>Jeg vil at dere sletter opplysningene mine</h2>
        <p>
          Send en e-post, så ordner vi det. Du kan lese hva vi lagrer, og hvor lenge, i{" "}
          <Link href="/personvern">personvernerklæringen</Link>.
        </p>

        <h2>Må jeg ha appen?</h2>
        <p>
          Nei. Alt går like godt fra nettsiden — du finner oppgavene på{" "}
          <Link href="/">forsiden</Link> og kan melde deg der. Det du går glipp av uten appen,
          er varslene: beskjed når det trengs folk, og påminnelsen dagen før.
        </p>
      </article>
    </div>
  );
}
