import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Felt, Knapp, Tekst } from "@/design/Grunnelementer";
import { farge, rom } from "@/design/tema";
import { hentProfil, lagreProfil } from "@/lib/profil";
import { meldInnEnhet } from "@/lib/varsler";

/**
 * Det første man møter. Ett spørsmål — hva heter du — og så er man i gang.
 *
 * Ingen konto, ingen kode, ingen passord. Hensikten er ikke å vite hvem folk
 * er, men å slippe å spørre om det samme hver eneste gang de sier ja til en
 * oppgave. Telefon og e-post er frivillig her; vi maser bare hvis en oppgave
 * faktisk trenger det.
 *
 * Her spør vi også om lov til å sende varsler. Det er det eneste stedet det
 * gir mening: det viktigste varselet — «kan noen steppe inn?» — går jo til
 * dem som ennå ikke har sagt ja til noe.
 */
export default function Velkommen() {
  const router = useRouter();
  const { rediger } = useLocalSearchParams<{ rediger?: string }>();
  const redigerer = rediger === "1";

  const [navn, settNavn] = useState("");
  const [telefon, settTelefon] = useState("");
  const [epost, settEpost] = useState("");
  const [feil, settFeil] = useState<string | null>(null);
  const [lagrer, settLagrer] = useState(false);

  useEffect(() => {
    hentProfil().then((p) => {
      if (!p) return;
      settNavn(p.navn);
      settTelefon(p.telefon);
      settEpost(p.epost);
    });
  }, []);

  async function lagre() {
    if (!navn.trim()) {
      settFeil("Skriv inn navnet ditt, så er vi i gang.");
      return;
    }
    settLagrer(true);
    await lagreProfil({ navn, telefon, epost });
    // Bare første gang. Den som redigerer navnet sitt skal ikke få
    // spørsmålet om varsler slengt i ansiktet på nytt.
    if (!redigerer) await meldInnEnhet({ spor: true });
    settLagrer(false);
    if (redigerer && router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: redigerer ? "Om deg" : "",
          headerShown: redigerer,
          gestureEnabled: redigerer,
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: farge.kalk }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={stil.innhold} keyboardShouldPersistTaps="handled">
          {!redigerer && (
            <View style={stil.hode}>
              <View style={stil.merke}>
                <View style={[stil.stripe, { backgroundColor: "#59468c" }]} />
                <View style={[stil.stripe, { backgroundColor: "#a07a1c" }]} />
                <View style={[stil.stripe, { backgroundColor: "#99332a" }]} />
                <View style={[stil.stripe, { backgroundColor: "#3d6b55" }]} />
              </View>
              <Tekst variant="etikett" farget="myk">
                Velkommen
              </Tekst>
              <Tekst variant="stor" halvfet>
                Skjold menighet
              </Tekst>
              <Tekst farget="myk">
                Her ser du hva menigheten trenger hjelp til, og sier ja til det som passer
                for deg. Skriv navnet ditt én gang, så slipper du å fylle ut det samme hver
                gang.
              </Tekst>
            </View>
          )}

          <View style={{ gap: rom.l }}>
            <Felt
              etikett="Hva heter du?"
              value={navn}
              onChangeText={(t) => {
                settNavn(t);
                settFeil(null);
              }}
              placeholder="Fornavn og etternavn"
              autoComplete="name"
              textContentType="name"
              autoFocus={!redigerer}
              feil={feil ?? undefined}
            />

            <Felt
              etikett="Telefon (valgfritt)"
              hjelp="Noen oppgaver trenger et nummer den ansvarlige kan ringe. Da er det allerede utfylt."
              value={telefon}
              onChangeText={settTelefon}
              placeholder="900 00 000"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />

            <Felt
              etikett="E-post (valgfritt)"
              hjelp="Brukes bare hvis den ansvarlige må sende ut noe i forkant."
              value={epost}
              onChangeText={settEpost}
              placeholder="navn@eksempel.no"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>

          <View style={{ gap: rom.m, alignItems: "stretch" }}>
            <Knapp
              tittel={redigerer ? "Lagre" : "Kom i gang"}
              onPress={lagre}
              travel={lagrer}
              fyllBredde
            />
            {!redigerer && (
              <Tekst variant="liten" farget="svak">
                Alt du skriver her blir liggende på telefonen din. Vi sender ingenting til
                menigheten før du sier ja til noe. Etterpå spør vi om lov til å varsle deg
                når det trengs folk — du kan si nei, og likevel bruke appen.
              </Tekst>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const stil = StyleSheet.create({
  innhold: {
    padding: rom.xl,
    paddingTop: rom.xxxl,
    paddingBottom: rom.xxxl * 2,
    gap: rom.xxl,
  },
  hode: { gap: rom.s },
  // Kirkeåret i miniatyr — samme merke som appikonet.
  merke: { flexDirection: "row", gap: 3, marginBottom: rom.l },
  stripe: { width: 18, height: 5, borderRadius: 1 },
});
