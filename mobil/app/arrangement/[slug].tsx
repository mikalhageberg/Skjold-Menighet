import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  dag,
  dato,
  klokka,
  maned,
  nartid,
  pameldingsstatus,
  plasstekst,
  sesongFor,
  tidsrom,
  ukedag,
  VANLIGE_ALLERGIER,
  type ArrangementMedAntall,
} from "@skjold/delt";
import { hentArrangement, meldPa } from "@/lib/api";
import { husk, erPameldt } from "@/lib/lager";
import { hentProfil, lagreProfil } from "@/lib/profil";
import { hentPushToken } from "@/lib/varsler";
import { leggIKalender } from "@/lib/kalender";
import { Avkryss, Felt, Knapp, Notis, Tekst } from "@/design/Grunnelementer";
import { farge, radius, rom, TREFF } from "@/design/tema";

type Deltaker = { navn: string; allergier: string[]; annet: string };

/** Slår sammen avkryssede allergier og fritekst til én streng for serveren. */
function kostholdTekst(d: Deltaker): string | null {
  const tekst = [...d.allergier, d.annet.trim()].filter(Boolean).join(", ");
  return tekst || null;
}

export default function Arrangementsside() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [arrangement, settArrangement] = useState<ArrangementMedAntall | null>(null);
  const [lastefeil, settLastefeil] = useState<string | null>(null);
  const [alleredePameldt, settAlleredePameldt] = useState(false);

  const last = useCallback(async () => {
    try {
      const [a, pameldt] = await Promise.all([hentArrangement(slug), erPameldt(slug)]);
      settArrangement(a);
      settAlleredePameldt(pameldt);
      settLastefeil(null);
    } catch (f) {
      settLastefeil(f instanceof Error ? f.message : "Noe gikk galt.");
    }
  }, [slug]);

  useEffect(() => {
    last();
  }, [last]);

  if (lastefeil) {
    return (
      <View style={stil.midt}>
        <Notis tone="fare">
          <Tekst halvfet>Fikk ikke hentet arrangementet</Tekst>
          <Tekst variant="liten" farget="myk">
            {lastefeil}
          </Tekst>
          <View style={{ marginTop: rom.s }}>
            <Knapp tittel="Prøv igjen" variant="stille" onPress={last} />
          </View>
        </Notis>
      </View>
    );
  }

  if (!arrangement) {
    return (
      <View style={stil.midt}>
        <ActivityIndicator color={farge.granMyk} />
      </View>
    );
  }

  const start = new Date(arrangement.starter);
  const sesong = sesongFor(start);
  const status = pameldingsstatus(arrangement);

  return (
    <>
      <Stack.Screen options={{ title: arrangement.tittel }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={96}
      >
        <ScrollView contentContainerStyle={stil.innhold} keyboardShouldPersistTaps="handled">
          <View style={stil.hode}>
            <View style={[stil.hodekant, { backgroundColor: sesong.farge }]} />
            <View style={{ flex: 1, gap: rom.s }}>
              <Tekst variant="etikett" farget="myk">
                {ukedag(start)} {dato(start)} · {nartid(start)}
              </Tekst>
              <Tekst variant="stor" halvfet>
                {arrangement.tittel}
              </Tekst>
              {arrangement.ingress ? <Tekst farget="myk">{arrangement.ingress}</Tekst> : null}
            </View>
          </View>

          <View style={stil.fakta}>
            <Fakta navn="Når">
              {ukedag(start)} {dag(start)}. {maned(start).split(" ")[0]},{" "}
              {tidsrom(start, arrangement.slutter ? new Date(arrangement.slutter) : null)}
            </Fakta>
            <Fakta navn="Hvor">{arrangement.sted}</Fakta>
            {arrangement.pamelding_stenger ? (
              <Fakta navn="Frist">
                {ukedag(new Date(arrangement.pamelding_stenger))}{" "}
                {dato(new Date(arrangement.pamelding_stenger))} kl.{" "}
                {klokka(new Date(arrangement.pamelding_stenger)).replace(":", ".")}
              </Fakta>
            ) : null}
            <Fakta navn="Plasser">{plasstekst(arrangement)}</Fakta>
            {arrangement.ansvarlig_navn ? (
              <Fakta navn="Ansvarlig">{arrangement.ansvarlig_navn}</Fakta>
            ) : null}
            <Fakta navn="I kirkeåret" prikk={sesong.farge}>
              {sesong.navn} — {sesong.fargenavn} parament
            </Fakta>
          </View>

          {/* Påmeldingen står over beskrivelsen. Den som bare skal si ja,
              skal slippe å bla gjennom hele teksten for å finne knappen. */}
          {status.apen ? (
            <Skjema
              arrangement={arrangement}
              ledige={status.ledige}
              alleredePameldt={alleredePameldt}
              onPameldt={last}
            />
          ) : (
            <Stengt grunn={status.grunn} />
          )}

          {arrangement.beskrivelse ? (
            <>
              <View style={stil.skille} />
              {arrangement.beskrivelse.split(/\n{2,}/).map((avsnitt, i) => (
                <Tekst key={i}>{avsnitt}</Tekst>
              ))}
            </>
          ) : null}

          <Kalenderknapp arrangement={arrangement} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

/* ── Fakta ───────────────────────────────────────────────────────────── */

function Fakta({
  navn,
  children,
  prikk,
}: {
  navn: string;
  children: React.ReactNode;
  prikk?: string;
}) {
  return (
    <View style={stil.faktarad}>
      <Tekst variant="liten" farget="myk" style={stil.faktanavn}>
        {navn}
      </Tekst>
      <View style={stil.faktaverdi}>
        {prikk ? <View style={[stil.prikk, { backgroundColor: prikk }]} /> : null}
        <Tekst variant="liten" style={{ flex: 1 }}>
          {children}
        </Tekst>
      </View>
    </View>
  );
}

/* ── Legg i kalenderen ───────────────────────────────────────────────── */

function Kalenderknapp({ arrangement }: { arrangement: ArrangementMedAntall }) {
  const [beskjed, settBeskjed] = useState<string | null>(null);

  async function leggTil() {
    const resultat = await leggIKalender(arrangement);
    settBeskjed(
      resultat.ok
        ? "Lagt i kalenderen, med påminnelse dagen før."
        : resultat.grunn === "nektet"
          ? "Appen har ikke tilgang til kalenderen. Du kan gi tilgang under Innstillinger."
          : resultat.grunn === "ingen-kalender"
            ? "Fant ingen kalender å skrive til på denne telefonen."
            : "Fikk ikke lagt det i kalenderen. Prøv igjen.",
    );
  }

  return (
    <View style={{ gap: rom.s, alignItems: "flex-start" }}>
      <Knapp tittel="Legg i kalenderen" variant="stille" onPress={leggTil} />
      {beskjed ? (
        <Tekst variant="liten" farget="myk" accessibilityLiveRegion="polite">
          {beskjed}
        </Tekst>
      ) : null}
    </View>
  );
}

/* ── Bekreftelse ─────────────────────────────────────────────────────── */

/**
 * Kvitteringen etter påmelding. Haken tegnes med en fjærende skalering, så
 * det er tydelig at trykket faktisk ble til noe — viktig når man ikke får
 * en app-varsling eller e-post å lene seg på.
 */
function Bekreftelse({
  kvittert,
  vilHaPaaminnelse,
  children,
}: {
  kvittert: number;
  vilHaPaaminnelse: boolean;
  children: React.ReactNode;
}) {
  const hakeskala = useRef(new Animated.Value(0)).current;
  const innhold = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(hakeskala, {
        toValue: 1,
        friction: 5,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(innhold, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hakeskala, innhold]);

  return (
    <Notis tone="klar">
      <View style={stil.hakesirkel}>
        <Animated.View style={{ transform: [{ scale: hakeskala }] }}>
          <View style={stil.hakestrek} />
        </Animated.View>
      </View>

      <Animated.View
        style={{
          gap: rom.s,
          opacity: innhold,
          transform: [
            { translateY: innhold.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        }}
      >
        <Tekst variant="etikett" farget="myk" style={{ textAlign: "center" }}>
          Påmeldingen er registrert
        </Tekst>
        <Tekst variant="mellom" halvfet style={{ textAlign: "center" }}>
          {kvittert === 1 ? "Vi har satt av en plass." : `Vi har satt av ${kvittert} plasser.`}
        </Tekst>
        <Tekst farget="myk" style={{ textAlign: "center" }}>
          {vilHaPaaminnelse
            ? "Du finner den under Mine påmeldinger, og får en påminnelse dagen før."
            : "Du finner den under Mine påmeldinger."}
        </Tekst>
        <View style={{ marginTop: rom.s, alignItems: "center" }}>{children}</View>
      </Animated.View>
    </Notis>
  );
}

/* ── Allergi ─────────────────────────────────────────────────────────── */

/**
 * De vanligste hensynene som avkryssbare brikker, pluss fritekst for det
 * som ikke står på lista. Færre som må skrive noe selv, betyr færre
 * misforståtte eller uleselige svar for den som skal handle inn.
 */
function AllergiVelger({
  valgt,
  annet,
  onEndreValgt,
  onEndreAnnet,
}: {
  valgt: string[];
  annet: string;
  onEndreValgt: (valgt: string[]) => void;
  onEndreAnnet: (annet: string) => void;
}) {
  function veksle(navn: string) {
    onEndreValgt(valgt.includes(navn) ? valgt.filter((v) => v !== navn) : [...valgt, navn]);
  }

  return (
    <View style={{ gap: rom.s }}>
      <Tekst halvfet>Allergi eller kosthold</Tekst>
      <View style={stil.brikkerad}>
        {VANLIGE_ALLERGIER.map((navn) => {
          const erValgt = valgt.includes(navn);
          return (
            <Pressable
              key={navn}
              onPress={() => veksle(navn)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: erValgt }}
              accessibilityLabel={navn}
              style={[stil.brikke, erValgt && stil.brikkeValgt]}
            >
              <Tekst variant="liten" farget={erValgt ? "papir" : "gran"} halvfet={erValgt}>
                {navn}
              </Tekst>
            </Pressable>
          );
        })}
      </View>
      <Felt
        etikett="Annet"
        placeholder="Valgfritt, skriv inn selv"
        value={annet}
        onChangeText={onEndreAnnet}
      />
    </View>
  );
}

/* ── Påmelding ───────────────────────────────────────────────────────── */

function Skjema({
  arrangement,
  ledige,
  alleredePameldt,
  onPameldt,
}: {
  arrangement: ArrangementMedAntall;
  ledige: number | null;
  alleredePameldt: boolean;
  onPameldt: () => void;
}) {
  const router = useRouter();
  const [navn, settNavn] = useState("");
  const [telefon, settTelefon] = useState("");
  const [epost, settEpost] = useState("");
  const [melding, settMelding] = useState("");
  const [deltakere, settDeltakere] = useState<Deltaker[]>([
    { navn: "", allergier: [], annet: "" },
  ]);
  const [rortForste, settRortForste] = useState(false);
  const [vilHaPaaminnelse, settVilHaPaaminnelse] = useState(true);
  const [sender, settSender] = useState(false);
  const [feil, settFeil] = useState<string | null>(null);
  const [feltfeil, settFeltfeil] = useState<Record<string, string>>({});
  const [kvittert, settKvittert] = useState<number | null>(null);

  // Profilen fyller ut skjemaet. useFocusEffect og ikke useEffect, slik at
  // navnet oppdaterer seg med én gang man kommer tilbake fra «Endre».
  useFocusEffect(
    useCallback(() => {
      hentProfil().then((p) => {
        if (!p) return;
        settNavn(p.navn);
        settTelefon((t) => t || p.telefon);
        settEpost((e) => e || p.epost);
      });
    }, []),
  );

  // Er man alt påmeldt, skal ikke feltet fylles ut med eget navn igjen —
  // da ville ett trykk på «Meld på» meldt på deg selv en gang til.
  const effektivtNavn = (d: Deltaker, i: number) =>
    i === 0 && !rortForste && !alleredePameldt ? navn : d.navn;
  const antall = deltakere.filter((d, i) => effektivtNavn(d, i).trim()).length;
  const kanLeggeTil =
    arrangement.tillat_flere && (ledige === null || deltakere.length < ledige);

  function endre(i: number, endring: Partial<Deltaker>) {
    settDeltakere((liste) => liste.map((d, j) => (j === i ? { ...d, ...endring } : d)));
  }

  async function send() {
    settSender(true);
    settFeil(null);
    settFeltfeil({});

    const pushToken = vilHaPaaminnelse ? await hentPushToken() : null;

    const svar = await meldPa({
      slug: arrangement.slug,
      kontaktNavn: navn,
      kontaktTelefon: telefon,
      kontaktEpost: epost,
      melding,
      pushToken,
      deltakere: deltakere.map((d, i) => ({
        navn: effektivtNavn(d, i),
        kosthold: kostholdTekst(d),
      })),
    });

    settSender(false);

    if (!svar.ok) {
      if (svar.feltfeil) settFeltfeil(svar.feltfeil);
      else settFeil(svar.feil);
      return;
    }

    const navnene = deltakere
      .map((d, i) => effektivtNavn(d, i).trim())
      .filter(Boolean);

    await Promise.all([
      lagreProfil({ navn, telefon, epost }),
      husk({
        pameldingId: svar.pameldingId,
        slug: arrangement.slug,
        tittel: arrangement.tittel,
        starter: arrangement.starter,
        sted: arrangement.sted,
        deltakere: navnene,
        meldtPa: new Date().toISOString(),
      }),
    ]);

    settKvittert(svar.antall);
    onPameldt();
  }

  if (kvittert !== null) {
    return (
      <Bekreftelse kvittert={kvittert} vilHaPaaminnelse={vilHaPaaminnelse}>
        <Kalenderknapp arrangement={arrangement} />
      </Bekreftelse>
    );
  }

  return (
    <View style={{ gap: rom.xl }}>
      <Tekst variant="mellom" halvfet>
        Meld på
      </Tekst>

      {alleredePameldt ? (
        <Notis>
          <Tekst variant="liten">
            Du står allerede oppført til dette. Her kan du melde på andre.
          </Tekst>
        </Notis>
      ) : null}

      {feil ? (
        <Notis tone="fare">
          <Tekst variant="liten" farget="rod">
            {feil}
          </Tekst>
        </Notis>
      ) : null}

      {/* Navnet kommer fra profilen. Telefon og e-post spør vi bare om når
          arrangementet faktisk krever det — ellers er påmeldingen ett trykk. */}
      <View style={{ gap: rom.l }}>
        <View style={stil.megrad}>
          <View style={{ flex: 1, gap: 2 }}>
            <Tekst variant="etikett" farget="myk">
              Du melder på som
            </Tekst>
            <Tekst variant="mellom" halvfet>
              {navn || "…"}
            </Tekst>
          </View>
          <Pressable
            onPress={() => router.push("/velkommen?rediger=1")}
            accessibilityRole="button"
            accessibilityLabel="Endre hvem du er"
            style={stil.endre}
          >
            <Tekst farget="messing" halvfet>
              Endre
            </Tekst>
          </Pressable>
        </View>

        {feltfeil.kontakt_navn ? (
          <Tekst variant="liten" farget="rod">
            {feltfeil.kontakt_navn}
          </Tekst>
        ) : null}

        {arrangement.krev_telefon ? (
          <Felt
            etikett="Telefon"
            hjelp="Dette arrangementet trenger et nummer vi kan ringe."
            value={telefon}
            onChangeText={settTelefon}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            feil={feltfeil.kontakt_telefon}
          />
        ) : null}

        {arrangement.krev_epost ? (
          <Felt
            etikett="E-post"
            hjelp="Dette arrangementet trenger en adresse vi kan sende til."
            value={epost}
            onChangeText={settEpost}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            feil={feltfeil.kontakt_epost}
          />
        ) : null}
      </View>

      <View style={{ gap: rom.l }}>
        <Tekst halvfet variant="mellom">
          {alleredePameldt ? "Hvem andre skal du melde på?" : "Hvem skal komme?"}
        </Tekst>
        {alleredePameldt ? (
          <Tekst variant="liten" farget="myk" style={{ marginTop: -rom.s }}>
            Deg selv trenger du ikke legge inn — du står allerede oppført.
          </Tekst>
        ) : arrangement.tillat_flere ? (
          <Tekst variant="liten" farget="myk" style={{ marginTop: -rom.s }}>
            Du kan melde på hele familien, en nabo eller noen fra bygda som ikke bruker mobil.
          </Tekst>
        ) : null}

        {deltakere.map((d, i) => (
          <View key={i} style={stil.deltaker}>
            <View style={stil.deltakertopp}>
              <View style={{ flex: 1 }}>
                <Felt
                  etikett={`Deltaker ${i + 1}`}
                  placeholder={i === 0 && !alleredePameldt ? "Fullt navn" : "Navn"}
                  value={effektivtNavn(d, i)}
                  onChangeText={(t) => {
                    if (i === 0) settRortForste(true);
                    endre(i, { navn: t });
                  }}
                  autoComplete="name"
                />
              </View>
              {deltakere.length > 1 ? (
                <Pressable
                  onPress={() => settDeltakere((liste) => liste.filter((_, j) => j !== i))}
                  accessibilityRole="button"
                  accessibilityLabel={`Fjern deltaker ${i + 1}`}
                  style={stil.fjern}
                >
                  <Tekst variant="mellom" farget="myk">
                    ×
                  </Tekst>
                </Pressable>
              ) : null}
            </View>

            {arrangement.sporr_om_kost ? (
              <AllergiVelger
                valgt={d.allergier}
                annet={d.annet}
                onEndreValgt={(allergier) => endre(i, { allergier })}
                onEndreAnnet={(annet) => endre(i, { annet })}
              />
            ) : null}
          </View>
        ))}

        {feltfeil.deltaker_navn ? (
          <Tekst variant="liten" farget="rod">
            {feltfeil.deltaker_navn}
          </Tekst>
        ) : null}

        {kanLeggeTil ? (
          <Knapp
            tittel="Legg til én til"
            variant="stille"
            onPress={() =>
              settDeltakere((liste) => [...liste, { navn: "", allergier: [], annet: "" }])
            }
          />
        ) : ledige !== null ? (
          <Tekst variant="liten" farget="myk">
            Det er {ledige} {ledige === 1 ? "plass" : "plasser"} igjen.
          </Tekst>
        ) : null}
      </View>

      <Felt
        etikett="Kommentar"
        value={melding}
        onChangeText={settMelding}
        multiline
        numberOfLines={4}
        style={{ minHeight: 110, textAlignVertical: "top" }}
      />

      <Avkryss
        merket={vilHaPaaminnelse}
        onEndre={settVilHaPaaminnelse}
        tekst="Minn meg på dagen før"
        hjelp="Vi sender ett varsel dagen før arrangementet. Ingenting annet."
      />

      <View style={{ gap: rom.m, alignItems: "flex-start" }}>
        <Knapp
          tittel={antall > 1 ? `Meld på ${antall} personer` : "Meld på"}
          onPress={send}
          travel={sender}
          fyllBredde
        />
      </View>
    </View>
  );
}

/* ── Stengt ──────────────────────────────────────────────────────────── */

function Stengt({ grunn }: { grunn: "stengt" | "fullt" | "over" }) {
  const tekst = {
    fullt: {
      tittel: "Det er fullt",
      brod: "Alle plassene er tatt. Sjekk gjerne igjen senere — det hender noen melder avbud.",
    },
    stengt: {
      tittel: "Påmeldingen er stengt",
      brod: "Fristen har gått ut, men det er ofte plass likevel. Sjekk gjerne igjen senere.",
    },
    over: {
      tittel: "Dette har vært",
      brod: "Arrangementet er over. Se hva som kommer under Hva skjer.",
    },
  }[grunn];

  return (
    <Notis>
      <Tekst variant="mellom" halvfet>
        {tekst.tittel}
      </Tekst>
      <Tekst farget="myk">{tekst.brod}</Tekst>
    </Notis>
  );
}

const stil = StyleSheet.create({
  innhold: { padding: rom.l, paddingBottom: rom.xxxl * 2, gap: rom.xl },
  midt: { flex: 1, alignItems: "center", justifyContent: "center", padding: rom.l },
  hode: { flexDirection: "row", gap: rom.l },
  hodekant: { width: 3, borderRadius: 2 },
  fakta: { borderTopWidth: 1, borderTopColor: farge.strek },
  faktarad: {
    paddingVertical: rom.m,
    borderBottomWidth: 1,
    borderBottomColor: farge.strekSvak,
    gap: 2,
  },
  faktanavn: { width: 120 },
  faktaverdi: { flexDirection: "row", alignItems: "center", gap: rom.s },
  prikk: { width: 8, height: 8, borderRadius: 4 },
  hakesirkel: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: farge.gran,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: rom.s,
  },
  hakestrek: {
    width: 16,
    height: 28,
    borderRightWidth: 3.5,
    borderBottomWidth: 3.5,
    borderColor: farge.papir,
    transform: [{ rotate: "45deg" }],
    marginTop: -6,
  },
  skille: { height: 1, backgroundColor: farge.strek },
  brikkerad: { flexDirection: "row", flexWrap: "wrap", gap: rom.s },
  brikke: {
    minHeight: TREFF,
    paddingHorizontal: rom.m,
    justifyContent: "center",
    borderRadius: radius.knapp,
    borderWidth: 1,
    borderColor: farge.strek,
    backgroundColor: farge.papir,
  },
  brikkeValgt: { backgroundColor: farge.gran, borderColor: farge.gran },
  deltaker: {
    gap: rom.m,
    paddingBottom: rom.m,
    borderBottomWidth: 1,
    borderBottomColor: farge.strekSvak,
  },
  deltakertopp: { flexDirection: "row", alignItems: "flex-end", gap: rom.s },
  megrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: rom.m,
    backgroundColor: farge.papir,
    borderWidth: 1,
    borderColor: farge.strek,
    borderRadius: 4,
    paddingVertical: rom.m,
    paddingHorizontal: rom.l,
  },
  endre: { minHeight: TREFF, justifyContent: "center", paddingHorizontal: rom.s },
  fjern: {
    width: TREFF,
    height: TREFF,
    alignItems: "center",
    justifyContent: "center",
  },
});
