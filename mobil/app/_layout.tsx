import { useEffect, useState } from "react";
import { Redirect, Stack } from "expo-router";
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
import { forberedAndroidKanal } from "@/lib/varsler";
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

  useEffect(() => {
    forberedAndroidKanal().catch(() => {});
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
        <Stack.Screen
          name="arrangement/[slug]"
          options={({ route }) => ({
            title: "",
            headerBackTitle: (route.params as { fra?: string } | undefined)?.fra || "Tilbake",
          })}
        />
      </Stack>
      {!harProfil && <Redirect href="/velkommen" />}
    </>
  );
}
