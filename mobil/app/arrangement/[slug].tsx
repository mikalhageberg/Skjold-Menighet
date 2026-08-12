import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
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
  frivilligtekst,
  klokka,
  maned,
  nartid,
  pameldingsstatus,
  sesongFor,
  tidsrom,
  ukedag,
  type ArrangementMedAntall,
  type Frivillig,
} from "@skjold/delt";
import { API_BASE, hentArrangement, meldPa } from "@/lib/api";
import { husk, erPameldt } from "@/lib/lager";
import { hentProfil, lagreProfil } from "@/lib/profil";
import { hentPushToken } from "@/lib/varsler";
import { leggIKalender } from "@/lib/kalender";
import { Felt, Knapp, Notis, Tekst } from "@/design/Grunnelementer";
import { farge, radius, rom, TREFF } from "@/design/tema";

export default function Arrangementsside() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [arrangement, settArrangement] = useState<ArrangementMedAntall | null>(null);
  const [frivillige, settFrivillige] = useState<Frivillig[]>([]);
  const [lastefeil, settLastefeil] = useState<string | null>(null);
  const [alleredePameldt, settAlleredePameldt] = useState(false);

  const last = useCallback(async () => {
    try {
      const [svar, pameldt] = await Promise.all([hentArrangement(slug), erPameldt(slug)]);
      settArrangement(svar.arrangement);
      settFrivillige(svar.frivillige);
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
          {arrangement.bilde_generert ? (
            <Image
              source={{
                uri: `${API_BASE}/api/offentlig/bilde/${arrangement.id}?v=${encodeURIComponent(arrangement.bilde_generert)}`,
              }}
              style={stil.bilde}
              accessibilityIgnoresInvertColors
            />
          ) : null}

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
            <Fakta navn="Frivillige">{frivilligtekst(arrangement)}</Fakta>
            {arrangement.ansvarlig_navn ? (
              <Fakta navn="Ansvarlig">{arrangement.ansvarlig_navn}</Fakta>
            ) : null}
            <Fakta navn="I kirkeåret" prikk={sesong.farge}>
              {sesong.navn} — {sesong.fargenavn} parament
            </Fakta>
          </View>

          {/* Påmeldingen står over beskrivelsen. Den som bare skal si ja,
              skal slippe å bla gjennom hele teksten for å finne knappen. */}
          {alleredePameldt ? (
            <AlleredeMed arrangement={arrangement} />
          ) : status.apen ? (
            <Skjema arrangement={arrangement} onPameldt={last} />
          ) : (
            <Stengt grunn={status.grunn} />
          )}

          <Frivilligliste frivillige={frivillige} />

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

/* ── Hvem har meldt seg ──────────────────────────────────────────────── */

/**
 * Lista over dem som alt har sagt ja. Den står åpent for alle, hele tiden:
 * det er lettere å melde seg når man ser at naboen har gjort det, og man
 * slipper å bli tre om det samme når det står hva hver enkelt tar.
 */
function Frivilligliste({ frivillige }: { frivillige: Frivillig[] }) {
  return (
    <View style={{ gap: rom.m }}>
      <Tekst variant="mellom" halvfet>
        Hvem har meldt seg
      </Tekst>

      {frivillige.length === 0 ? (
        <Tekst farget="myk">Ingen ennå. Du kan bli den første.</Tekst>
      ) : (
        <View style={{ gap: rom.m }}>
          {frivillige.map((f, i) => (
            <View key={i} style={stil.frivillig}>
              <Tekst halvfet>{f.navn}</Tekst>
              {f.bidrag ? (
                <Tekst variant="liten" farget="myk">
                  {f.bidrag}
                </Tekst>
              ) : null}
            </View>
          ))}
        </View>
      )}
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
 * Kvitteringen etter at man har sagt ja. Haken tegnes med en fjærende
 * skalering, så det er tydelig at trykket faktisk ble til noe — viktig når
 * man ikke får en e-post å lene seg på.
 */
function Bekreftelse({
  varsler,
  children,
}: {
  varsler: boolean;
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
          Du står på lista
        </Tekst>
        <Tekst variant="mellom" halvfet style={{ textAlign: "center" }}>
          Takk for at du stiller.
        </Tekst>
        <Tekst farget="myk" style={{ textAlign: "center" }}>
          {varsler
            ? "Du finner vakta under Mine vakter, og får en påminnelse dagen før."
            : "Du finner vakta under Mine vakter. Skru på varsler om du vil ha påminnelse dagen før."}
        </Tekst>
        <View style={{ marginTop: rom.s, alignItems: "center" }}>{children}</View>
      </Animated.View>
    </Notis>
  );
}

/* ── Står allerede på lista ──────────────────────────────────────────── */

function AlleredeMed({ arrangement }: { arrangement: ArrangementMedAntall }) {
  const router = useRouter();

  return (
    <Notis tone="klar">
      <Tekst variant="mellom" halvfet>
        Du har sagt ja til dette
      </Tekst>
      <Tekst farget="myk">
        Blir du forhindret, melder du avbud under Mine vakter. Da får de andre med appen
        beskjed om at det trengs en avløser — du slipper å ringe rundt selv.
      </Tekst>
      <View style={{ marginTop: rom.s, alignItems: "flex-start", gap: rom.m }}>
        <Knapp
          tittel="Gå til Mine vakter"
          variant="stille"
          onPress={() => router.push("/mine")}
        />
      </View>
    </Notis>
  );
}

/* ── Å si ja ─────────────────────────────────────────────────────────── */

function Skjema({
  arrangement,
  onPameldt,
}: {
  arrangement: ArrangementMedAntall;
  onPameldt: () => void;
}) {
  const router = useRouter();
  const [navn, settNavn] = useState("");
  const [telefon, settTelefon] = useState("");
  const [epost, settEpost] = useState("");
  const [bidrag, settBidrag] = useState("");
  const [sender, settSender] = useState(false);
  const [feil, settFeil] = useState<string | null>(null);
  const [feltfeil, settFeltfeil] = useState<Record<string, string>>({});
  const [kvittert, settKvittert] = useState<{ varsler: boolean } | null>(null);

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

  async function send() {
    settSender(true);
    settFeil(null);
    settFeltfeil({});

    // Har man alt sagt ja til varsler, følger tokenet med så påminnelsen
    // dagen før finner riktig telefon. Har man ikke det, spør vi ikke her —
    // det spørsmålet ble stilt i velkomsten.
    const pushToken = await hentPushToken({ spor: false });

    const svar = await meldPa({
      slug: arrangement.slug,
      navn,
      telefon,
      epost,
      bidrag,
      pushToken,
    });

    settSender(false);

    if (!svar.ok) {
      if (svar.feltfeil) settFeltfeil(svar.feltfeil);
      else settFeil(svar.feil);
      return;
    }

    await Promise.all([
      lagreProfil({ navn, telefon, epost }),
      husk({
        pameldingId: svar.pameldingId,
        slug: arrangement.slug,
        tittel: arrangement.tittel,
        starter: arrangement.starter,
        sted: arrangement.sted,
        bidrag: bidrag.trim() || null,
        meldtPa: new Date().toISOString(),
      }),
    ]);

    settKvittert({ varsler: Boolean(pushToken) });
    onPameldt();
  }

  if (kvittert !== null) {
    return (
      <Bekreftelse varsler={kvittert.varsler}>
        <Kalenderknapp arrangement={arrangement} />
      </Bekreftelse>
    );
  }

  return (
    <View style={{ gap: rom.xl }}>
      <Tekst variant="mellom" halvfet>
        Jeg kan hjelpe
      </Tekst>

      {feil ? (
        <Notis tone="fare">
          <Tekst variant="liten" farget="rod">
            {feil}
          </Tekst>
        </Notis>
      ) : null}

      {/* Navnet kommer fra profilen. Telefon og e-post spør vi bare om når
          oppgaven faktisk krever det — ellers er det å si ja ett trykk. */}
      <View style={{ gap: rom.l }}>
        <View style={stil.megrad}>
          <View style={{ flex: 1, gap: 2 }}>
            <Tekst variant="etikett" farget="myk">
              Du melder deg som
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

        {feltfeil.navn ? (
          <Tekst variant="liten" farget="rod">
            {feltfeil.navn}
          </Tekst>
        ) : null}

        {arrangement.krev_telefon ? (
          <Felt
            etikett="Telefon"
            hjelp="Til denne oppgaven trenger den ansvarlige et nummer å ringe."
            value={telefon}
            onChangeText={settTelefon}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            feil={feltfeil.telefon}
          />
        ) : null}

        {arrangement.krev_epost ? (
          <Felt
            etikett="E-post"
            hjelp="Til denne oppgaven trenger den ansvarlige en adresse å sende til."
            value={epost}
            onChangeText={settEpost}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            feil={feltfeil.epost}
          />
        ) : null}
      </View>

      <Felt
        etikett="Jeg bidrar med"
        hjelp="Valgfritt, men til god hjelp: «to kaker», «kjører bussen», «kan komme fra kl. 16»."
        placeholder="Skriv gjerne hva du tar"
        value={bidrag}
        onChangeText={settBidrag}
        multiline
        numberOfLines={3}
        style={{ minHeight: 90, textAlignVertical: "top" }}
      />

      <View style={{ gap: rom.m, alignItems: "flex-start" }}>
        <Knapp tittel="Jeg kan hjelpe" onPress={send} travel={sender} fyllBredde />
      </View>
    </View>
  );
}

/* ── Stengt ──────────────────────────────────────────────────────────── */

function Stengt({ grunn }: { grunn: "stengt" | "nok" | "over" }) {
  const tekst = {
    nok: {
      tittel: "Vi har folk nok",
      brod: "Alle plassene er tatt. Sjekk gjerne igjen senere — det hender noen melder avbud, og da får du beskjed.",
    },
    stengt: {
      tittel: "Fristen har gått ut",
      brod: "Vil du hjelpe likevel, ta kontakt med den ansvarlige.",
    },
    over: {
      tittel: "Dette har vært",
      brod: "Se hva som trenger folk framover under Vi trenger deg.",
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
  bilde: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.kort,
    backgroundColor: farge.kalkDyp,
  },
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
  frivillig: {
    gap: 2,
    paddingLeft: rom.m,
    borderLeftWidth: 2,
    borderLeftColor: farge.strek,
  },
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
});
