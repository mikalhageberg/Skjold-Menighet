import { useEffect, useState } from "react";
import { Redirect, Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
} from "@expo-google-fonts/schibsted-grotesk";
import { farge, skrift, storrelse } from "@/design/tema";
import { meldInnEnhet } from "@/lib/varsler";
import { hentProfil } from "@/lib/profil";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Rot() {
  // Har telefonen ingen profil, er dette første gang appen åpnes.
  const [harProfil, settHarProfil] = useState<boolean | null>(null);
  useEffect(() => {
    hentProfil().then((p) => settHarProfil(Boolean(p)));
  }, []);

  const [klar, feil] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_600SemiBold,
  });

  // Telefonen melder seg inn ved hver oppstart, uten å spørre om noe.
  // Har man alt sagt ja til varsler, holder det tokenet ferskt; har man
  // ikke det, skjer det ingenting her.
  useEffect(() => {
    meldInnEnhet().catch(() => {});
  }, []);

  // Trykker man på et varsel, skal man havne på det arrangementet varselet
  // handlet om — ikke på forsiden, der man må lete seg fram igjen.
  useEffect(() => {
    const abonnement = Notifications.addNotificationResponseReceivedListener((svar) => {
      const slug = svar.notification.request.content.data?.slug;
      if (typeof slug === "string" && slug) {
        router.push(`/arrangement/${slug}?fra=Varsel`);
      }
    });
    return () => abonnement.remove();
  }, []);

  useEffect(() => {
    // Vis appen selv om skriftene ikke lastet — systemfonten er bedre enn
    // et splash-bilde som aldri går bort.
    if ((klar || feil) && harProfil !== null) SplashScreen.hideAsync().catch(() => {});
  }, [klar, feil, harProfil]);

  if ((!klar && !feil) || harProfil === null) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: farge.kalk },
          headerStyle: { backgroundColor: farge.kalk },
          headerShadowVisible: false,
          headerTintColor: farge.gran,
          headerTitleStyle: {
            fontFamily: skrift.display,
            fontSize: storrelse.brod,
            color: farge.gran,
          },
          headerBackTitle: "Tilbake",
        }}
      >
        <Stack.Screen name="(faner)" options={{ headerShown: false }} />
        <Stack.Screen name="velkommen" options={{ headerShown: false }} />
        {/* Arrangementssiden har sin egen tilbakeknapp. Systemets henter
            teksten fra forrige skjerm, og fanene har ingen header å hente
            den fra — og kommer man hit fra et varsel, er det ingen skjerm
            bak i det hele tatt. */}
        <Stack.Screen name="arrangement/[slug]" options={{ headerShown: false }} />
      </Stack>
      {!harProfil && <Redirect href="/velkommen" />}
    </>
  );
}
