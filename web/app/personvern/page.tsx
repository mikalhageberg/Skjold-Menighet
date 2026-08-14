import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personvern",
  description:
    "Hva Skjold menighet lagrer om deg når du melder deg som frivillig, hvem som ser det, og hvordan du får det slettet.",
};

/** Datoen teksten sist ble endret. Oppdater den når innholdet endres. */
const SIST_ENDRET = "14. august 2026";

/**
 * Personvernerklæringen. Både App Store og Google Play krever at den ligger
 * på en offentlig adresse, og appen lenker hit fra velkomsten og fra Mine
 * vakter — Apple krever at den er tilgjengelig inne i appen også.
 *
 * Teksten beskriver det koden faktisk gjør. Endrer dere hva som lagres eller
 * deles, må den endres i samme slengen.
 */
export default function Personvern() {
  return (
    <div className="side">
      <article className="brodtekst">
        <p className="merke">Sist endret {SIST_ENDRET}</p>
        <h1 className="brodtekst__tittel">Personvern</h1>

        <p className="brodtekst__ingress">
          Denne appen er en vaktliste for frivillige i Skjold menighet. Vi lagrer så lite som
          mulig, og her står det nøyaktig hva det er.
        </p>

        <h2>Hvem er ansvarlig</h2>
        <p>
          Behandlingsansvarlig er Skjold menighet. Spørsmål om personvern, innsyn eller
          sletting rettes til Mikal Hageberg på{" "}
          <a href="mailto:mikal.hageberg@gmail.com">mikal.hageberg@gmail.com</a>.
        </p>

        <h2>Det som bare ligger på telefonen din</h2>
        <p>
          Første gang du åpner appen, skriver du navnet ditt. Telefonnummer og e-postadresse
          er frivillig. Dette blir liggende <em>på telefonen din</em> — vi får det ikke, og
          det sendes ingen steder før du selv sier ja til en oppgave. Det samme gjelder lista
          over vaktene dine.
        </p>
        <p>
          Sletter du appen, er alt dette borte. Lista over vakter rydder seg dessuten selv en
          uke etter at en oppgave har vært.
        </p>

        <h2>Det vi lagrer når du sier ja til en oppgave</h2>
        <table className="tabell tabell--tekst">
          <tbody>
            <tr>
              <th scope="row">Navn</th>
              <td>Alltid. Uten navn er en vaktliste ubrukelig.</td>
            </tr>
            <tr>
              <th scope="row">Telefonnummer</th>
              <td>
                Bare når oppgaven krever det, og da fordi den ansvarlige må kunne nå deg —
                for eksempel hvis noe flyttes på kort varsel.
              </td>
            </tr>
            <tr>
              <th scope="row">E-postadresse</th>
              <td>Bare når oppgaven krever det, og da for beskjeder i forkant.</td>
            </tr>
            <tr>
              <th scope="row">«Jeg bidrar med»</th>
              <td>Det du selv skriver der. Feltet er frivillig.</td>
            </tr>
            <tr>
              <th scope="row">Tidspunkt</th>
              <td>Når du meldte deg, og eventuelt når du meldte avbud.</td>
            </tr>
          </tbody>
        </table>
        <p>
          Behandlingsgrunnlaget er samtykket ditt: du velger selv å si ja til en oppgave, og
          kan trekke det tilbake ved å melde avbud i appen eller ta kontakt med oss.
        </p>

        <h2>Varsler</h2>
        <p>
          Sier du ja til varsler, lagrer vi en kode som identifiserer akkurat den
          app-installasjonen, og hvilken type telefon det er. Koden er ikke knyttet til navnet
          ditt. Vi bruker den til tre ting, og ikke noe annet:
        </p>
        <ul>
          <li>når det legges ut en ny oppgave som trenger folk</li>
          <li>når noen melder avbud, så det trengs en avløser</li>
          <li>dagen før en vakt du selv har sagt ja til</li>
        </ul>
        <p>
          Du kan når som helst skru av varsler i innstillingene på telefonen, og fortsatt
          bruke appen som før.
        </p>

        <h2>Hvem ser hva</h2>
        <p>
          <strong>Navnet ditt og hva du bidrar med</strong> står på oppgaven, synlig for alle
          som har adressen til den — også utenfor appen. Det er gjort med vilje: det er
          lettere å melde seg når man ser hvem andre som stiller, og lettere å se at det
          fortsatt trengs noen. Sidene er merket slik at søkemotorer ikke skal indeksere dem.
        </p>
        <p>
          <strong>Telefonnummeret ditt</strong> vises bare når alle tre stemmer samtidig:
        </p>
        <ol>
          <li>oppgaven krever telefonnummer,</li>
          <li>du har krysset av for å dele det — det er avslått med mindre du gjør det,</li>
          <li>og den som ser lista står selv oppført på den samme oppgaven.</li>
        </ol>
        <p>
          <strong>E-postadressen din</strong> deles aldri med andre frivillige. Den er bare
          synlig for de ansvarlige i menigheten.
        </p>
        <p>
          Vi selger ingenting videre, viser ingen reklame, og har verken sporing eller
          analyseverktøy i appen eller på nettsidene.
        </p>

        <h2>Andre som behandler opplysninger for oss</h2>
        <table className="tabell tabell--tekst">
          <tbody>
            <tr>
              <th scope="row">Railway</th>
              <td>Driver serveren og databasen. Serverne står i Amsterdam.</td>
            </tr>
            <tr>
              <th scope="row">Expo</th>
              <td>
                Sender varslene videre til Apple og Google. Får bare koden som identifiserer
                telefonen, og teksten i varselet. Amerikansk tjeneste.
              </td>
            </tr>
            <tr>
              <th scope="row">Brevo</th>
              <td>
                Sender e-post, og bare når en ansvarlig selv skriver og sender en melding.
                Ingen e-post går ut automatisk.
              </td>
            </tr>
            <tr>
              <th scope="row">Google</th>
              <td>
                Lager illustrasjonsbildet til en oppgave ut fra navnet på den. Ingen
                personopplysninger sendes dit.
              </td>
            </tr>
          </tbody>
        </table>

        <h2>Hvor opplysningene ligger</h2>
        <p>
          Serveren og databasen står i Amsterdam, altså innenfor EØS. Navnet ditt, og
          eventuelt nummeret eller adressen din, forlater ikke Europa.
        </p>
        <p>
          Ett unntak: selve varslene går gjennom Expo og videre til Apple og Google, som er
          amerikanske. Det som sendes den veien er koden som identifiserer telefonen din og
          teksten i varselet — ikke navnet ditt. Vil du unngå det, kan du la være å si ja til
          varsler, og bruke appen som før.
        </p>

        <h2>Hvor lenge vi lagrer det</h2>
        <p>
          Påmeldingen din blir stående så lenge oppgaven finnes, slik at menigheten vet hvem
          som stilte. Oppgaver slettes normalt ett til to døgn etter at de har vært, og da
          forsvinner lista over frivillige sammen med dem.
        </p>

        <h2>Rettighetene dine</h2>
        <p>
          Du har rett til å få vite hva vi har lagret om deg, få det rettet, få det slettet,
          og til å protestere mot behandlingen. Ta kontakt med oss, så ordner vi det.
        </p>
        <p>
          Vil du bare av en vakt, er det raskest å melde avbud i appen — da får de andre
          samtidig beskjed om at det trengs en avløser.
        </p>
        <p>
          Mener du at vi behandler opplysninger om deg på en måte som ikke er i orden, kan du
          klage til Datatilsynet.
        </p>

        <h2>Barn</h2>
        <p>
          Appen er laget for voksne frivillige. Er den frivillige under 15 år, bør en
          foresatt være med på avgjørelsen om å melde seg.
        </p>

        <h2>Endringer</h2>
        <p>
          Endrer vi hva som lagres eller deles, endrer vi denne teksten samtidig, og setter ny
          dato øverst.
        </p>
      </article>
    </div>
  );
}
